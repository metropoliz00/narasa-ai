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
      return res.status(400).json({ success: false, message: "API Key kosong." });
    }
    const testClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
    await testClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Test connection. Reply OK."
    });
    res.json({ success: true, message: "API Key Sekolah berhasil terhubung ke Google Gemini!" });
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
  // Candidate models list per official guidelines with robust failover
  const candidateModels = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    // Try up to 2 attempts per model with jittered exponential backoff
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
        console.warn(`[Gemini API] Request with model ${model} (attempt ${attempt}) encountered: ${errMsg.slice(0, 150)}`);

        const isTemporaryDemand =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.code === 503 ||
          err?.code === 429 ||
          errMsg.includes("Timeout") ||
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isTemporaryDemand && attempt < 2) {
          // Fast backoff before retry or failover
          const delay = 600 + Math.random() * 400;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        // Immediately fall over to next candidate model in pool
        break;
      }
    }
  }
  throw lastError;
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
    primaryModel: "gemini-2.5-flash",
    fallbackModels: ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"],
    serverTime: new Date().toISOString()
  });
});

// 1. Analyze Vision & Bridge to Learning Mission
app.post("/api/analyze-vision", async (req, res) => {
  try {
    const { imageBase64OrUrl, mission, objectHint } = req.body;

    if (!mission) {
      return res.status(400).json({ error: "Learning mission is required." });
    }

    const client = getAiClient();

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
8. Buat 3 pertanyaan bertahap:
   - Pertanyaan 1 (stage: 'challenge'): Soal kontekstual berbasis objek/informasi temuan murid tersebut sesuai materi guru.
   - Pertanyaan 2 (stage: 'reasoning'): "Mengapa kamu memilih jawaban tersebut? Jelaskan cara berpikirmu."
   - Pertanyaan 3 (stage: 'evidence'): "Apa bukti dari objek tersebut atau langkah perhitungan yang mendukung jawabanmu?"
   Masing-masing pertanyaan harus memiliki 4 tingkat Scaffolding:
   - level1: Petunjuk kecil
   - level2: Pertanyaan penuntun
   - level3: Masalah dipecah menjadi langkah kecil
   - level4: Contoh analog sederhana yang ramah anak SD.

Kembalikan HANYA format JSON valid tanpa tanda kutip markdown, sesuai skema:
{
  "detectedObject": "nama objek yang teridentifikasi dari informasi murid",
  "compatibility": "Strong" | "Moderate" | "Weak",
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
      "stage": "challenge",
      "title": "Tantangan Pemecahan Masalah",
      "question": "teks soal tantangan yang jelas untuk siswa SD berbasis deskripsi murid",
      "inputType": "text",
      "conceptTag": "label konsep",
      "scaffolding": {
        "level1": "petunjuk kecil",
        "level2": "pertanyaan penuntun",
        "level3": "masalah dipecah jadi langkah kecil",
        "level4": "contoh analog sederhana"
      }
    },
    {
      "id": "q-2",
      "stage": "reasoning",
      "title": "Alasan dan Cara Berpikir",
      "question": "pertanyaan penalaran mengapa memilih jawaban itu",
      "inputType": "text",
      "conceptTag": "Penalaran",
      "scaffolding": {
        "level1": "petunjuk kecil alasan",
        "level2": "pertanyaan penuntun alasan",
        "level3": "langkah kecil alasan",
        "level4": "analog alasan"
      }
    },
    {
      "id": "q-3",
      "stage": "evidence",
      "title": "Bukti & Verifikasi",
      "question": "pertanyaan pembuktian dengan data atau pengamatan dari deskripsi murid",
      "inputType": "text",
      "conceptTag": "Pembuktian",
      "scaffolding": {
        "level1": "petunjuk bukti",
        "level2": "pertanyaan penuntun bukti",
        "level3": "langkah bukti",
        "level4": "analog bukti"
      }
    }
  ]
}
`;

        const contents = prompt;

        const response = await callGeminiWithFallback(client, {
          contents: contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        });

        const text = response.text?.trim() || "{}";
        const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      } catch (_geminiError: any) {
        // High-demand or transient network error: safely hand off to pedagogical engine
      }
    }

    // High-Fidelity Pedagogical Fallback Engine (MockAIService)
    const fallbackResult = generatePedagogicalFallback(mission, objectHint, imageBase64OrUrl);
    return res.json(fallbackResult);
  } catch (err: any) {
    console.error("Error in /api/analyze-vision:", err);
    res.status(500).json({ error: err.message || "Failed to process image analysis" });
  }
});

// 2. Adaptive Scaffolding Hint Generator
app.post("/api/scaffold-hint", async (req, res) => {
  try {
    const { question, currentAnswer, currentLevel, mission } = req.body;
    const client = getAiClient();

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
        const parsed = JSON.parse(resp.text?.trim() || "{}");
        if (parsed.hint) {
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

    // Structured 10-slide standard presentation
    const slides = [
      {
        id: "slide-1",
        slideNumber: 1,
        title: `Hasil Eksplorasi: ${imageLabel || learningBridge.detectedObject}`,
        subtitle: `${missionTitle} • Oleh ${studentName}`,
        content: `Halo teman-teman! Saya ${studentName}. Hari ini saya menemukan konsep ${subject} yang tersembunyi pada objek nyata di sekitar kita.`,
        image: image,
        speakingNotes: "Beri salam pembuka dengan hangat. Sebutkan nama dan perkenalkan objek menarik yang kamu amati.",
        layout: "title"
      },
      {
        id: "slide-2",
        slideNumber: 2,
        title: "Apa yang Saya Temukan?",
        subtitle: "Hasil Observasi Visual",
        content: learningBridge.observation || "Pengamatan rinci terhadap bentuk, pola, dan karakteristik objek nyata.",
        bullets: [
          `Objek utama: ${learningBridge.detectedObject}`,
          `Konteks: ${learningBridge.context || 'Lingkungan sekitar'}`,
          "Karakteristik visual teramati secara langsung melalui kamera"
        ],
        image: image,
        speakingNotes: "Ajak teman-teman memperhatikan foto. Ceritakan detail yang kamu lihat secara langsung.",
        layout: "split-photo"
      },
      {
        id: "slide-3",
        slideNumber: 3,
        title: "Hubungannya dengan Pelajaran",
        subtitle: "Jembatan Konsep Materi",
        content: learningBridge.learningBridge || "Objek ini memiliki kaitan erat dengan materi pelajaran yang sedang kita pelajari di kelas.",
        bullets: [
          `Mata Pelajaran: ${subject}`,
          `Materi: ${learningBridge.material}`,
          `Target: ${learningBridge.learningTarget}`
        ],
        speakingNotes: "Jelaskan bagaimana benda di foto bisa dihubungkan dengan pelajaran yang diajarkan bapak/ibu guru.",
        layout: "observation"
      },
      {
        id: "slide-4",
        slideNumber: 4,
        title: "Tantangan Saya",
        subtitle: "Masalah Kontekstual yang Dihadapi",
        content: learningBridge.questions?.[0]?.question || "Tantangan penalaran untuk memecahkan masalah nyata dari foto.",
        speakingNotes: "Bacakan soal tantangan dengan intonasi jelas agar teman-teman memahami masalahnya.",
        layout: "observation"
      },
      {
        id: "slide-5",
        slideNumber: 5,
        title: "Bukti & Data yang Digunakan",
        subtitle: "Fakta Pendukung dan Verifikasi",
        content: answers.evidence || "Bukti konkret yang dikumpulkan dari pengamatan foto dan langkah perhitungan terstruktur.",
        speakingNotes: "Tunjukkan bukti dari foto atau langkah yang membuat jawabanmu valid dan masuk akal.",
        layout: "reasoning"
      },
      {
        id: "slide-6",
        slideNumber: 6,
        title: "Cara Saya Berpikir",
        subtitle: "Alasan & Strategi Pemecahan",
        content: answers.reason || "Penalaran di balik pilihan metode dan strategi pemecahan masalah.",
        bullets: [
          `Strategi: ${answers.strategy || 'Analisis terstruktur'}`,
          "Menguji kewajaran hasil secara kritis"
        ],
        speakingNotes: "Ceritakan proses berpikirmu: Mengapa kamu memilih jalan penyelesaian tersebut?",
        layout: "reasoning"
      },
      {
        id: "slide-7",
        slideNumber: 7,
        title: "Solusi Saya",
        subtitle: "Jawaban Akhir Terverifikasi",
        content: answers.challengeAnswer || "Hasil pemecahan masalah yang telah dibuktikan.",
        speakingNotes: "Sampaikan jawaban akhirmu dengan percaya diri dan jelaskan maknanya.",
        layout: "solution"
      },
      {
        id: "slide-8",
        slideNumber: 8,
        title: "Kesimpulan",
        subtitle: "Intisari Pembelajaran",
        content: answers.conclusion || "Pelajaran berharga yang dapat diterapkan dalam kehidupan sehari-hari.",
        speakingNotes: "Tarik intisari utama dari apa yang telah kamu selesaikan bersama teman-teman.",
        layout: "conclusion"
      },
      {
        id: "slide-9",
        slideNumber: 9,
        title: "Refleksi Diri Saya",
        subtitle: "Evaluasi Proses Belajar",
        content: reflection?.q2Learned || "Pengalaman belajar dan cara mengatasi bagian yang menantang.",
        bullets: [
          `Hal yang dipelajari: ${reflection?.q2Learned || 'Konsep baru'}`,
          `Tantangan terbesar: ${reflection?.q3Hardest || 'Merangkai alasan'}`,
          `Rencana perbaikan: ${reflection?.q5Improvement || 'Terus berlatih'}`
        ],
        speakingNotes: "Bagikan refleksi jujurmu tentang apa yang paling berkesan dan hal yang ingin diperbaiki.",
        layout: "reflection"
      },
      {
        id: "slide-10",
        slideNumber: 10,
        title: "Terima Kasih!",
        subtitle: "Sesi Diskusi & Tanya Teman",
        content: "“Dunia di sekitarmu penuh dengan pertanyaan. Teruslah mengamati, menalar, dan menemukan jawabannya!”",
        speakingNotes: "Tutup presentasi dengan senyuman dan undang teman-teman untuk bertanya.",
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
    const { title, content, notes } = req.body;
    const client = getAiClient();

    if (client) {
      try {
        const prompt = `
Anda adalah asisten presentasi di NARASA AI untuk siswa SD.
Tolong rapikan kalimat slide berikut agar lebih rapi, terstruktur, mudah dibaca, dan menarik didengar saat dipresentasikan di depan kelas.
PENTING: JANGAN ubah gagasan atau inti pemikiran siswa. Hanya perbaiki tata bahasa, kejelasan, dan keramahan bahasa anak SD.

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
        const parsed = JSON.parse(resp.text?.trim() || "{}");
        if (parsed.polishedContent) {
          return res.json(parsed);
        }
      } catch (_e) {
        // Fallback to simple slide polisher
      }
    }

    res.json({
      polishedTitle: title,
      polishedContent: content.trim() + (content.endsWith(".") ? "" : "."),
      polishedNotes: notes || "Bicaralah dengan suara jelas, tatap teman-temanmu, dan tersenyumlah."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Generate Contextual Peer Question
app.post("/api/peer-question", async (req, res) => {
  try {
    const { topic, context } = req.body;
    const client = getAiClient();

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
        const parsed = JSON.parse(resp.text?.trim() || "{}");
        if (parsed.question) {
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

    const client = getAiClient();
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

        const text = resp.text?.trim() || "{}";
        const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(cleaned);

        if (parsed.questions && parsed.questions.length > 0) {
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
            stage: "challenge",
            title: "Tantangan Pemecahan Masalah",
            question: "Bel piket kelas berbunyi setiap 4 menit, sedangkan alarm ganti stasiun baca berbunyi setiap 6 menit. Jika keduanya berbunyi bersamaan pukul 08.00, pada menit ke berapa lagi keduanya akan berbunyi bersamaan untuk pertama kali?",
            inputType: "text",
            conceptTag: "Penentuan KPK",
            scaffolding: {
              level1: "Coba tuliskan menit-menit kelipatan dari bel piket (kelipatan 4) dan bel stasiun baca (kelipatan 6).",
              level2: "Apakah kita mencari angka persekutuan yang paling kecil dari kedua jadwal tersebut?",
              level3: "Kelipatan 4 = 4, 8, 12, 16... Kelipatan 6 = 6, 12, 18... Mana angka pertama yang sama pada kedua deret?",
              level4: "Bayangkan dua katak melompat: katak pertama melompat 4 langkah sekali, katak kedua 6 langkah sekali. Kapan mereka mendarat di batu yang sama?"
            }
          },
          {
            id: "q-math-2",
            stage: "reasoning",
            title: "Alasan dan Cara Berpikir",
            question: "Mengapa kamu memilih menggunakan konsep KPK (Kelipatan Persekutuan Terkecil) dan bukan FPB untuk masalah jadwal berulang ini?",
            inputType: "text",
            conceptTag: "Penalaran Matematis",
            scaffolding: {
              level1: "Ingat kata kuncinya: apakah kita membagi suatu kumpulan benda menjadi bagian lebih kecil, atau mencari waktu pertemuan di masa depan yang makin besar?",
              level2: "KPK digunakan saat ada kegiatan yang berulang pada interval waktu tertentu dan kita ingin tahu kapan bertemu lagi.",
              level3: "FPB untuk membagi adil, KPK untuk jadwal berulang. Jelaskan perbedaan kedua kebutuhan ini pada soal jam.",
              level4: "Jika membagi 12 kue ke beberapa teman itu FPB. Tapi jika jam berdering tiap beberapa menit, itu KPK."
            }
          },
          {
            id: "q-math-3",
            stage: "evidence",
            title: "Bukti & Langkah Perhitungan",
            question: "Tuliskan langkah perhitunganmu dengan jelas! Tunjukkan deret kelipatan atau faktorisasi prima yang menjadi bukti jawabanmu.",
            inputType: "text",
            conceptTag: "Pembuktian Konkret",
            scaffolding: {
              level1: "Tuliskan faktorisasi prima dari 4 dan 6, atau deret kelipatan keduanya.",
              level2: "Faktorisasi: 4 = 2², 6 = 2 × 3. Untuk KPK, ambil semua faktor dengan pangkat terbesar.",
              level3: "KPK = 2² × 3 = 4 × 3 = 12. Jadi menit ke-12 (pukul 08.12).",
              level4: "Periksa kembali: 12 bisa dibagi 4 (hasil 3) dan 12 bisa dibagi 6 (hasil 2). Pas!"
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
            stage: "challenge",
            title: "Tantangan Pembagian Merata",
            question: "Ibu kantin memiliki 24 pastel dan 36 lemper. Berapa jumlah kotak terbanyak yang bisa disiapkan agar setiap kotak berisi pastel dan lemper sama banyak tanpa ada yang tersisa?",
            inputType: "text",
            conceptTag: "Penentuan FPB",
            scaffolding: {
              level1: "Coba cari faktor pembagi dari 24 dan 36.",
              level2: "Faktor dari 24 adalah bilangan yang bisa membagi habis 24.",
              level3: "Faktor 24: 1, 2, 3, 4, 6, 8, 12, 24. Faktor 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Mana faktor persekutuan terbesar?",
              level4: "Angka terbesar yang bisa membagi 24 dan 36 adalah 12 kotak."
            }
          },
          {
            id: "q-fpb-2",
            stage: "reasoning",
            title: "Alasan Pemilihan Konsep",
            question: "Mengapa masalah ini diselesaikan dengan FPB dan bukan dengan KPK?",
            inputType: "text",
            conceptTag: "Penalaran",
            scaffolding: {
              level1: "Perhatikan tujuannya: apakah kita membagi benda menjadi kelompok kecil, atau menunggu kejadian berulang?",
              level2: "Membagi habis secara adil merupakan ciri khas dari faktor pembagi.",
              level3: "Jelaskan bahwa membagi merata benda nyata adalah fungsi FPB.",
              level4: "Bayangkan memotong pita atau membagikan kue ke dalam piring."
            }
          },
          {
            id: "q-fpb-3",
            stage: "evidence",
            title: "Bukti Isi Setiap Kotak",
            question: "Buktikan berapa buah pastel dan berapa buah lemper yang ada di dalam masing-masing kotak!",
            inputType: "text",
            conceptTag: "Pembuktian",
            scaffolding: {
              level1: "Bagi jumlah total makanan dengan jumlah kotak (12).",
              level2: "Pastel: 24 dibagi 12 = ? Lemper: 36 dibagi 12 = ?",
              level3: "Tiap kotak berisi 2 pastel dan 3 lemper.",
              level4: "Periksa: 12 × 2 = 24 pastel, 12 × 3 = 36 lemper. Tepat habis!"
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
            stage: "challenge",
            title: "Tantangan Analisis Kuantitatif",
            question: "Bagaimana kamu mengelompokkan elemen pada objek ini agar membentuk pola kelipatan teratur?",
            inputType: "text",
            conceptTag: "Pola & Kelipatan",
            scaffolding: {
              level1: "Hitung elemen penyusun yang terlihat.",
              level2: "Cari pola angka yang berulang.",
              level3: "Kelompokkan menjadi bagian-bagian yang sama banyak.",
              level4: "Bayangkan menata buku atau deretan bangku."
            }
          },
          {
            id: "q-gen-2",
            stage: "reasoning",
            title: "Penalaran Strategi",
            question: "Apa alasanmu memilih cara pengelompokan tersebut?",
            inputType: "text",
            conceptTag: "Penalaran",
            scaffolding: {
              level1: "Jelaskan keuntungan pola yang kamu pilih.",
              level2: "Apakah pola tersebut memudahkan perhitungan?",
              level3: "Uraikan keterkaitan dengan konsep materi kelas.",
              level4: "Beri contoh sederhana."
            }
          },
          {
            id: "q-gen-3",
            stage: "evidence",
            title: "Pembuktian Hasil",
            question: "Tunjukkan bukti bahwa susunan kelompokmu pas dan tidak bersisa!",
            inputType: "text",
            conceptTag: "Pembuktian",
            scaffolding: {
              level1: "Gunakan perkalian atau pembagian untuk verifikasi.",
              level2: "Tuliskan angka pengujinya.",
              level3: "Buktikan dengan persamaan matematika.",
              level4: "Cek kembali hasil akhirmu."
            }
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
          stage: "challenge",
          title: "Analisis Interaksi Biotik & Abiotik",
          question: "Sebutkan 2 komponen biotik dan 2 komponen abiotik yang saling berinteraksi pada lingkungan sekitar pohon tersebut!",
          inputType: "text",
          conceptTag: "Identifikasi Komponen Ekosistem",
          scaffolding: {
            level1: "Biotik = makhluk hidup, Abiotik = benda mati penunjang kehidupan.",
            level2: "Lihat makhluk yang hidup di pohon dan apa yang membuat pohon itu tetap segar.",
            level3: "Biotik: pohon dan semut/burung. Abiotik: sinar matahari dan tanah.",
            level4: "Seperti ikan di akuarium: ikan itu biotik, air dan batu itu abiotik."
          }
        },
        {
          id: "q-ipas-2",
          stage: "reasoning",
          title: "Penalaran Hubungan Timbal Balik",
          question: "Bagaimana kondisi siswa di lapangan upacara jika pohon rindang tersebut ditebang? Jelaskan alasannya menggunakan bukti lingkungan dari foto!",
          inputType: "text",
          conceptTag: "Analisis Sebab Akibat",
          scaffolding: {
            level1: "Perhatikan bayangan teduh di bawah pohon pada foto.",
            level2: "Pohon menyerap panas dan menghasilkan oksigen saat fotosintesis.",
            level3: "Tanpa pohon, lapangan akan terasa sangat panas dan udara terasa gersang.",
            level4: "Bayangkan berdiri di tengah lapangan terik tanpa payung sama sekali."
          }
        },
        {
          id: "q-ipas-3",
          stage: "evidence",
          title: "Bukti Peran Menjaga Lingkungan",
          question: "Apa bukti nyata dari foto yang menunjukkan bahwa pohon tersebut dalam kondisi sehat dan mendukung kehidupan di sekitarnya?",
          inputType: "text",
          conceptTag: "Bukti Observasi",
          scaffolding: {
            level1: "Perhatikan warna daun dan kekokohan batangnya.",
            level2: "Daun hijau segar menandakan klorofil dan fotosintesis berjalan optimal.",
            level3: "Tuliskan rincian warna daun, lebatnya dahan, dan tanah di sekelilingnya.",
            level4: "Bandingkan dengan pohon yang daunnya menguning dan kering."
          }
        }
      ]
    };
  } else {
    // Bahasa Indonesia or other
    return {
      detectedObject: objectHint || "Tempat Sampah Pilah Perpustakaan",
      compatibility: "Strong",
      compatibilityReason: "Objek memiliki ragam warna, teks label, bentuk, dan fungsi sosial yang kaya rincian pancaindra untuk teks deskripsi.",
      observation: "Tiga wadah tempat sampah berjejer rapi dengan warna berbeda: hijau (organik), kuning (anorganik), dan merah (B3/residu). Ada tulisan petunjuk jelas di tutupnya.",
      context: "Edukasi pembiasaan disiplin memilah sampah di lingkungan sekolah.",
      learningBridge: "Objek ini menjadi sarana observasi autentik untuk menyusun teks deskripsi berdasarkan pengamatan panca indra (penglihatan warna, bentuk tabung, tulisan) dan tujuan penggunaannya.",
      subject: mission.subject,
      material: mission.material,
      learningTarget: mission.tp,
      cognitiveLevel: mission.cognitiveLevel,
      questions: [
        {
          id: "q-indo-1",
          stage: "challenge",
          title: "Tantangan Observasi Sensorik",
          question: "Temukan 4 detail sensorik (warna, bentuk, tulisan, dan kondisi fisik) dari tempat sampah yang kamu amati di foto!",
          inputType: "text",
          conceptTag: "Penemuan Informasi",
          scaffolding: {
            level1: "Gunakan matamu: sebutkan warna tiap tabung dan apa yang tertulis di badannya.",
            level2: "Bentuk tabungnya seperti apa? Bagaimana kondisi kebersihannya?",
            level3: "Tuliskan: 1. Tiga warna cerah, 2. Bentuk silinder, 3. Tulisan pilah, 4. Tutup berlubang.",
            level4: "Ceritakan seolah-olah kamu mendeskripsikannya ke teman yang sedang memejamkan mata."
          }
        },
        {
          id: "q-indo-2",
          stage: "reasoning",
          title: "Penalaran Fungsi dan Tata Letak",
          question: "Mengapa penting meletakkan tempat sampah pilah berdampingan dan diberi warna berbeda? Jelaskan dengan kalimat deskripsi yang meyakinkan!",
          inputType: "text",
          conceptTag: "Evaluasi & Alasan",
          scaffolding: {
            level1: "Bayangkan jika warnanya sama semua dan tidak ada tulisannya.",
            level2: "Warna berbeda membantu orang mengenali jenis sampah seketika tanpa kebingungan.",
            level3: "Hubungkan pemilahan sampah organik dan anorganik dengan kemudahan daur ulang.",
            level4: "Seperti lampu lalu lintas: warna merah, kuning, dan hijau punya arti yang langsung dipahami."
          }
        },
        {
          id: "q-indo-3",
          stage: "evidence",
          title: "Penyusunan Teks Deskripsi Singkat",
          question: "Susunlah 1 paragraf teks deskripsi (3-4 kalimat) berdasarkan fakta yang benar-benar terlihat pada foto, tanpa rekaan!",
          inputType: "text",
          conceptTag: "Kreasi Teks Deskripsi",
          scaffolding: {
            level1: "Mulai dengan kalimat pengenal: Di depan perpustakaan sekolah terdapat...",
            level2: "Lanjutkan dengan mendeskripsikan warna dan bentuknya secara berurutan.",
            level3: "Tutup dengan kalimat kesan tentang kebersihan dan keteraturannya.",
            level4: "Gunakan kata sifat: rapi, bersih, mencolok, terawat."
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
