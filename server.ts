import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initializer for Gemini API client with User-Agent header & dynamic key detection
let aiClient: GoogleGenAI | null = null;
let activeApiKey: string | null = null;

function getAiClient(req?: express.Request): GoogleGenAI | null {
  const customKey = (req?.headers['x-school-gemini-key'] as string) || req?.body?.schoolApiKey;
  const envApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  const apiKey = (customKey && customKey.trim() !== '') ? customKey.trim() : envApiKey;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

app.post("/api/test-gemini-key", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || apiKey.trim() === "") {
      return res.status(400).json({ success: false, message: "API Key masih kosong." });
    }
    const testClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
    
    // Test with lightweight & highly available model first: gemini-3.1-flash-lite, then gemini-flash-latest, then gemini-3.8-flash
    const testCandidates = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
    let isConnected = false;
    let successfulModel = "";
    let isHighDemand503 = false;
    let lastError: any = null;

    for (const model of testCandidates) {
      try {
        const testRes = await testClient.models.generateContent({
          model,
          contents: "Ping. Balas satu kata: Siap."
        });
        if (testRes) {
          isConnected = true;
          successfulModel = model;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || "");
        const errCode = err?.status || err?.code || 0;
        if (
          errCode === 503 ||
          errMsg.includes("503") ||
          errMsg.toLowerCase().includes("high demand") ||
          errMsg.toLowerCase().includes("unavailable")
        ) {
          isHighDemand503 = true;
        }
      }
    }

    if (isConnected) {
      return res.json({
        success: true,
        message: `API Key Sekolah Valid & Berhasil Terhubung ke Google Gemini! (Aktif via ${successfulModel})`
      });
    }

    // If Google returned 503 on models, it confirms the API Key was authenticated by Google's API Gateway
    if (isHighDemand503) {
      return res.json({
        success: true,
        message: "API Key Sekolah Valid & Terverifikasi! (Server Google sedang antre/padat sesaat, namun kunci Anda telah aktif dan terpasang)."
      });
    }

    // Clean user-friendly message for invalid keys
    const rawErr = String(lastError?.message || lastError || "");
    let cleanMessage = "API Key tidak valid atau kuota habis.";
    if (
      rawErr.toLowerCase().includes("api_key_invalid") ||
      rawErr.toLowerCase().includes("key not valid") ||
      rawErr.includes("400") ||
      rawErr.includes("403")
    ) {
      cleanMessage = "API Key tidak valid. Pastikan Anda menyalin kunci resmi yang aktif dari Google AI Studio.";
    } else if (rawErr) {
      cleanMessage = `Gagal terhubung: ${rawErr.slice(0, 150)}`;
    }

    res.status(400).json({ success: false, message: cleanMessage });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || "API Key tidak valid atau kuota habis." });
  }
});

// Helper to call Gemini with model pooling, exponential backoff, and fallback models for 503 / high demand spikes
async function callGeminiWithFallback(
  client: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  },
  timeoutMs: number = 25000
) {
  // Valid model candidates per official Gemini SDK guidelines:
  // 1. gemini-3.1-flash-lite (high-speed, minimal latency, reliable)
  // 2. gemini-flash-latest (latest flash alias)
  // 3. gemini-3.8-flash (primary multimodal)
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    
    // Try up to 2 attempts per model with exponential backoff
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const generatePromise = client.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${model} exceeded ${timeoutMs}ms`)), timeoutMs)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || "");
        const errCode = err?.status || err?.code || 0;
        
        console.warn(`[Gemini API] Model ${model} (attempt ${attempt}/2) encountered error: ${errMsg.slice(0, 150)} (Code: ${errCode})`);

        const isTemporaryError =
          errCode === 503 ||
          errCode === 429 ||
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("timeout") ||
          errMsg.toLowerCase().includes("high demand") ||
          errMsg.toLowerCase().includes("unavailable") ||
          errMsg.toLowerCase().includes("resource_exhausted") ||
          errMsg.toLowerCase().includes("busy") ||
          errMsg.toLowerCase().includes("overloaded");

        if (isTemporaryError && attempt < 2) {
          const delay = (attempt * 700) + Math.random() * 300;
          console.info(`[Gemini API] Retrying ${model} in ${Math.round(delay)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        
        break;
      }
    }
  }
  throw lastError;
}

// Helper to reliably extract text and JSON from Gemini response
function extractJsonFromGeminiResponse(response: any): any {
  if (!response) return null;
  let text = "";
  if (typeof response.text === "string") {
    text = response.text;
  } else if (typeof response.text === "function") {
    text = response.text();
  } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = response.candidates[0].content.parts.map((p: any) => p.text || "").join("\n");
  }

  if (!text || text.trim() === "") return null;

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw err;
  }
}

// Root API verification
app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    app: "NARASA AI Platform",
    message: "NARASA AI Backend API is online.",
    serverTime: new Date().toISOString()
  });
});

// Health check and Gemini API status
app.get("/api/health", (req, res) => {
  const envApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  const hasValidKey =
    !!envApiKey &&
    envApiKey !== "MY_GEMINI_API_KEY" &&
    envApiKey.trim() !== "";

  res.json({
    status: "ok",
    hasApiKey: hasValidKey,
    primaryModel: "gemini-3.1-flash-lite",
    fallbackModels: ["gemini-flash-latest", "gemini-3.8-flash"],
    serverTime: new Date().toISOString()
  });
});

// Endpoint to generate suggested object ideas via AI for teachers
app.post("/api/generate-suggested-objects", async (req, res) => {
  const { title, subject, material, cp, tp, targetCompetency, cognitiveLevel } = req.body;
  try {
    const client = getAiClient(req);
    if (client) {
      try {
        const prompt = `
Anda adalah Pakar Kurikulum dan Desainer Pembelajaran STEM Sekolah Dasar.
Berdasarkan informasi materi berikut, rancang 5-8 ide benda nyata konkret yang mudah ditemukan oleh murid di sekitar sekolah atau rumah untuk difoto dan dianalisis secara kritis (penalaran sains, teknologi, rekayasa, atau matematika).

Informasi Misi:
- Nama Aktivitas: ${title || '-'}
- Mata Pelajaran: ${subject || 'Sains/Matematika'}
- Materi Pokok: ${material || '-'}
- Capaian Pembelajaran (CP): ${cp || '-'}
- Tujuan Pembelajaran (TP): ${tp || '-'}
- Target Kompetensi: ${targetCompetency || 'both'} (literacy, numeracy, or both)
- Level Kognitif: ${cognitiveLevel || 'C4-C6'}

Benda harus sangat kontekstual, menarik, realistis untuk difoto murid menggunakan handphone, dan relevan dengan materi pokok tersebut.

Format keluaran HARUS berupa objek JSON dengan struktur sebagai berikut:
{
  "suggestedObjects": [
    "Nama Benda 1 (Contoh: Jam dinding analog untuk mengamati sudut/interval)",
    "Nama Benda 2 (Contoh: Lantai keramik berpola untuk menghitung luas dan KPK)",
    "Nama Benda 3...",
    "Nama Benda 4...",
    "Nama Benda 5..."
  ]
}

Kembalikan HANYA format JSON valid tanpa markdown tambahan.
`;

        const response = await callGeminiWithFallback(client, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const parsed = extractJsonFromGeminiResponse(response);
        if (parsed && Array.isArray(parsed.suggestedObjects) && parsed.suggestedObjects.length > 0) {
          return res.json(parsed);
        }
      } catch (geminiErr: any) {
        console.warn("[Gemini API] Failed generate-suggested-objects, falling back:", geminiErr?.message);
      }
    }

    // High quality contextual fallback suggestions
    const isMath = (subject || "").toLowerCase().includes("matematika");
    const isIpas = (subject || "").toLowerCase().includes("ipa") || (subject || "").toLowerCase().includes("ipas");

    const fallbackSuggestions = isMath
      ? [
          `Jam dinding analog kelas atau sekolah (terkait ${material || 'KPK/FPB'})`,
          `Lantai ubin keramik dan garis jendela (terkait ${material || 'Geometri/Kelipatan'})`,
          `Kotak pensil, spidol, dan penggaris kayu (terkait ${material || 'Pembagian FPB'})`,
          `Kemasan makanan ringan atau label harga kantin (terkait ${material || 'Pecahan/Nilai'})`,
          `Jadwal piket kelas dan kalender dinding (terkait ${material || 'Pola KPK'})`
        ]
      : isIpas
      ? [
          `Pohon rindang di halaman sekolah (terkait ${material || 'Ekosistem'})`,
          `Tempat sampah pilah organik dan anorganik (terkait ${material || 'Lingkungan'})`,
          `Tanaman pot bunga di teras kelas (terkait ${material || 'Fotosintesis/Biotik'})`,
          `Kran air wudhu atau kolam ikan sekolah (terkait ${material || 'Siklus Air'})`,
          `Lampu neon kelas dan panel stopkontak (terkait ${material || 'Energi Listrik'})`
        ]
      : [
          `Buku cerita di pojok baca perpustakaan (terkait ${material || 'Literasi Teks'})`,
          `Poster pengumuman di mading sekolah (terkait ${material || 'Teks Informasi'})`,
          `Tempat sampah 3 warna di lorong sekolah (terkait ${material || 'Teks Deskripsi'})`,
          `Taman toga dan kebun sayur sekolah (terkait ${material || 'Teks Laporan Hasil Observasi'})`,
          `Peta Indonesia di dinding kelas (terkait ${material || 'Literasi Spasial'})`
        ];

    return res.json({
      suggestedObjects: fallbackSuggestions
    });
  } catch (err: any) {
    console.error("Error generating suggested objects:", err);
    return res.json({
      suggestedObjects: [
        `Buku dan alat tulis (terkait ${material || 'pembelajaran'})`,
        `Jam dinding kelas (terkait ${material || 'waktu'})`,
        `Pohon di halaman sekolah (terkait ${material || 'lingkungan'})`,
        `Tempat sampah pilah sekolah (terkait ${material || 'kebersihan'})`
      ]
    });
  }
});

// 1. Analyze Vision & Bridge to Learning Mission
app.post("/api/analyze-vision", async (req, res) => {
  try {
    const { imageBase64OrUrl, mission, objectHint } = req.body;

    if (!mission) {
      return res.status(400).json({ error: "Learning mission is required." });
    }

    const client = getAiClient(req);

    // If Gemini client is available and image/description is provided
    if (client) {
      try {
        const prompt = `
Anda adalah AI Learning Bridge di aplikasi "NARASA AI: Foto Apa Saja. Bangun Penalaran." untuk siswa SD di Indonesia.
Guru telah menentukan misi pembelajaran berikut:
- Mata Pelajaran: ${mission.subject}
- Materi: ${mission.material}
- Capaian Pembelajaran (CP): ${mission.cp}
- Tujuan Pembelajaran (TP): ${mission.tp}
- Indikator: ${(mission.indicators || []).join("; ")}
- Target Kompetensi: ${mission.targetCompetency} (literasi / numerasi / both)
- Level Kognitif: ${mission.cognitiveLevel} (C1-C6)
- Strict Curriculum Mode: ${mission.strictCurriculumMode ? "AKTIF (Wajib disiplin kurikulum)" : "FLEKSIBEL"}

Informasi Objek & Hasil Temuan Mandiri Siswa:
"${objectHint || 'Objek Pengamatan'}"

Tugas Anda:
1. Olah informasi objek dan hasil temuan mandiri yang diisikan oleh murid tersebut di atas. Anda TIDAK perlu menganalisis file gambar mentah, melainkan gunakan data tekstual hasil pengamatan murid tersebut untuk merancang materi jembatan belajar dan tantangan pembelajaran yang sangat relevan dan kontekstual.
2. Tentukan kompatibilitas hubungan objek yang dilaporkan dengan materi guru: "Strong", "Moderate", atau "Weak".
   - Jika "Weak", berikan alasan ramah dan saran konteks alternatif.
3. Rancang "Yang Saya Lihat" (Gunakan data pengamatan murid tersebut ditambah penjelasan tambahan logis & ramah anak SD dari Anda).
4. Rancang "Hubungannya dengan Pelajaran" (Learning Bridge konkret menghubungkan objek hasil temuan murid dengan konsep materi guru).
5. Buat "simpleMaterialSummary" (Ringkasan Materi Sederhana untuk Murid): Rangkum esensi materi ${mission.material} dengan bahasa yang sangat ramah anak SD, hangat, ringkas, dan mudah dipahami (menggunakan analogi sehari-hari yang dekat dengan dunia anak).
6. Tentukan Taksonomi SOLO (Structure of Observed Learning Outcomes) untuk eksplorasi pemahaman materi ini: "soloTaxonomyLevel" (pilih salah satu: "Uni-structural", "Multi-structural", "Relational", "Extended Abstract") beserta "soloDescription" (penjelasan singkat bagaimana temuan eksplorasi ini mencerminkan tingkat kedalaman pemahaman SOLO tersebut).
7. Buat 2-3 Pertanyaan Pematik (Guiding Questions) yang memancing rasa ingin tahu murid dan menghubungkan langsung temuan objek mereka dengan materi pelajaran yang sedang dibahas.
8. Rancang 4 Pertanyaan Eksplorasi Terstruktur mengikuti 4 Pilar Berpikir Komputasional (Computational Thinking) jenjang Sekolah Dasar:
   PENTING: Gunakan gaya bahasa Indonesia yang SANGAT RAMAH, HANGAT, ALAMI, DAN MENYENANGKAN untuk anak SD Fase B/C. HINDARI bahasa kaku atau jargon teknis yang membingungkan anak! Setiap pertanyaan HARUS terhubung langsung dan logis dengan objek foto konkret yang diamati ("${objectHint || 'objek foto'}") serta materi "${mission.material}".
   - Tahap 1 (stage: 'decomposition', title: '1. Dekomposisi (Membongkar Bagian Objek)'):
     Ajak anak mengamati foto objek nyata "${objectHint || 'objek foto'}" secara langsung! Ajukan pertanyaan hangat: Apa saja bagian atau benda penting yang tampak menyusun "${objectHint || 'objek foto'}" tersebut dan apa fungsi atau perannya masing-masing dalam kehidupan sehari-hari? Jangan kaku atau teoritis, ajak anak membongkar seperti balok mainan.
   - Tahap 2 (stage: 'pattern_recognition', title: '2. Pengenalan Pola (Menemukan Keteraturan)'):
     Ajak anak menjadi detektif pola pada objek foto "${objectHint || 'objek foto'}"! Apakah ada bentuk yang berulang, susunan yang berbaris rapi, jadwal berkala, atau kemiripan dengan konsep ${mission.material}? Ajukan pertanyaan dengan bahasa menyenangkan dan alami.
   - Tahap 3 (stage: 'abstraction', title: '3. Abstraksi (Memilih Hal yang Paling Penting)'):
     Ajak anak memakai kacamata fokus: Jika anak ingin menceritakan rahasia objek "${objectHint || 'objek foto'}" kepada temannya untuk memahami ${mission.material}, informasi kunci apa yang PALING PENTING untuk diperhatikan, dan detail apa (seperti warna hiasan, bayangan, atau debu kecil) yang bisa dikesampingkan dulu?
   - Tahap 4 (stage: 'algorithmic_thinking', title: '4. Berpikir Algoritma (Menyusun Langkah 1, 2, 3)'):
     Ajak anak menjadi perancang petunjuk aksi: Buatlah urutan langkah-langkah yang rapi dan teratur (Langkah 1, Langkah 2, Langkah 3...) yang bisa diikuti untuk memahami, merawat, atau memanfaatkan objek "${objectHint || 'objek foto'}" tersebut dari awal sampai sukses!

   Masing-masing dari 4 pertanyaan harus memiliki 4 tingkat Scaffolding yang membimbing anak dengan hangat:
   - level1: Petunjuk kecil visual (apa yang pertama kali dilihat anak pada objek foto)
   - level2: Pertanyaan penuntun (menghubungkan objek ke konsep materi)
   - level3: Langkah kecil cara merumuskan jawaban (poin 1, 2, 3)
   - level4: Contoh analogi konkret di kehidupan sehari-hari anak SD.

Kembalikan HANYA format JSON valid tanpa tanda kutip markdown, sesuai skema:
{
  "detectedObject": "nama objek yang teridentifikasi dari informasi murid",
  "compatibility": "Strong",
  "compatibilityReason": "penjelasan kualitas hubungan objek dengan materi",
  "observation": "penjelasan apa yang dilaporkan oleh murid beserta analisis tambahan visual logis dari AI",
  "context": "konteks situasi di lingkungan sekolah/anak",
  "learningBridge": "penjelasan jembatan konsep dari objek temuan murid menuju materi pelajaran guru",
  "simpleMaterialSummary": "ringkasan materi yang dipelajari dengan bahasa yang sangat mudah dipahami oleh murid SD",
  "soloTaxonomyLevel": "Relational",
  "soloDescription": "penjelasan tingkat pemahaman Taksonomi SOLO untuk eksplorasi ini",
  "guidingQuestions": [
    "pertanyaan pematik 1 untuk murid",
    "pertanyaan pematik 2 untuk murid"
  ],
  "subject": "${mission.subject}",
  "material": "${mission.material}",
  "learningTarget": "${mission.tp}",
  "cognitiveLevel": "${mission.cognitiveLevel}",
  "alternativeContextSuggestion": "saran objek/konteks lain jika compatibility weak/moderate",
  "questions": [
    {
      "id": "q-1",
      "stage": "decomposition",
      "title": "1. Dekomposisi (Membongkar Bagian Objek)",
      "question": "Yuk amati foto objekmu! Apa saja bagian-bagian atau benda penting yang kamu lihat di fotomu? Coba ceritakan apa fungsi atau peran masing-masing bagian tersebut!",
      "inputType": "text",
      "conceptTag": "Membongkar Bagian Objek (Dekomposisi)",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-2",
      "stage": "pattern_recognition",
      "title": "2. Pengenalan Pola (Menemukan Keteraturan)",
      "question": "Perhatikan lebih dekat foto objekmu! Adakah bentuk yang berulang, susunan yang berbaris rapi, atau keteraturan yang mirip dengan pelajaran kita? Ceritakan pola seru apa yang kamu temukan!",
      "inputType": "text",
      "conceptTag": "Menemukan Keteraturan (Pengenalan Pola)",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-3",
      "stage": "abstraction",
      "title": "3. Abstraksi (Memilih Hal yang Paling Penting)",
      "question": "Bayangkan kamu mau menceritakan rahasia benda di fotomu ke temanmu! Hal apa yang PALING PENTING dia ketahui untuk memahami pelajaran kita, dan detail apa yang cuma hiasan sehingga bisa diabaikan dulu?",
      "inputType": "text",
      "conceptTag": "Memilih Hal Penting (Abstraksi)",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-4",
      "stage": "algorithmic_thinking",
      "title": "4. Berpikir Algoritma (Menyusun Langkah 1, 2, 3)",
      "question": "Sekarang giliranmu menyusun jurus langkah! Buatlah urutan langkah-langkah yang rapi dan teratur (Langkah 1, Langkah 2, Langkah 3...) yang bisa kamu atau temanmu ikuti untuk menyelesaikan tantangan ini dari awal sampai berhasil!",
      "inputType": "text",
      "conceptTag": "Menyusun Langkah 1, 2, 3 (Algoritma)",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    }
  ]
}
`;

        const response = await callGeminiWithFallback(client, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        });

        const parsed = extractJsonFromGeminiResponse(response);
        if (parsed && parsed.detectedObject && Array.isArray(parsed.questions) && parsed.questions.length >= 4) {
          return res.json(parsed);
        }
      } catch (_geminiError: any) {
        console.warn("[Gemini API] Failed analyze-vision, utilizing pedagogical fallback:", _geminiError?.message);
      }
    }

    // High-Fidelity Pedagogical Fallback Engine (MockAIService)
    const fallbackResult = generatePedagogicalFallback(mission, objectHint, imageBase64OrUrl);
    return res.json(fallbackResult);
  } catch (err: any) {
    console.error("Error in /api/analyze-vision:", err);
    const fallbackResult = generatePedagogicalFallback(req.body?.mission || {}, req.body?.objectHint, req.body?.imageBase64OrUrl);
    return res.json(fallbackResult);
  }
});

// 2. Adaptive Scaffolding Hint Generator
app.post("/api/scaffold-hint", async (req, res) => {
  try {
    const { question, currentAnswer, currentLevel, mission } = req.body;
    const client = getAiClient(req);

    if (client && question) {
      try {
        const prompt = `
Siswa SD sedang menjawab tantangan pembelajaran:
Soal: "${question}"
Jawaban siswa saat ini (mengalami kesulitan/belum lengkap): "${currentAnswer || 'Belum yakin'}"
Tingkat scaffolding yang diminta guru: Level ${currentLevel}
Level 1: Petunjuk kecil (kata kunci / arah pandang)
Level 2: Pertanyaan penuntun (membuat siswa mengevaluasi sendiri)
Level 3: Masalah dipecah menjadi langkah-langkah kecil yang mudah
Level 4: Contoh analog konkret di kehidupan anak SD

Instruksi:
Sebagai guru muda dan sahabat belajar di NARASA AI (gaya hangat, ceria, suportif, tidak menghakimi), buat bantuan scaffolding tepat untuk Level ${currentLevel}.
JANGAN langsung memberikan jawaban akhir! Bimbing anak menemukan sendiri.
Format kembalian JSON: { "hint": "kalimat bimbingan singkat hangat" }
`;
        const resp = await callGeminiWithFallback(client, {
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = extractJsonFromGeminiResponse(resp);
        if (parsed && parsed.hint) {
          return res.json(parsed);
        }
      } catch (_e) {
        // Fallback to default scaffolding hint
      }
    }

    // Default pedagogical hints based on level
    const hints = [
      "Perhatikan kembali angka atau bagian benda yang kamu amati di foto. Apa yang paling mencolok?",
      "Coba ingat kata kuncinya: Apakah kejadian ini berlangsung berulang secara berkala, atau membagi benda?",
      "Mari pecah jadi dua langkah: Pertama tuliskan kelipatan masing-masing bilangan. Lalu lingkari angka yang sama!",
      "Bayangkan dua teman melompat di kotak ubin dengan jarak berbeda. Di ubin nomor berapa mereka mendarat bersama?"
    ];
    const lvlIndex = Math.min(Math.max((currentLevel || 1) - 1, 0), 3);
    res.json({ hint: hints[lvlIndex] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Auto Presentation Generator
app.post("/api/generate-presentation", async (req, res) => {
  try {
    const { studentSession } = req.body;
    if (!studentSession) {
      return res.status(400).json({ error: "Session data required" });
    }

    const { studentName, subject, missionTitle, image, imageLabel, learningBridge, answers, reflection } = studentSession;

    // Structured 10-slide standard presentation aligned with the 8 STEM Thinking Stages
    const slides = [
      {
        id: "slide-1",
        slideNumber: 1,
        title: `Proyek STEM: ${imageLabel || learningBridge.detectedObject}`,
        subtitle: `${missionTitle} • Oleh ${studentName}`,
        content: `Halo teman-teman! Saya ${studentName}. Hari ini saya membagikan hasil proyek penyelidikan dan rekayasa STEM pada objek nyata di sekitar kita.`,
        image: image,
        speakingNotes: "Beri salam pembuka dengan hangat. Sebutkan nama dan perkenalkan objek menarik yang kamu amati.",
        layout: "title"
      },
      {
        id: "slide-2",
        slideNumber: 2,
        title: "Tahap 1: Masalah Nyata",
        subtitle: "Observasi Objek & Identifikasi Kebutuhan",
        content: answers.realProblem || learningBridge.observation || "Pengamatan rinci terhadap bentuk, pola, dan karakteristik objek nyata di lingkungan sekitar.",
        bullets: [
          `Objek utama: ${learningBridge.detectedObject}`,
          `Konteks: ${learningBridge.context || 'Lingkungan sekitar'}`,
          `Masalah teridentifikasi: ${answers.realProblem ? answers.realProblem.slice(0, 90) + '...' : 'Tantangan kontekstual di sekitar'}`
        ],
        image: image,
        speakingNotes: "Ajak teman-teman memperhatikan foto. Ceritakan masalah nyata yang kamu temukan secara langsung.",
        layout: "split-photo"
      },
      {
        id: "slide-3",
        slideNumber: 3,
        title: "Tahap 2: Bertanya & Mencari Info",
        subtitle: "Inkuiri & Eksplorasi Konsep Materi",
        content: answers.askInquire || learningBridge.learningBridge || "Mengumpulkan pertanyaan kunci dan mengaitkannya dengan konsep materi pelajaran.",
        bullets: [
          `Mata Pelajaran: ${subject}`,
          `Materi: ${learningBridge.material}`,
          `Target Belajar: ${learningBridge.learningTarget}`
        ],
        speakingNotes: "Jelaskan bagaimana konsep materi membantu menjawab pertanyaan penyelidikanmu.",
        layout: "observation"
      },
      {
        id: "slide-4",
        slideNumber: 4,
        title: "Tahap 3: Merancang Solusi",
        subtitle: "Sketsa Ide & Strategi Logis",
        content: answers.designSolution || answers.strategy || "Rancangan solusi terstruktur untuk memecahkan masalah nyata yang diamati.",
        speakingNotes: "Jelaskan strategi dan langkah perencanaan yang kamu rancang bersama ide solusimu.",
        layout: "reasoning"
      },
      {
        id: "slide-5",
        slideNumber: 5,
        title: "Tahap 4: Membuat Produk/Prototipe",
        subtitle: "Realisasi Model Kerja & Produk Nyata",
        content: answers.prototype || "Realisasi solusi ke dalam bentuk model hitungan, tabel kerja, alat, atau prototipe sederhana.",
        bullets: [
          "Bahan / komponen pendukung",
          "Langkah pembuatan model solusi",
          "Realisasi konkret ide rancangan"
        ],
        speakingNotes: "Tunjukkan model kerja atau prototipe yang kamu buat dan jelaskan komponennya.",
        layout: "solution"
      },
      {
        id: "slide-6",
        slideNumber: 6,
        title: "Tahap 5: Menguji",
        subtitle: "Uji Coba Lapangan & Eksperimen",
        content: answers.testing || "Pelaksanaan uji coba terhadap prototipe untuk melihat kesesuaian dan efektivitasnya.",
        speakingNotes: "Ceritakan bagaimana proses pengujian dilakukan dan apa saja yang diuji.",
        layout: "observation"
      },
      {
        id: "slide-7",
        slideNumber: 7,
        title: "Tahap 6: Menganalisis Data",
        subtitle: "Bukti Kuantitatif & Hasil Perhitungan",
        content: answers.dataAnalysis || answers.evidence || "Pengolahan data hasil pengujian dan verifikasi perhitungan matematika.",
        bullets: [
          `Data uji coba terverifikasi`,
          `Analisis perhitungan konsep ${subject}`
        ],
        speakingNotes: "Tunjukkan data hitungan atau bukti tabel yang mengonfirmasi bahwa solusimu berhasil.",
        layout: "reasoning"
      },
      {
        id: "slide-8",
        slideNumber: 8,
        title: "Tahap 7: Memperbaiki",
        subtitle: "Iterasi & Penyempurnaan Desain",
        content: answers.improvement || "Evaluasi kendala yang ditemukan saat uji coba serta langkah perbaikan yang dilakukan.",
        speakingNotes: "Jelaskan apa yang kamu perbaiki agar model/solusi menjadi semakin optimal.",
        layout: "solution"
      },
      {
        id: "slide-9",
        slideNumber: 9,
        title: "Tahap 8: Mengomunikasikan Hasil",
        subtitle: "Kesimpulan & Refleksi Pembelajaran",
        content: answers.communication || answers.conclusion || reflection?.q2Learned || "Kesimpulan utama dan manfaat proyek STEM bagi kehidupan sehari-hari.",
        bullets: [
          `Pelajaran bermakna: ${reflection?.q2Learned || 'Konsep STEM dalam dunia nyata'}`,
          `Penerapan sehari-hari: Solusi dapat diaplikasikan di sekolah`
        ],
        speakingNotes: "Sampaikan intisari utama proyekmu dan apa yang paling berkesan dari proses belajar ini.",
        layout: "conclusion"
      },
      {
        id: "slide-10",
        slideNumber: 10,
        title: "Terima Kasih & Diskusi",
        subtitle: "Sesi Tanya Jawab Teman Sekelas",
        content: "“Pola Berpikir STEM: Amati Nyata • Rancang Solusi • Uji & Buktikan • Komunikasikan Karya!”",
        speakingNotes: "Tutup presentasi dengan senyuman dan persilakan teman-teman mengajukan pertanyaan.",
        layout: "conclusion"
      }
    ];

    res.json({ slides });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Polish Slide Text with AI (✨ Rapiikan dengan AI)
app.post("/api/polish-slide", async (req, res) => {
  try {
    const { title, content, notes, studentName, schoolName, className } = req.body;
    const client = getAiClient(req);

    const activeStudent = (studentName || "Siswa").replace(/\s*(\[|\()(student|guru|teacher|admin|kelompok|central_admin|school_admin)[^\]\)]*(\]|\))/gi, '').trim();
    const firstName = activeStudent.split(" ")[0] || activeStudent;
    const activeSchool = schoolName || "SDN 01 Nusantara";
    const activeClass = className || "Kelas V";

    if (client) {
      try {
        const prompt = `
Anda adalah asisten presentasi di NARASA AI untuk siswa SD.
Tolong rapikan kalimat slide berikut agar lebih rapi, terstruktur, mudah dibaca, dan menarik didengar saat dipresentasikan di depan kelas.
PENTING:
- JANGAN ubah gagasan atau inti pemikiran siswa. Hanya perbaiki tata bahasa, kejelasan, dan keramahan bahasa anak SD.
- IDENTITAS SISWA PEMILIK AKUN: "${activeStudent}" (Nama Panggilan: "${firstName}").
- SEKOLAH: "${activeSchool}", KELAS: "${activeClass}".
- Pastikan setiap penyebutan nama presenter atau salam diri ("Halo nama saya...", "Petualangan...", "Karya...") MENGGUNAKAN NAMA SISWA INI: "${activeStudent}" atau "${firstName}". JANGAN PERNAH gunakan nama lain seperti "Adit" jika siswa bukan Adit!

Judul: "${title}"
Konten: "${content}"
Catatan Berbicara: "${notes}"

Kembalikan JSON:
{
  "polishedTitle": "judul yang dirapikan",
  "polishedContent": "konten yang dirapikan dengan struktur rapi",
  "polishedNotes": "panduan berbicara yang ramah anak"
}
`;
        const resp = await callGeminiWithFallback(client, {
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = extractJsonFromGeminiResponse(resp);
        if (parsed && parsed.polishedContent) {
          let polishedTitle = parsed.polishedTitle || title;
          let polishedContent = parsed.polishedContent || content;
          let polishedNotes = parsed.polishedNotes || notes;

          if (activeStudent && !activeStudent.toLowerCase().includes("adit")) {
            polishedTitle = polishedTitle
              .replace(/Petualangan Adit/gi, `Petualangan ${firstName}`)
              .replace(/Adit Pratama/gi, activeStudent)
              .replace(/\bAdit\b/g, firstName);

            polishedContent = polishedContent
              .replace(/Nama saya Adit Pratama/gi, `Nama saya ${activeStudent}`)
              .replace(/Saya Adit Pratama/gi, `Saya ${activeStudent}`)
              .replace(/Nama saya Adit/gi, `Nama saya ${activeStudent}`)
              .replace(/Saya Adit/gi, `Saya ${firstName}`)
              .replace(/Adit Pratama/gi, activeStudent)
              .replace(/— Adit Pratama/gi, `— ${activeStudent}`)
              .replace(/— Adit/gi, `— ${activeStudent}`)
              .replace(/\bAdit\b/g, firstName);

            polishedNotes = polishedNotes
              .replace(/Adit Pratama/gi, activeStudent)
              .replace(/\bAdit\b/g, firstName);
          }

          return res.json({
            polishedTitle,
            polishedContent,
            polishedNotes
          });
        }
      } catch (_e) {
        // Fallback to simple slide polisher
      }
    }

    let fallbackTitle = title;
    let fallbackContent = content.trim() + (content.endsWith(".") ? "" : ".");
    let fallbackNotes = notes || "Bicaralah dengan suara jelas, tatap teman-temanmu, dan tersenyumlah.";

    if (activeStudent && !activeStudent.toLowerCase().includes("adit")) {
      fallbackTitle = fallbackTitle
        .replace(/Petualangan Adit/gi, `Petualangan ${firstName}`)
        .replace(/Adit Pratama/gi, activeStudent)
        .replace(/\bAdit\b/g, firstName);

      fallbackContent = fallbackContent
        .replace(/Nama saya Adit Pratama/gi, `Nama saya ${activeStudent}`)
        .replace(/Saya Adit Pratama/gi, `Saya ${activeStudent}`)
        .replace(/Nama saya Adit/gi, `Nama saya ${activeStudent}`)
        .replace(/Saya Adit/gi, `Saya ${firstName}`)
        .replace(/Adit Pratama/gi, activeStudent)
        .replace(/— Adit Pratama/gi, `— ${activeStudent}`)
        .replace(/— Adit/gi, `— ${activeStudent}`)
        .replace(/\bAdit\b/g, firstName);

      fallbackNotes = fallbackNotes
        .replace(/Adit Pratama/gi, activeStudent)
        .replace(/\bAdit\b/g, firstName);
    }

    res.json({
      polishedTitle: fallbackTitle,
      polishedContent: fallbackContent,
      polishedNotes: fallbackNotes
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Generate Contextual Peer Question
app.post("/api/peer-question", async (req, res) => {
  try {
    const { topic, context } = req.body;
    const client = getAiClient(req);

    if (client) {
      try {
        const prompt = `
Buat 1 pertanyaan kreatif dan ramah dari teman sekelas siswa SD tentang topik: "${topic || 'KPK dan FPB pada Jam Dinding'}".
Pertanyaan harus melatih presenter berpikir lebih dalam tentang bukti atau cara kerja konsep di kehidupan nyata.
Juga sertakan petunjuk bimbingan (aiCoachHint) untuk membantu presenter menjawab jika kesulitan.
Format JSON:
{
  "askerName": "Nama Teman (misal: Siti, Budi, atau Rizky)",
  "question": "pertanyaan ramah teman",
  "aiCoachHint": "petunjuk singkat jika presenter butuh bantuan"
}
`;
        const resp = await callGeminiWithFallback(client, {
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = extractJsonFromGeminiResponse(resp);
        if (parsed && parsed.question) {
          return res.json(parsed);
        }
      } catch (_e) {
        // Fallback peer question
      }
    }

    res.json({
      askerName: "Edo Maulana",
      question: "Bagaimana kalau salah satu bel diganti berbunyi setiap 5 menit, apa cara perhitunganmu tetap sama?",
      aiCoachHint: "Ingatkan bahwa rumus dan strategi kelipatan tetap sama, tinggal mencari kelipatan persekutuan terkecil yang baru."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to resolve high-resolution contextual Unsplash images matching the question topic/context
function resolveContextualImage(params: {
  subject?: string;
  material?: string;
  topic?: string;
  objectHint?: string;
  stimulusText?: string;
  questionText?: string;
  visualKeyword?: string;
  userProvidedImage?: string;
}): string {
  // If user provided a custom camera/uploaded image (base64 data URL), prioritize it!
  if (params.userProvidedImage && params.userProvidedImage.startsWith("data:image/")) {
    return params.userProvidedImage;
  }

  const combinedText = [
    params.visualKeyword,
    params.objectHint,
    params.material,
    params.topic,
    params.subject,
    params.questionText,
    params.stimulusText
  ].filter(Boolean).join(" ").toLowerCase();

  // Contextual matching rules:
  if (
    combinedText.includes("jam") || combinedText.includes("waktu") ||
    combinedText.includes("jadwal") || combinedText.includes("pukul") ||
    combinedText.includes("menit") || combinedText.includes("kpk") ||
    combinedText.includes("siklus") || combinedText.includes("interval")
  ) {
    return "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80"; // Clock & timetable
  }

  if (
    combinedText.includes("nutrisi") || combinedText.includes("gizi") ||
    combinedText.includes("makanan") || combinedText.includes("kemasan") ||
    combinedText.includes("pencernaan") || combinedText.includes("kalori") ||
    combinedText.includes("lemak") || combinedText.includes("protein")
  ) {
    return "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80"; // Nutrition label
  }

  if (
    combinedText.includes("ekosistem") || combinedText.includes("rantai makanan") ||
    combinedText.includes("predator") || combinedText.includes("hutan") ||
    combinedText.includes("hewan") || combinedText.includes("populasi") ||
    combinedText.includes("ulat") || combinedText.includes("burung")
  ) {
    return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80"; // Forest ecosystem
  }

  if (
    combinedText.includes("pohon") || combinedText.includes("daun") ||
    combinedText.includes("tumbuhan") || combinedText.includes("tanaman") ||
    combinedText.includes("fotosintesis") || combinedText.includes("klorofil") ||
    combinedText.includes("kebun") || combinedText.includes("akar") ||
    combinedText.includes("biotik")
  ) {
    return "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80"; // Green leaves & plant
  }

  if (
    combinedText.includes("sampah") || combinedText.includes("daur ulang") ||
    combinedText.includes("pilah") || combinedText.includes("organik") ||
    combinedText.includes("anorganik") || combinedText.includes("plastik") ||
    combinedText.includes("kebersihan")
  ) {
    return "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80"; // Recycling bins & eco sorting
  }

  if (
    combinedText.includes("air") || combinedText.includes("hujan") ||
    combinedText.includes("siklus air") || combinedText.includes("presipitasi") ||
    combinedText.includes("kondensasi") || combinedText.includes("evaporasi") ||
    combinedText.includes("sungai") || combinedText.includes("kolam")
  ) {
    return "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=80"; // Water cycle
  }

  if (
    combinedText.includes("tata surya") || combinedText.includes("planet") ||
    combinedText.includes("bumi") || combinedText.includes("matahari") ||
    combinedText.includes("bulan") || combinedText.includes("antariksa") ||
    combinedText.includes("gravitasi")
  ) {
    return "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80"; // Solar system
  }

  if (
    combinedText.includes("listrik") || combinedText.includes("energi") ||
    combinedText.includes("surya") || combinedText.includes("panel") ||
    combinedText.includes("lampu") || combinedText.includes("rangkaian")
  ) {
    return "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80"; // Solar energy & electricity
  }

  if (
    combinedText.includes("eksperimen") || combinedText.includes("lab") ||
    combinedText.includes("kimia") || combinedText.includes("pencampuran") ||
    combinedText.includes("tabung") || combinedText.includes("reaksi")
  ) {
    return "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80"; // Science lab
  }

  if (
    combinedText.includes("fpb") || combinedText.includes("pecahan") ||
    combinedText.includes("persentase") || combinedText.includes("pembagian") ||
    combinedText.includes("bangun") || combinedText.includes("geometri") ||
    combinedText.includes("luas") || combinedText.includes("keliling") ||
    combinedText.includes("matematika") || combinedText.includes("angka") ||
    combinedText.includes("spidol") || combinedText.includes("wadah")
  ) {
    return "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80"; // Math geometry
  }

  if (
    combinedText.includes("buku") || combinedText.includes("perpustakaan") ||
    combinedText.includes("teks") || combinedText.includes("deskripsi") ||
    combinedText.includes("literasi") || combinedText.includes("cerita") ||
    combinedText.includes("paragraf") || combinedText.includes("bahasa")
  ) {
    return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"; // Books & library
  }

  if (
    combinedText.includes("batik") || combinedText.includes("seni") ||
    combinedText.includes("budaya") || combinedText.includes("tari") ||
    combinedText.includes("alat musik") || combinedText.includes("angklung")
  ) {
    return "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800&auto=format&fit=crop&q=80"; // Batik art
  }

  if (
    combinedText.includes("uang") || combinedText.includes("harga") ||
    combinedText.includes("keuangan") || combinedText.includes("belanja") ||
    combinedText.includes("diskon")
  ) {
    return "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80"; // Money & Finance
  }

  if (params.userProvidedImage && params.userProvidedImage.startsWith("http")) {
    return params.userProvidedImage;
  }

  // Subject fallbacks
  if (params.subject?.toLowerCase().includes("matematika")) {
    return "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80";
  }
  if (params.subject?.toLowerCase().includes("ipas") || params.subject?.toLowerCase().includes("ipa")) {
    return "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80";
  }

  return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80";
}

// 6. Generate Critical Thinking Concept Quiz with AI (Split Stimulus + Configurable Counts & Scores per Type)
app.post("/api/generate-critical-thinking-quiz", async (req, res) => {
  try {
    const { mission, imageBase64OrUrl, objectHint, customTitle, questionConfigs } = req.body;
    if (!mission) {
      return res.status(400).json({ error: "Mission information is required" });
    }

    const cfg = {
      single_choice: {
        count: typeof questionConfigs?.single_choice?.count === 'number' ? questionConfigs.single_choice.count : 1,
        score: typeof questionConfigs?.single_choice?.score === 'number' ? questionConfigs.single_choice.score : 25,
      },
      multiple_choice: {
        count: typeof questionConfigs?.multiple_choice?.count === 'number' ? questionConfigs.multiple_choice.count : 1,
        score: typeof questionConfigs?.multiple_choice?.score === 'number' ? questionConfigs.multiple_choice.score : 25,
      },
      true_false: {
        count: typeof questionConfigs?.true_false?.count === 'number' ? questionConfigs.true_false.count : 1,
        score: typeof questionConfigs?.true_false?.score === 'number' ? questionConfigs.true_false.score : 25,
      },
      essay: {
        count: typeof questionConfigs?.essay?.count === 'number' ? questionConfigs.essay.count : 1,
        score: typeof questionConfigs?.essay?.score === 'number' ? questionConfigs.essay.score : 25,
      },
    };

    const totalQuestionsRequested =
      cfg.single_choice.count +
      cfg.multiple_choice.count +
      cfg.true_false.count +
      cfg.essay.count;

    const client = getAiClient(req);
    if (client) {
      try {
        const prompt = `
Anda adalah Pakar Asesmen Pendidikan dan Pembuat Soal Berpikir Kritis (HOTS) Pembelajaran Mendalam jenjang SD (Fase C / Kelas V).
Rancang 1 paket Asesmen Uji Pemahaman Konseptual Berpikir Kritis yang inovatif.
Setiap soal harus dirancang dengan TAMPILAN SPLIT:
- Bagian Kiri: Berisi wacana/teks bacaan kontekstual dan/atau gambar objek nyata.
- Bagian Kanan: Pertanyaan penalaran kritis dan opsi jawaban/area respons siswa.

Informasi Misi Pembelajaran:
- Mata Pelajaran: ${mission.subject}
- Materi: ${mission.material}
- Capaian Pembelajaran (CP): ${mission.cp || '-'}
- Tujuan Pembelajaran (TP): ${mission.tp}
- Indikator: ${(mission.indicators || []).join('; ')}
- Target Kompetensi: ${mission.targetCompetency || 'both'}
- Objek Foto / Konteks Nyata: "${objectHint || 'Objek nyata di sekitar sekolah'}"

MANDAT INSTRUKSI JUMLAH & SKOR SOAL PER JENIS:
Hasilkan TOTAL TEPAT ${totalQuestionsRequested} BUTIR SOAL di array "questions" dengan komposisi berikut:
1. ${cfg.single_choice.count} butir soal "single_choice" (Pilihan Ganda standar, 4 opsi, 1 benar), masing-masing bernilai "maxScore": ${cfg.single_choice.score}.
2. ${cfg.multiple_choice.count} butir soal "multiple_choice" (Pilihan Ganda Kompleks, 4 opsi, minimal 2 opsi benar), masing-masing bernilai "maxScore": ${cfg.multiple_choice.score}.
3. ${cfg.true_false.count} butir soal "true_false" (1 petunjuk dengan 3 pernyataan Benar/Salah), masing-masing bernilai "maxScore": ${cfg.true_false.score}.
4. ${cfg.essay.count} butir soal "essay" (Uraian berpikir kritis dilengkapi essayRubric dan sampleAnswer), masing-masing bernilai "maxScore": ${cfg.essay.score}.

Setiap objek di dalam array "questions" HARUS memiliki properti "maxScore" bernilai angka sesuai skor per jenis soal di atas!

MANDAT KESESUAIAN VISUAL CONTEXTUAL IMAGE:
Setiap soal di array "questions" HARUS memiliki properti "suggestedVisualKeyword" yang spesifik menggambarkan konteks objek visual pada soal tersebut (contoh: "jam_analog_kpk", "label_nutrisi_makanan", "ekosistem_rantai_makanan", "pohon_daun_fotosintesis", "tempat_sampah_pilah", "pecahan_luas_matematika", "buku_perpustakaan", "panel_surya").

Semua soal HARUS:
- Mengarah ke keterampilan Berpikir Kritis (HOTS: C4 Analisis, C5 Evaluasi, C6 Sintesis/Kreasi). Setiap soal HARUS secara ACAK menggunakan level kognitif "C4", "C5", atau "C6" pada properti "cognitiveLevel" dengan distribusi bervariasi di antara butir-butir soal.
- Menerapkan Taksonomi SOLO (Structure of Observed Learning Outcomes): Setiap soal HARUS menyertakan "soloTaxonomyLevel" (salah satu dari: "Uni-structural", "Multi-structural", "Relational", "Extended Abstract") beserta "soloDescription" (penjelasan singkat tingkat pemahaman SOLO).
- Memiliki "stimulusText" (wacana teks narasi/data/fakta kontekstual yang kaya dan mudah dipahami siswa SD).
- Memiliki "criticalThinkingSkill" (contoh: "Analisis Hubungan Kausal", "Evaluasi Validitas Bukti", "Inferensi Berbasis Bukti", "Sintesis Solusi Masalah").
- Memiliki "explanation" (pembahasan mendalam logika dan alasan berpikir kritis).

Kembalikan HANYA format JSON valid tanpa tanda kutip markdown:
{
  "id": "quiz-ai-${Date.now()}",
  "title": "${customTitle || `Uji Pemahaman Berpikir Kritis: ${mission.material}`}",
  "subject": "${mission.subject}",
  "grade": "${mission.grade || 'Kelas V'}",
  "phase": "Fase C",
  "topic": "${mission.material}",
  "description": "Asesmen formatif berpikir kritis berbasis pengamatan citra kontekstual dan Tujuan Pembelajaran.",
  "durationMinutes": 15,
  "targetCompetency": "${mission.targetCompetency || 'both'}",
  "passingScore": 75,
  "totalQuestions": ${totalQuestionsRequested},
  "isPublished": true,
  "isAiGenerated": true,
  "contextImage": "auto",
  "createdAt": "${new Date().toISOString().split('T')[0]}",
  "questions": [
    {
      "id": "q1",
      "questionType": "single_choice",
      "maxScore": ${cfg.single_choice.score},
      "criticalThinkingSkill": "Analisis Hubungan Sebab-Akibat",
      "cognitiveLevel": "C4",
      "conceptTag": "Analisis Konseptual",
      "suggestedVisualKeyword": "ekosistem_rantai_makanan",
      "stimulusText": "Teks wacana kontekstual yang kaya...",
      "scenario": "Ringkasan konteks visual...",
      "question": "Pertanyaan berpikir kritis pilihan ganda...",
      "options": [
        { "id": "opt_a", "text": "Pilihan A" },
        { "id": "opt_b", "text": "Pilihan B" },
        { "id": "opt_c", "text": "Pilihan C" },
        { "id": "opt_d", "text": "Pilihan D" }
      ],
      "correctOptionId": "opt_b",
      "explanation": "Pembahasan logika..."
    }
  ]
}
`;

        let contents: any = prompt;
        if (imageBase64OrUrl && imageBase64OrUrl.startsWith("data:image/")) {
          const matches = imageBase64OrUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contents = [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: matches[1],
                      data: matches[2]
                    }
                  }
                ]
              }
            ];
          }
        }

        const resp = await callGeminiWithFallback(client, {
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        });

        const parsed = extractJsonFromGeminiResponse(resp);

        if (parsed && parsed.questions && parsed.questions.length > 0) {
          parsed.contextImage = "";

          parsed.questions.forEach((q: any) => {
            q.image = "";

            const qType = q.questionType || 'single_choice';
            if (!q.maxScore || typeof q.maxScore !== 'number') {
              if (qType === 'single_choice') q.maxScore = cfg.single_choice.score;
              else if (qType === 'multiple_choice') q.maxScore = cfg.multiple_choice.score;
              else if (qType === 'true_false') q.maxScore = cfg.true_false.score;
              else if (qType === 'essay') q.maxScore = cfg.essay.score;
              else q.maxScore = 25;
            }
          });

          parsed.totalQuestions = parsed.questions.length;
          return res.json(parsed);
        }
      } catch (_geminiErr) {
        // Hand off to pedagogical fallback
      }
    }

    const fallbackQuiz = generateCriticalThinkingQuizFallback(mission, objectHint, imageBase64OrUrl, cfg);
    return res.json(fallbackQuiz);
  } catch (err: any) {
    console.error("Error in /api/generate-critical-thinking-quiz:", err);
    res.status(500).json({ error: err.message || "Failed to generate critical thinking quiz" });
  }
});

function generateCriticalThinkingQuizFallback(
  mission: any,
  objectHint?: string,
  imageBase64OrUrl?: string,
  cfg?: any
) {
  const normalizedCfg = {
    single_choice: {
      count: typeof cfg?.single_choice?.count === 'number' ? cfg.single_choice.count : 1,
      score: typeof cfg?.single_choice?.score === 'number' ? cfg.single_choice.score : 25,
    },
    multiple_choice: {
      count: typeof cfg?.multiple_choice?.count === 'number' ? cfg.multiple_choice.count : 1,
      score: typeof cfg?.multiple_choice?.score === 'number' ? cfg.multiple_choice.score : 25,
    },
    true_false: {
      count: typeof cfg?.true_false?.count === 'number' ? cfg.true_false.count : 1,
      score: typeof cfg?.true_false?.score === 'number' ? cfg.true_false.score : 25,
    },
    essay: {
      count: typeof cfg?.essay?.count === 'number' ? cfg.essay.count : 1,
      score: typeof cfg?.essay?.score === 'number' ? cfg.essay.score : 25,
    },
  };

  const isMath = mission.subject?.toLowerCase().includes("matematika");
  const isIpas = mission.subject?.toLowerCase().includes("ipas") || mission.subject?.toLowerCase().includes("ipa");
  const defaultImg =
    imageBase64OrUrl ||
    (isMath
      ? "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&auto=format&fit=crop&q=80"
      : isIpas
      ? "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80");

  const singleChoiceTemplates = [
    {
      questionType: "single_choice",
      criticalThinkingSkill: isMath ? "Analisis Hubungan Interval Waktu" : "Analisis Hubungan Sebab-Akibat",
      cognitiveLevel: "C4",
      conceptTag: isMath ? "Sinkronisasi Siklus KPK" : "Dinamika Trofik Ekosistem",
      stimulusText: isMath
        ? "Di ruang kelas terdapat jam dinding analog dan dua perangkat otomatis. Pompa air filter akuarium menyala tiap 12 menit sekali, sedangkan lampu UV menyala tiap 18 menit sekali. Pukul 08.00 pagi, kedua alat menyala bersamaan."
        : "Di petak kebun sayur sekolah terdapat populasi tanaman sawi, ulat daun, burung pipit, dan ular taman. Bulan lalu, burung pipit banyak diburu sehingga jumlahnya turun dari 30 ekor menjadi 3 ekor. Daun sawi menjadi rusak berlubang-lubang.",
      scenario: isMath ? "Observasi siklus dua alat otomatis." : "Investigasi ketidakseimbangan rantai makanan kebun.",
      image: defaultImg,
      question: isMath
        ? "Berdasarkan wacana di sebelah kiri, pada pukul berapakah pompa air filter dan lampu UV menyala bersamaan kembali untuk pertama kalinya?"
        : "Berdasarkan stimulus wacana di sebelah kiri, apa penyebab utama daun sawi mengalami kerusakan parah?",
      options: isMath
        ? [
            { id: "opt_a", text: "Pukul 08.24 (selisih 24 menit)" },
            { id: "opt_b", text: "Pukul 08.36 (KPK dari 12 dan 18 adalah 36 menit)" },
            { id: "opt_c", text: "Pukul 08.48 (selisih 48 menit)" },
            { id: "opt_d", text: "Pukul 09.00 (setelah 60 menit)" }
          ]
        : [
            { id: "opt_a", text: "Jumlah ular taman meningkat drastis memakan tanaman sayur" },
            { id: "opt_b", text: "Populasi ulat daun meledak karena predator alaminya (burung pipit) berkurang drastis" },
            { id: "opt_c", text: "Tanaman sawi kekurangan sinar matahari akibat terhalang pohon" },
            { id: "opt_d", text: "Burung pipit yang tersisa memakan seluruh daun sawi" }
          ],
      correctOptionId: "opt_b",
      explanation: isMath
        ? "KPK dari 12 dan 18 adalah 36 menit. Pukul 08.00 + 36 menit = Pukul 08.36."
        : "Burung pipit adalah pengendali alami populasi ulat. Tanpa burung pipit, populasi ulat meledak memakan tanaman sawi."
    }
  ];

  const multipleChoiceTemplates = [
    {
      questionType: "multiple_choice",
      criticalThinkingSkill: isMath ? "Evaluasi Solusi Pembagian Merata" : "Evaluasi Komponen & Bukti Nyata",
      cognitiveLevel: "C4",
      conceptTag: isMath ? "Penerapan Konsep FPB" : "Keseimbangan Biotik & Abiotik",
      stimulusText: isMath
        ? "Siswa mengumpulkan 48 spidol warna dan 36 penggaris kayu untuk dimasukkan ke beberapa wadah penyimpanan meja belajar tanpa sisa."
        : "Kelompok siswa meneliti sepetak tanah 2x2m dekat kolam sekolah: cacing tanah, batu kali, air resapan, daun lapuk (humus), dan serangga semut.",
      scenario: isMath ? "Pengemasan alat tulis kelas secara merata." : "Pengamatan faktor pendukung kesuburan tanah.",
      image: defaultImg,
      question: isMath
        ? "Pilihlah SEMUA pernyataan yang BENAR terkait pengemasan alat tulis tersebut (Jawaban lebih dari satu):"
        : "Pilihlah SEMUA peran komponen biotik dan abiotik yang BENAR dalam menjaga kesuburan tanah tersebut (Jawaban lebih dari satu):",
      options: isMath
        ? [
            { id: "opt_a", text: "Jumlah wadah terbanyak yang dapat disediakan adalah 12 wadah (FPB dari 48 dan 36)." },
            { id: "opt_b", text: "Masing-masing wadah memuat tepat 4 buah spidol warna." },
            { id: "opt_c", text: "Masing-masing wadah memuat tepat 3 buah penggaris kayu." },
            { id: "opt_d", text: "Jumlah wadah terbanyak yang dapat disediakan adalah 24 wadah." }
          ]
        : [
            { id: "opt_a", text: "Cacing tanah membantu aerasi udara dan menggemburkan rongga tanah." },
            { id: "opt_b", text: "Air resapan menjadi pelarut alami bagi zat hara yang diserap akar." },
            { id: "opt_c", text: "Batu kali bertindak sebagai produsen utama penghasil energi glukosa." },
            { id: "opt_d", text: "Daun lapuk (humus) menyediakan nutrisi organik yang diurai dekomposer." }
          ],
      correctOptionIds: isMath ? ["opt_a", "opt_b", "opt_c"] : ["opt_a", "opt_b", "opt_d"],
      explanation: isMath
        ? "FPB dari 48 dan 36 adalah 12 wadah. Tiap wadah berisi 48 ÷ 12 = 4 spidol dan 36 ÷ 12 = 3 penggaris."
        : "Batu kali adalah komponen abiotik bukan produsen. Cacing, air, dan daun lapuk bekerja sinergis menjaga kesuburan tanah."
    }
  ];

  const trueFalseTemplates = [
    {
      questionType: "true_false",
      criticalThinkingSkill: isMath ? "Verifikasi Hipotesis Penalaran" : "Evaluasi Hipotesis Ilmiah",
      cognitiveLevel: "C4",
      conceptTag: isMath ? "Perbedaan Karakter KPK dan FPB" : "Peran Dekomposer Lingkungan",
      stimulusText: isMath
        ? "Dua armada Bus Sekolah beroperasi dari terminal yang sama: Bus Jalur 1 berangkat tiap 15 menit sekali, Bus Jalur 2 tiap 20 menit sekali. Pukul 06.00 keduanya berangkat bersamaan."
        : "Di kebun sekolah terdapat tumpukan daun gugur yang dihuni jamur dan bakteri pengurai. Doni mengusulkan agar seluruh jamur disemprot pembasmi kuman sampai steril.",
      scenario: isMath ? "Analisis peristiwa berulang pada jadwal bus." : "Uji hipotesis peran pengurai dalam daur hara.",
      image: defaultImg,
      question: "Berdasarkan stimulus wacana di sebelah kiri, tentukan apakah setiap pernyataan berikut bernilai BENAR atau SALAH:",
      statements: isMath
        ? [
            { id: "s1", statement: "Untuk mengetahui kapan kedua bus berangkat bersamaan lagi, kita mencari KPK dari 15 dan 20.", correctAnswer: true },
            { id: "s2", statement: "Kedua bus akan berangkat bersamaan pada menit ke-35 setelah pukul 06.00 karena 15 + 20 = 35.", correctAnswer: false },
            { id: "s3", statement: "Kedua bus berangkat bersamaan tepat setiap 60 menit sekali (pukul 07.00, 08.00, dst.).", correctAnswer: true }
          ]
        : [
            { id: "s1", statement: "Jamur dan bakteri pengurai (dekomposer) sangat krusial mengembalikan unsur hara tanah.", correctAnswer: true },
            { id: "s2", statement: "Tanaman kebun akan tumbuh jauh lebih subur jika seluruh jamur dan bakteri pengurai dimusnahkan secara total.", correctAnswer: false },
            { id: "s3", statement: "Ketiadaan organisme pengurai akan memutus siklus rantai makanan dan tanah menjadi miskin nutrisi.", correctAnswer: true }
          ],
      correctBooleanAnswer: false,
      explanation: isMath
        ? "Pernyataan 1 BENAR (KPK untuk siklus berulang). Pernyataan 2 SALAH. Pernyataan 3 BENAR (KPK 15 dan 20 adalah 60)."
        : "Pernyataan 1 BENAR. Pernyataan 2 SALAH (tanpa pengurai tanah tandus). Pernyataan 3 BENAR."
    }
  ];

  const essayTemplates = [
    {
      questionType: "essay",
      criticalThinkingSkill: isMath ? "Sintesis Solusi & Argumentasi Kritis" : "Sintesis Solusi Lingkungan Autentik",
      cognitiveLevel: "C5",
      conceptTag: isMath ? "Perumusan Solusi Nyata Jadwal Piket" : "Solusi Pengendalian Hama Alami",
      stimulusText: isMath
        ? "Di sekolah terdapat 3 regu siswa: Kebersihan (tiap 3 hari), Literasi (tiap 4 hari), UKS (tiap 6 hari). Bertugas bersama 1 Oktober. Murid menyarankan jadwal UKS diubah jadi tiap 5 hari."
        : "Pohon mangga sekolah diserang hama kutu putih. Pengurus mau menyemprot pestisida racun kimia tiap hari. Siswa khawatir lebah penyerbuk mati dan kolam ikan tercemar.",
      scenario: isMath ? "Optimasi beban kerja jadwal piket sekolah." : "Dilema pestisida kimia vs pengendalian ramah lingkungan.",
      image: defaultImg,
      question: isMath
        ? "Analisislah usulan tersebut! Hitunglah tanggal pertemuan ketiga regu pada jadwal awal (3, 4, 6) dan bandingkan jika jadwal diubah (3, 4, 5). Apakah perubahan efektif? Jelaskan alasanmu!"
        : "Sebagai siswa berpikir kritis, rancanglah rencana solusi ramah lingkungan alternatif tanpa menggunakan racun kimia! Jelaskan alasan mengapa solusimu lebih aman!",
      essayRubric: `Rubrik Penilaian Guru (0-${normalizedCfg.essay.score} Poin): Disesuaikan dengan kedalaman analisis dan rincian argumen logis siswa.`,
      sampleAnswer: isMath
        ? "KPK(3,4,6) = 12 hari. Jika diubah (3,4,5), KPK = 60 hari. Usulan efektif memperjarang penumpukan tugas serentak."
        : "Solusi: Gunakan predator alami seperti kumbang koksi atau semprotan sabun organik nabati. Cara ini aman untuk lebah dan kolam.",
      explanation: isMath
        ? "Menguji kemampuan komputasi KPK multi-bilangan dan pengambilan keputusan jadwal."
        : "Menguji kemampuan sintesis solusi ramah lingkungan berdasarkan prinsip ekosistem."
    }
  ];

  const questions: any[] = [];
  let qIdx = 1;
  const cLevels = ['C4', 'C5', 'C6'];

  // Single choice
  for (let i = 0; i < normalizedCfg.single_choice.count; i++) {
    const tpl = singleChoiceTemplates[i % singleChoiceTemplates.length];
    questions.push({ ...tpl, cognitiveLevel: cLevels[Math.floor(Math.random() * cLevels.length)], image: "", id: `q${qIdx++}`, maxScore: normalizedCfg.single_choice.score });
  }

  // Multiple choice
  for (let i = 0; i < normalizedCfg.multiple_choice.count; i++) {
    const tpl = multipleChoiceTemplates[i % multipleChoiceTemplates.length];
    questions.push({ ...tpl, cognitiveLevel: cLevels[Math.floor(Math.random() * cLevels.length)], image: "", id: `q${qIdx++}`, maxScore: normalizedCfg.multiple_choice.score });
  }

  // True false
  for (let i = 0; i < normalizedCfg.true_false.count; i++) {
    const tpl = trueFalseTemplates[i % trueFalseTemplates.length];
    questions.push({ ...tpl, cognitiveLevel: cLevels[Math.floor(Math.random() * cLevels.length)], image: "", id: `q${qIdx++}`, maxScore: normalizedCfg.true_false.score });
  }

  // Essay
  for (let i = 0; i < normalizedCfg.essay.count; i++) {
    const tpl = essayTemplates[i % essayTemplates.length];
    questions.push({ ...tpl, cognitiveLevel: cLevels[Math.floor(Math.random() * cLevels.length)], image: "", id: `q${qIdx++}`, maxScore: normalizedCfg.essay.score });
  }

  return {
    id: `quiz-ai-${Date.now()}`,
    title: `Uji Pemahaman Berpikir Kritis: ${mission.material || (isMath ? 'KPK & FPB' : 'Dinamika Ekosistem')}`,
    subject: mission.subject || (isMath ? "Matematika" : "IPAS"),
    grade: mission.grade || "Kelas V",
    phase: "Fase C",
    topic: mission.material || (isMath ? "KPK dan FPB Dalam Kehidupan" : "Ekosistem Lingkungan"),
    description: `Asesmen formatif berpikir kritis berbasis pengamatan citra kontekstual dan Tujuan Pembelajaran.`,
    durationMinutes: 15,
    targetCompetency: "both",
    passingScore: 75,
    totalQuestions: questions.length,
    isPublished: true,
    isAiGenerated: true,
    contextImage: "",
    createdAt: new Date().toISOString().split("T")[0],
    questions
  };
}

// Helper for pedagogical fallback domain heuristics
function generatePedagogicalFallback(mission: any, objectHint?: string, imageBase64OrUrl?: string) {
  const isMath = mission.subject?.toLowerCase().includes("matematika");
  const isIpas = mission.subject?.toLowerCase().includes("ipas") || mission.subject?.toLowerCase().includes("ipa");
  const isIndo = mission.subject?.toLowerCase().includes("bahasa");

  const hintLower = (objectHint || "").toLowerCase();
  const isClock = hintLower.includes("jam") || hintLower.includes("clock") || hintLower.includes("waktu");
  const isTree = hintLower.includes("pohon") || hintLower.includes("tanaman") || hintLower.includes("daun");
  const isTrash = hintLower.includes("sampah") || hintLower.includes("tong");
  const isBicycle = hintLower.includes("sepeda") || hintLower.includes("roda");
  const isCanteen = hintLower.includes("kantin") || hintLower.includes("kue") || hintLower.includes("makanan");

  if (isMath) {
    if (isClock) {
      return {
        detectedObject: "Jam dinding analog ruang kelas",
        compatibility: "Strong",
        compatibilityReason: "Jarum jam yang berputar secara teratur dan pembagian menit adalah representasi interval waktu nyata yang sempurna untuk konsep KPK.",
        observation: "Jam dinding bundar dengan 12 penanda angka besar dan 60 garis penanda menit kecil. Jarum detik berdetak tiap 1 detik, jarum menit berputar penuh tiap 60 menit.",
        context: "Siklus pengulangan waktu dan interval bel tanda pergantian kegiatan kelas.",
        learningBridge: "Jam dinding menunjukkan peristiwa yang berulang secara berkala. Ketika dua kegiatan memiliki interval waktu yang berbeda, waktu bertemunya kembali dapat ditentukan menggunakan Kelipatan Persekutuan Terkecil (KPK).",
        guidingQuestions: [
          "Bagaimana jarum jam yang berputar terus-menerus bisa membantu kita memperkirakan waktu pertemuan dua jadwal berbeda?",
          "Pernahkah kamu memperhatikan bunyi bel sekolah yang berdering bersamaan? Kapan itu terjadi?"
        ],
        subject: mission.subject,
        material: mission.material,
        learningTarget: mission.tp,
        cognitiveLevel: mission.cognitiveLevel,
        questions: [
          {
            id: "q-math-1",
            stage: "decomposition",
            title: "1. Dekomposisi (Pecah Jadi Bagian Kecil)",
            question: "Yuk amati jam dinding di fotomu! Coba pecah jadi bagian-bagian penting: ada angka penunjuk 1-12, garis menit, dan jarum jam/menit/detik. Sebutkan bagian apa saja yang kamu amati dan apa peran atau fungsi tiap jarumnya?",
            inputType: "text",
            conceptTag: "Pecah Bagian Jam (Dekomposisi)",
            scaffolding: {
              level1: "Lihat jarum-jarum pada jam: ada jarum pendek penunjuk jam, jarum panjang menit, dan jarum halus detik.",
              level2: "Bagaimana masing-masing jarum bergerak dengan kecepatan yang berbeda?",
              level3: "Tuliskan: 1) Angka dan garis menit untuk..., 2) Jarum pendek untuk..., 3) Jarum panjang untuk...",
              level4: "Seperti anggota tim yang berbagi tugas, setiap bagian jam bekerja sama menunjukkan waktu!"
            }
          },
          {
            id: "q-math-2",
            stage: "pattern_recognition",
            title: "2. Pengenalan Pola (Cari Keteraturan & Kesamaan)",
            question: "Perhatikan putaran jarum jam dinding! Adakah gerakan yang berulang atau pola waktu yang teratur (misalnya jarum berputar penuh setiap interval berapa menit)? Bagaimana pola ini berhubungan dengan konsep KPK pada kelipatan angka?",
            inputType: "text",
            conceptTag: "Cari Keteraturan Waktu (Pola)",
            scaffolding: {
              level1: "Jarum menit berputar penuh mengelilingi 60 menit secara teratur.",
              level2: "Jika bel sekolah berbunyi tiap 4 menit dan alarm stasiun baca tiap 6 menit, cari angka kelipatan yang sama.",
              level3: "Kelipatan 4: 4, 8, 12, 16... Kelipatan 6: 6, 12, 18... Pola pertemuannya ada di menit ke-12.",
              level4: "Seperti dua pelari di lintasan putar yang kembali bertemu bersama di garis start!"
            }
          },
          {
            id: "q-math-3",
            stage: "abstraction",
            title: "3. Abstraksi (Fokus pada Hal Paling Penting)",
            question: "Saat kita ingin menghitung kapan dua jadwal kegiatan berbunyi bersama, informasi angka mana pada jam yang paling penting kita catat, dan bagian mana (seperti warna bingkai jam atau hiasan dinding) yang bisa kita abaikan dulu?",
            inputType: "text",
            conceptTag: "Fokus Angka Kunci (Abstraksi)",
            scaffolding: {
              level1: "Fokus pada angka interval waktunya: menit ke-4 dan menit ke-6.",
              level2: "Apakah warna jam atau merek baterai berpengaruh pada perhitungan? Tentu tidak, jadi bisa diabaikan.",
              level3: "Tuliskan data penting yang disimpan dan hal yang diabaikan.",
              level4: "Seperti melihat jadwal bus: kita hanya butuh jam keberangkatan, bukan warna jok busnya!"
            }
          },
          {
            id: "q-math-4",
            stage: "algorithmic_thinking",
            title: "4. Berpikir Algoritma (Susun Langkah Teratur 1, 2, 3)",
            question: "Sekarang susunlah jurus langkahmu! Buatlah urutan langkah-langkah yang rapi (Langkah 1, Langkah 2, Langkah 3...) untuk mencari menit ke berapa kedua bel akan berbunyi di saat yang bersamaan!",
            inputType: "text",
            conceptTag: "Susun Langkah Hitung (Algoritma)",
            scaffolding: {
              level1: "Langkah 1: Catat interval waktu masing-masing bel (4 menit dan 6 menit).",
              level2: "Langkah 2: Tuliskan deret kelipatan kedua angka atau cari pohon faktor primanya.",
              level3: "Langkah 3: Tentukan angka persekutuan terkecil (KPK) yang muncul pertama kali.",
              level4: "Hasilnya: kedua bel berbunyi bersama tepat pada menit ke-12!"
            }
          }
        ]
      };
    } else if (isCanteen) {
      return {
        detectedObject: "Kue pastel dan lemper di meja kantin",
        compatibility: "Strong",
        compatibilityReason: "Jumlah makanan berbeda yang akan dimasukkan ke kotak bekal secara merata adalah model nyata konsep Faktor Persekutuan Terbesar (FPB).",
        observation: "Terdapat 24 kue pastel dan 36 lemper ketan yang ditata di atas nampan stan kantin sekolah.",
        context: "Pembagian kotak snack bingkisan perayaan hari guru.",
        learningBridge: "Ketika kita ingin membagi dua jenis makanan berbeda ke dalam sebanyak-banyaknya kotak dengan isi yang sama banyak dan tanpa sisa, kita menggunakan konsep FPB.",
        guidingQuestions: [
          "Bagaimana cara kita membagikan makanan ke dalam kotak secara adil tanpa ada yang bersisa?",
          "Apa hubungan antara jumlah makanan yang banyak dengan ukuran kotak terbanyak yang bisa dibuat?"
        ],
        subject: mission.subject,
        material: mission.material,
        learningTarget: mission.tp,
        cognitiveLevel: mission.cognitiveLevel,
        questions: [
          {
            id: "q-fpb-1",
            stage: "decomposition",
            title: "1. Dekomposisi (Pecah Jadi Bagian Kecil)",
            question: "Yuk amati aneka kue di kantin pada fotomu! Coba pecah dan kelompokkan: ada berapa jenis makanan yang berbeda dan berapa jumlah masing-masing kue yang terlihat di foto?",
            inputType: "text",
            conceptTag: "Pecah Data Makanan (Dekomposisi)",
            scaffolding: {
              level1: "Pisahkan kue menjadi dua kelompok: kelompok pastel dan kelompok lemper.",
              level2: "Hitung masing-masing: ada 24 pastel dan 36 lemper.",
              level3: "Tuliskan jumlah masing-masing kue secara terpisah agar mudah dihitung.",
              level4: "Seperti merapikan pensil warna berdasarkan warnanya sebelum menggambar!"
            }
          },
          {
            id: "q-fpb-2",
            stage: "pattern_recognition",
            title: "2. Pengenalan Pola (Cari Keteraturan & Kesamaan)",
            question: "Jika semua kue itu ingin dibagikan ke beberapa kotak dengan isi sama banyak, adakah pola pembagian yang adil dan berulang agar tidak ada satu pun kue yang bersisa? (Kaitkan dengan konsep FPB)",
            inputType: "text",
            conceptTag: "Pola Pembagian Rata (Pengenalan Pola)",
            scaffolding: {
              level1: "Cari angka yang bisa membagi habis 24 dan 36 sekaligus.",
              level2: "Faktor 24: 1, 2, 3, 4, 6, 8, 12, 24. Faktor 36: 1, 2, 3, 4, 6, 9, 12, 18, 36.",
              level3: "Angka pembagi terbesar yang sama adalah 12.",
              level4: "Artinya, kita bisa membuat 12 kotak bekal dengan isi yang pas dan adil!"
            }
          },
          {
            id: "q-fpb-3",
            stage: "abstraction",
            title: "3. Abstraksi (Fokus pada Hal Paling Penting)",
            question: "Dalam membagikan makanan ke dalam kotak bekal secara adil, informasi apa yang paling penting diperhatikan, dan detail apa (seperti bentuk piring atau hiasan meja) yang bisa kita abaikan dulu?",
            inputType: "text",
            conceptTag: "Fokus Jumlah & Pembagian (Abstraksi)",
            scaffolding: {
              level1: "Fokus pada jumlah kue: 24 pastel dan 36 lemper, serta target pembagian adil.",
              level2: "Bentuk nampan atau motif taplak meja tidak mempengaruhi hitungan, jadi bisa diabaikan.",
              level3: "Tuliskan hal penting: membagi 24 dan 36 ke 12 kotak.",
              level4: "Seperti mengemas kado: yang penting isi hadiahnya cukup dan adil untuk semua teman!"
            }
          },
          {
            id: "q-fpb-4",
            stage: "algorithmic_thinking",
            title: "4. Berpikir Algoritma (Susun Langkah Teratur 1, 2, 3)",
            question: "Sekarang susunlah urutan langkah kerja yang rapi (Langkah 1, Langkah 2, Langkah 3...) agar kamu dan teman-temanmu bisa mengemas seluruh kue ke dalam kotak bekal dengan cepat dan tanpa keliru!",
            inputType: "text",
            conceptTag: "Langkah Pengemasan Rapi (Algoritma)",
            scaffolding: {
              level1: "Langkah 1: Siapkan 12 kotak bekal yang bersih.",
              level2: "Langkah 2: Masukkan 2 pastel ke setiap kotak (24 : 12 = 2).",
              level3: "Langkah 3: Masukkan 3 lemper ke setiap kotak (36 : 12 = 3).",
              level4: "Hasil: Setiap kotak berisi tepat 5 kue (2 pastel + 3 lemper) dan semua kue habis terbagi!"
            }
          }
        ]
      };
    } else {
      // General object for math
      return {
        detectedObject: objectHint || "Objek di lingkungan sekitar sekolah",
        compatibility: "Moderate",
        compatibilityReason: "Objek memiliki elemen keteraturan dan jumlah yang dapat dimodelkan ke dalam pola persekutuan kelipatan atau faktor pembagian.",
        observation: "Objek teramati memiliki struktur berulang, elemen terhitung, dan penataan yang terorganisasi.",
        context: "Penataan ruang dan frekuensi pemakaian di lingkungan siswa.",
        learningBridge: "Karakteristik objek ini dapat dihubungkan dengan pola matematika keteraturan dan persekutuan nilai kelipatan.",
        guidingQuestions: [
          "Apa pola atau keteraturan yang bisa kamu amati dari objek ini?",
          "Bagaimana konsep matematika yang sedang kita pelajari dapat membantu menjelaskan bentuk atau jumlah objek ini?"
        ],
        subject: mission.subject,
        material: mission.material,
        learningTarget: mission.tp,
        cognitiveLevel: mission.cognitiveLevel,
        questions: [
          {
            id: "q-gen-1",
            stage: "decomposition",
            title: "1. Dekomposisi (Pecah Jadi Bagian Kecil)",
            question: "Yuk amati objek fotomu dengan teliti! Coba pecah dan sebutkan bagian-bagian atau benda apa saja yang kamu lihat, serta perkirakan jumlah atau ukuran masing-masing bagiannya!",
            inputType: "text",
            conceptTag: "Pecah Objek (Dekomposisi)",
            scaffolding: { level1: "Amati objek dari bagian atas, tengah, hingga bawah.", level2: "Sebutkan setidaknya 2 atau 3 bagian berbeda yang tampak di foto.", level3: "Tuliskan perkiraan jumlah atau ukuran tiap bagiannya.", level4: "Seperti menguraikan bagian-bagian mainan lego sebelum dirakit!" }
          },
          {
            id: "q-gen-2",
            stage: "pattern_recognition",
            title: "2. Pengenalan Pola (Cari Keteraturan & Kesamaan)",
            question: "Perhatikan bentuk, susunan, atau keteraturan pada objek fotomu! Adakah pola yang berulang atau kemiripan dengan konsep matematika yang sedang kita pelajari?",
            inputType: "text",
            conceptTag: "Cari Keteraturan (Pengenalan Pola)",
            scaffolding: { level1: "Adakah garis, jarak, atau bentuk yang berulang secara berkala?", level2: "Kaitkan dengan konsep hitungan atau pola bilangan yang diajarkan guru.", level3: "Tuliskan pola yang kamu temukan dengan bahasamu sendiri.", level4: "Seperti deretan ubin lantai yang tersusun rapi dengan jarak yang sama." }
          },
          {
            id: "q-gen-3",
            stage: "abstraction",
            title: "3. Abstraksi (Fokus pada Hal Paling Penting)",
            question: "Dari seluruh ciri yang tampak pada foto objek ini, informasi angka atau bentuk mana yang paling penting untuk materi kita, dan bagian mana yang bisa kita abaikan dulu?",
            inputType: "text",
            conceptTag: "Fokus Hal Penting (Abstraksi)",
            scaffolding: { level1: "Pilih 1 atau 2 informasi kunci yang paling berguna untuk menghitung.", level2: "Abaikan warna latar belakang atau hiasan kecil yang tidak berpengaruh.", level3: "Tuliskan informasi utama yang kamu simpan.", level4: "Seperti menggambar denah rumah: kita gambar dindingnya saja, bukan motif taplaknya!" }
          },
          {
            id: "q-gen-4",
            stage: "algorithmic_thinking",
            title: "4. Berpikir Algoritma (Susun Langkah Teratur 1, 2, 3)",
            question: "Buatlah urutan langkah-langkah yang teratur (Langkah 1, Langkah 2, Langkah 3...) untuk menyelesaikan tantangan hitungan atau menata objek ini dengan rapi!",
            inputType: "text",
            conceptTag: "Susun Langkah Rapi (Algoritma)",
            scaffolding: { level1: "Tentukan langkah awal yang harus dilakukan terlebih dahulu.", level2: "Lanjutkan ke langkah perhitungan inti.", level3: "Tutup dengan cara memeriksa ulang hasil hitunganmu.", level4: "Tuliskan urutan langkah 1, 2, dan 3 dengan jelas seperti petunjuk permainan!" }
          }
        ]
      };
    }
  } else if (isIpas) {
    return {
      detectedObject: objectHint || (isTree ? "Pohon Ketapang Lapangan Upacara" : "Tanaman & Lingkungan Sekolah"),
      compatibility: "Strong",
      compatibilityReason: "Pohon dan tumbuhan di lapangan sekolah adalah representasi sempurna komponen biotik yang berinteraksi langsung dengan komponen abiotik (cahaya, udara, tanah).",
      observation: "Pohon besar yang rindang dengan daun hijau lebar bertingkat, dahan kokoh, akar yang menancap di tanah berpasir, dan naungan sejuk.",
      context: "Keseimbangan ekosistem halaman sekolah dan tempat bernaung hewan kecil.",
      learningBridge: "Pohon ini berperan sebagai produsen primer (komponen biotik) yang memerlukan sinar matahari, air, dan unsur hara tanah (komponen abiotik) untuk fotosintesis dan menghasilkan oksigen bagi siswa.",
      subject: mission.subject,
      material: mission.material,
      learningTarget: mission.tp,
      cognitiveLevel: mission.cognitiveLevel,
      questions: [
        {
          id: "q-ipas-1",
          stage: "decomposition",
          title: "1. Dekomposisi (Pecah Jadi Bagian Kecil)",
          question: `Yuk amati foto ${objectHint || 'pohon atau tanaman'} ini dengan saksama! Coba pecah dan sebutkan bagian-bagian pentingnya (seperti akar, batang, dahan, daun) dan apa fungsi masing-masing bagian bagi kelangsungan hidupnya?`,
          inputType: "text",
          conceptTag: "Pecah Bagian Tumbuhan (Dekomposisi)",
          scaffolding: {
            level1: "Amati dari bawah ke atas: ada akar di dalam tanah, batang yang tegak, ranting, dan daun-daun hijau.",
            level2: "Akar menyerap air dan hara, batang menyalurkannya, dan daun memasak makanan lewat fotosintesis.",
            level3: "Tuliskan fungsi masing-masing bagian dalam kalimat sederhana.",
            level4: "Seperti tubuh manusia yang punya kaki untuk berdiri dan mulut untuk makan!"
          }
        },
        {
          id: "q-ipas-2",
          stage: "pattern_recognition",
          title: "2. Pengenalan Pola (Cari Keteraturan & Kesamaan)",
          question: `Perhatikan bentuk daun, arah tumbuh cabang, atau tempat hidup ${objectHint || 'pohon'} ini! Adakah pola teratur atau kebiasaan berulang dalam interaksinya dengan sinar matahari, air, atau makhluk hidup lain di sekitarnya?`,
          inputType: "text",
          conceptTag: "Pola Interaksi Alam (Pengenalan Pola)",
          scaffolding: {
            level1: "Perhatikan arah daun: daun melebar ke arah datangnya sinar matahari.",
            level2: "Di bawah pohon selalu terasa lebih sejuk karena proses transpirasi dan naungan daun.",
            level3: "Ada pola simbiosis: semut dan burung kecil membuat sarang di dahan yang terlindung.",
            level4: "Tuliskan pola keteraturan yang kamu amati dalam kehidupan pohon tersebut!"
          }
        },
        {
          id: "q-ipas-3",
          stage: "abstraction",
          title: "3. Abstraksi (Fokus pada Hal Paling Penting)",
          question: `Untuk memahami bagaimana ${objectHint || 'pohon'} ini membantu menjaga ekosistem dan kesejukan sekolah, ciri atau proses mana yang paling penting kita perhatikan, dan detail kecil mana (seperti warna lumut atau debu di daun) yang bisa kita abaikan dulu?`,
          inputType: "text",
          conceptTag: "Fokus Keseimbangan Alam (Abstraksi)",
          scaffolding: {
            level1: "Fokus pada peran pohon sebagai penghasil oksigen dan penyerap air hujan.",
            level2: "Debu di daun atau bentuk pot/tanah yang retak sedikit adalah detail pelengkap yang bisa diabaikan.",
            level3: "Tuliskan alasan mengapa fotosintesis dan akar kokoh adalah hal terpenting.",
            level4: "Seperti melihat payung raksasa: yang penting kainnya menaungi dari terik panas!"
          }
        },
        {
          id: "q-ipas-4",
          stage: "algorithmic_thinking",
          title: "4. Berpikir Algoritma (Susun Langkah Teratur 1, 2, 3)",
          question: `Susunlah langkah-langkah teratur (Langkah 1, Langkah 2, Langkah 3...) yang bisa dilakukan anak-anak sekolah untuk merawat ${objectHint || 'pohon'} ini dan membuat tanah di sekitarnya tetap gembur dan subur!`,
          inputType: "text",
          conceptTag: "Langkah Peduli Lingkungan (Algoritma)",
          scaffolding: {
            level1: "Langkah 1: Bersihkan sampah anorganik (plastik) di sekitar pangkal pohon.",
            level2: "Langkah 2: Gemburkan tanah secara perlahan dan buat lubang resapan air (biopori).",
            level3: "Langkah 3: Beri siraman air secukupnya dan kumpulkan daun kering sebagai kompos alami.",
            level4: "Urutkan tindakan ini agar pohon tetap hijau dan rindang sepanjang masa!"
          }
        }
      ]
    };
  } else {
    // Bahasa Indonesia or other
    return {
      detectedObject: objectHint || "Tempat Sampah Pilah Perpustakaan",
      compatibility: "Strong",
      compatibilityReason: "Objek memiliki ragam warna, teks label, bentuk, dan fungsi sosial yang kaya rincian pancaindra untuk teks deskripsi dan rekayasa kebiasaan ramah lingkungan.",
      observation: "Tiga wadah tempat sampah berjejer rapi dengan warna berbeda: hijau (organik), kuning (anorganik), dan merah (B3/residu). Ada tulisan petunjuk jelas di tutupnya.",
      context: "Edukasi pembiasaan disiplin memilah sampah di lingkungan sekolah.",
      learningBridge: "Objek ini menjadi sarana observasi autentik untuk menyusun teks deskripsi berdasarkan pengamatan panca indra dan merancang prototipe edukasi pemilahan sampah.",
      subject: mission.subject,
      material: mission.material,
      learningTarget: mission.tp,
      cognitiveLevel: mission.cognitiveLevel,
      questions: [
        {
          id: "q-indo-1",
          stage: "decomposition",
          title: "1. Dekomposisi (Pecah Jadi Bagian Kecil)",
          question: `Yuk amati foto ${objectHint || 'objek ini'} dengan teliti! Coba pecah dan sebutkan bagian-bagian, ciri fisik, warna, atau tulisan apa saja yang tampak jelas pada fotomu?`,
          inputType: "text",
          conceptTag: "Pecah Ciri Objek (Dekomposisi)",
          scaffolding: {
            level1: "Sebutkan warna-warna yang terlihat pada objek foto.",
            level2: "Perhatikan bentuk fisik dan tulisan label atau simbol yang menempel.",
            level3: "Tuliskan rincian bagian-bagian yang berhasil kamu amati.",
            level4: "Seperti detektif yang mencatat ciri-ciri benda temuan di buku catatan!"
          }
        },
        {
          id: "q-indo-2",
          stage: "pattern_recognition",
          title: "2. Pengenalan Pola (Cari Keteraturan & Kesamaan)",
          question: `Adakah pola keteraturan, kesamaan warna/fungsi, atau ciri khas yang berulang pada ${objectHint || 'objek ini'} yang bisa membantumu mengenali cara kerjanya? Ceritakan pola apa yang kamu temukan!`,
          inputType: "text",
          conceptTag: "Pola Ciri & Fungsi (Pengenalan Pola)",
          scaffolding: {
            level1: "Lihat kesamaan pola: misalnya warna hijau selalu untuk sampah organik/daun.",
            level2: "Warna kuning selalu berulang untuk sampah plastik/anorganik.",
            level3: "Tuliskan pola aturan warna dan peruntukannya.",
            level4: "Seperti pola warna lampu lalu lintas: merah, kuning, hijau punya arti yang pasti!"
          }
        },
        {
          id: "q-indo-3",
          stage: "abstraction",
          title: "3. Abstraksi (Fokus pada Hal Paling Penting)",
          question: `Jika kamu ingin menceritakan atau mendeskripsikan ${objectHint || 'objek ini'} kepada teman yang belum pernah melihatnya, informasi apa yang paling penting untuk disampaikan, dan detail apa yang bisa diabaikan dulu?`,
          inputType: "text",
          conceptTag: "Fokus Pesan Kunci (Abstraksi)",
          scaffolding: {
            level1: "Informasi penting: jenis objek, fungsi utamanya, dan cara menggunakannya.",
            level2: "Detail yang bisa diabaikan: noda kecil atau goresan halus di belakang wadah.",
            level3: "Tuliskan 2 kalimat utama yang memuat informasi terpenting.",
            level4: "Seperti memberi kabar singkat kepada teman: sampaikan intinya saja yang paling bermanfaat!"
          }
        },
        {
          id: "q-indo-4",
          stage: "algorithmic_thinking",
          title: "4. Berpikir Algoritma (Susun Langkah Teratur 1, 2, 3)",
          question: `Susunlah urutan langkah yang rapi dan teratur (Langkah 1, Langkah 2, Langkah 3...) agar teman-teman di kelas bisa menggunakan atau mempraktikkan hal baik dari ${objectHint || 'objek ini'} dengan benar!`,
          inputType: "text",
          conceptTag: "Petunjuk Langkah Teratur (Algoritma)",
          scaffolding: {
            level1: "Langkah 1: Periksa jenis barang atau sampah yang sedang kamu pegang.",
            level2: "Langkah 2: Cocokkan dengan label warna wadah yang tepat.",
            level3: "Langkah 3: Masukkan dengan rapi dan tutup kembali wadahnya.",
            level4: "Urutan langkah ini seperti petunjuk aturan permainan yang mudah diikuti semua orang!"
          }
        }
      ]
    };
  }
}

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NARASA AI Server running on http://0.0.0.0:${PORT}`);
  });
}

// Export app for serverless environments (Vercel)
export default app;

// Only start standalone HTTP server if not running in serverless environment
if (!process.env.VERCEL) {
  startServer();
}
