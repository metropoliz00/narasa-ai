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

// Helper to call Gemini with model pooling, exponential backoff, and instant fallback for 503 / high demand spikes
async function callGeminiWithFallback(
  client: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  },
  timeoutMs: number = 20000
) {
  // Candidate models list per official guidelines with robust failover
  const candidateModels = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
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
      console.info(`[Gemini API] Model ${model} unavailable or busy (${errMsg.slice(0, 80)}...), falling over to next model in pool.`);
      // Continue loop to try next model in pool immediately
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
8. Rancang 8 Pertanyaan Eksplorasi Terstruktur mengikuti Pola Berpikir STEM:
   - Tahap 1 (stage: 'real_problem', title: '1. Masalah Nyata'): Identifikasi masalah nyata atau tantangan autentik dari objek foto sesuai materi.
   - Tahap 2 (stage: 'ask_inquire', title: '2. Bertanya & Mencari Informasi'): Pertanyaan penyelidikan inkuiri dan pengumpulan konsep/rumus sains/matematika.
   - Tahap 3 (stage: 'design_solution', title: '3. Merancang Solusi'): Rancangan ide solusi kreatif, strategi logis, dan langkah pemecahan.
   - Tahap 4 (stage: 'prototype', title: '4. Membuat Produk/Prototipe'): Cara mewujudkan produk nyata, model hitungan, skema alat, atau prototipe.
   - Tahap 5 (stage: 'testing', title: '5. Menguji'): Prosedur pengujian, simulasi, dan tolok ukur uji coba prototipe/solusi.
   - Tahap 6 (stage: 'data_analysis', title: '6. Menganalisis Data'): Pengolahan data angka, tabel, atau pembuktian hasil perhitungan.
   - Tahap 7 (stage: 'improvement', title: '7. Memperbaiki'): Evaluasi kendala dan langkah iterasi penyempurnaan desain.
   - Tahap 8 (stage: 'communication', title: '8. Mengomunikasikan Hasil'): Kesimpulan akhir dan pesan kunci untuk dipresentasikan di kelas.
   Masing-masing dari 8 pertanyaan harus memiliki 4 tingkat Scaffolding:
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
      "stage": "real_problem",
      "title": "1. Masalah Nyata",
      "question": "pertanyaan identifikasi masalah nyata dari objek foto",
      "inputType": "text",
      "conceptTag": "Masalah Autentik",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-2",
      "stage": "ask_inquire",
      "title": "2. Bertanya & Mencari Informasi",
      "question": "pertanyaan inkuiri konsep dan penggalian informasi",
      "inputType": "text",
      "conceptTag": "Inkuiri Konsep",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-3",
      "stage": "design_solution",
      "title": "3. Merancang Solusi",
      "question": "pertanyaan perancangan ide solusi kreatif",
      "inputType": "text",
      "conceptTag": "Desain Solusi",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-4",
      "stage": "prototype",
      "title": "4. Membuat Produk/Prototipe",
      "question": "pertanyaan realisasi produk atau model kerja",
      "inputType": "text",
      "conceptTag": "Realisasi Prototipe",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-5",
      "stage": "testing",
      "title": "5. Menguji",
      "question": "pertanyaan pengujian dan uji coba kriteria",
      "inputType": "text",
      "conceptTag": "Uji Coba",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-6",
      "stage": "data_analysis",
      "title": "6. Menganalisis Data",
      "question": "pertanyaan analisis data dan bukti hitungan",
      "inputType": "text",
      "conceptTag": "Analisis Data",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-7",
      "stage": "improvement",
      "title": "7. Memperbaiki",
      "question": "pertanyaan evaluasi kendala dan perbaikan desain",
      "inputType": "text",
      "conceptTag": "Iterasi Desain",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
    },
    {
      "id": "q-8",
      "stage": "communication",
      "title": "8. Mengomunikasikan Hasil",
      "question": "pertanyaan kesimpulan dan pesan presentasi",
      "inputType": "text",
      "conceptTag": "Komunikasi Hasil",
      "scaffolding": { "level1": "...", "level2": "...", "level3": "...", "level4": "..." }
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
    const { title, content, notes } = req.body;
    const client = getAiClient(req);

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
            stage: "real_problem",
            title: "1. Masalah Nyata",
            question: "Bel piket kelas berbunyi setiap 4 menit, sedangkan alarm ganti stasiun baca berbunyi setiap 6 menit. Keduanya sering berbunyi tabrakan atau membuat murid bingung jika tidak diatur dengan tepat.",
            inputType: "text",
            conceptTag: "Identifikasi Masalah Interval",
            scaffolding: {
              level1: "Perhatikan masalahnya: dua jadwal bel dengan interval waktu berbeda berjalan bersamaan.",
              level2: "Kapan kedua bel tersebut berbunyi di saat yang persis bersamaan?",
              level3: "Tuliskan masalah utama: menentukan waktu sinkronisasi dua jadwal waktu berulang.",
              level4: "Bayangkan dua lampu kelap-kelip dengan jeda berbeda yang menyala bersama di detik tertentu."
            }
          },
          {
            id: "q-math-2",
            stage: "ask_inquire",
            title: "2. Bertanya & Mencari Informasi",
            question: "Apa pertanyaan penyelidikanmu dan informasi/konsep matematika apa yang kamu butuhkan untuk menghitung kapan bel berbunyi bersama?",
            inputType: "text",
            conceptTag: "Inkuiri Konsep KPK",
            scaffolding: {
              level1: "Tuliskan interval kedua bel: 4 menit dan 6 menit.",
              level2: "Apakah konsep KPK (Kelipatan Persekutuan Terkecil) cocok untuk mencari waktu pertemuan berulang?",
              level3: "Cari deret kelipatan dari 4 dan 6.",
              level4: "Kelipatan 4: 4, 8, 12, 16... Kelipatan 6: 6, 12, 18..."
            }
          },
          {
            id: "q-math-3",
            stage: "design_solution",
            title: "3. Merancang Solusi",
            question: "Bagaimana rancangan strategi langkah perhitunganmu untuk menemukan menit ke berapa kedua bel berbunyi bersama?",
            inputType: "text",
            conceptTag: "Rancangan Solusi Hitung",
            scaffolding: {
              level1: "Rencanakan metode: bisa menggunakan pohon faktor prima atau tabel kelipatan persekutuan.",
              level2: "Pohon faktor 4 = 2², pohon faktor 6 = 2 × 3.",
              level3: "Ambil seluruh faktor prima dengan pangkat tertinggi: 2² × 3.",
              level4: "Hitung 4 × 3 = 12 menit."
            }
          },
          {
            id: "q-math-4",
            stage: "prototype",
            title: "4. Membuat Produk/Prototipe",
            question: "Buatlah model jadwal / garis waktu sinkronisasi bel (misal tabel waktu atau diagram jam) untuk 30 menit ke depan!",
            inputType: "text",
            conceptTag: "Pembuatan Model Jadwal",
            scaffolding: {
              level1: "Buat garis waktu dari menit ke-0 sampai menit ke-30.",
              level2: "Tandai bunyi Bel A pada menit: 4, 8, 12, 16, 20, 24, 28.",
              level3: "Tandai bunyi Bel B pada menit: 6, 12, 18, 24, 30.",
              level4: "Lingkari titik pertemuan di menit 12 dan 24!"
            }
          },
          {
            id: "q-math-5",
            stage: "testing",
            title: "5. Menguji",
            question: "Ujilah model jadwalmu! Apakah pada menit ke-12 dan menit ke-24 kedua bel benar-benar berbunyi serentak tanpa meleset?",
            inputType: "text",
            conceptTag: "Uji Coba Model",
            scaffolding: {
              level1: "Periksa pembagian: 12 dibagi 4 = 3 (pas), 12 dibagi 6 = 2 (pas).",
              level2: "Periksa kelipatan berikutnya: 24 dibagi 4 = 6, 24 dibagi 6 = 4.",
              level3: "Pastikan tidak ada menit sebelum 12 yang memiliki bunyi bersama.",
              level4: "Uji coba terbukti akurat!"
            }
          },
          {
            id: "q-math-6",
            stage: "data_analysis",
            title: "6. Menganalisis Data",
            question: "Analisis data dari tabel jadwal: Berapa kali kedua bel berbunyi bersama selama 1 jam (60 menit)? Tunjukkan buktinya!",
            inputType: "text",
            conceptTag: "Analisis Data Kuantitatif",
            scaffolding: {
              level1: "Karena KPK = 12 menit, bagi 60 menit dengan 12.",
              level2: "60 : 12 = 5 kali pertemuan.",
              level3: "Tuliskan menit ke-12, 24, 36, 48, dan 60.",
              level4: "Data membuktikan interval pertemuan tepat berulang setiap 12 menit."
            }
          },
          {
            id: "q-math-7",
            stage: "improvement",
            title: "7. Memperbaiki",
            question: "Jika sekolah ingin kedua bel tidak terlalu sering berbunyi bersamaan (misal hanya tiap 20 menit), interval bel apa yang harus diperbaiki?",
            inputType: "text",
            conceptTag: "Iterasi & Optimasi",
            scaffolding: {
              level1: "Pikirkan pasangan interval bilangan yang memiliki KPK 20, misalnya 4 menit dan 5 menit atau 4 menit dan 10 menit.",
              level2: "Ubah salah satu interval agar beban suara bel lebih teratur.",
              level3: "Tuliskan perubahan interval yang diusulkan dan hitung KPK barunya.",
              level4: "Misal: ganti bel 6 menit menjadi 5 menit, maka KPK(4,5) = 20 menit."
            }
          },
          {
            id: "q-math-8",
            stage: "communication",
            title: "8. Mengomunikasikan Hasil",
            question: "Susun kesimpulan proyek STEM ini dan pesan yang akan kamu presentasikan kepada guru dan teman-teman!",
            inputType: "text",
            conceptTag: "Komunikasi Presentasi",
            scaffolding: {
              level1: "Sampaikan bahwa KPK adalah alat matematika yang sangat praktis untuk menata jadwal berulang.",
              level2: "Jelaskan bahwa proyek penjadwalan ini membantu sekolah mengatur aktivitas tanpa kekacauan.",
              level3: "Ucapkan terima kasih dan undang teman-teman untuk bertanya.",
              level4: "Siapkan 2 kalimat penutup yang percaya diri."
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
            stage: "real_problem",
            title: "1. Masalah Nyata",
            question: "Ibu kantin memiliki 24 pastel dan 36 lemper yang harus dimasukkan ke dalam beberapa kotak bekal snack dengan isi sama rata tanpa ada sisa sedikit pun.",
            inputType: "text",
            conceptTag: "Identifikasi Masalah Pembagian",
            scaffolding: {
              level1: "Fokus pada kebutuhan: membagi habis 24 pastel dan 36 lemper.",
              level2: "Berapa kotak terbanyak yang bisa disiapkan?",
              level3: "Tentukan FPB dari 24 dan 36.",
              level4: "Bayangkan mengemas souvenir ulang tahun agar setiap bingkisan adil isinya."
            }
          },
          {
            id: "q-fpb-2",
            stage: "ask_inquire",
            title: "2. Bertanya & Mencari Informasi",
            question: "Pertanyaan penyelidikan apa yang kamu ajukan dan konsep apa yang kamu gunakan (FPB atau KPK)? Jelaskan alasannya!",
            inputType: "text",
            conceptTag: "Inkuiri Konsep FPB",
            scaffolding: {
              level1: "Apakah kita membagi benda menjadi kelompok kecil yang adil? Itu ciri FPB.",
              level2: "Faktor pembagi dari 24: 1, 2, 3, 4, 6, 8, 12, 24.",
              level3: "Faktor pembagi dari 36: 1, 2, 3, 4, 6, 9, 12, 18, 36.",
              level4: "Faktor persekutuan terbesar yang sama adalah 12."
            }
          },
          {
            id: "q-fpb-3",
            stage: "design_solution",
            title: "3. Merancang Solusi",
            question: "Rancanglah strategi pembagian adil: Bagaimana kamu menentukan isi setiap kotak (berapa pastel dan berapa lemper)?",
            inputType: "text",
            conceptTag: "Desain Skema Kotak",
            scaffolding: {
              level1: "Bagi jumlah kue dengan jumlah kotak (12).",
              level2: "Pastel: 24 : 12 = 2 buah per kotak.",
              level3: "Lemper: 36 : 12 = 3 buah per kotak.",
              level4: "Rancangan: 12 kotak, masing-masing berisi 2 pastel dan 3 lemper."
            }
          },
          {
            id: "q-fpb-4",
            stage: "prototype",
            title: "4. Membuat Produk/Prototipe",
            question: "Buatlah skema layout kotak kemasan makanan atau tabel distribusi pembagian untuk membuktikan rancanganmu!",
            inputType: "text",
            conceptTag: "Prototipe Distribusi",
            scaffolding: {
              level1: "Gambarkan atau tuliskan tabel 12 kotak.",
              level2: "Di tiap kotak tuliskan: 2 Pastel + 3 Lemper = 5 kue per kotak.",
              level3: "Hitung total kue dalam 1 kotak: 5 kue.",
              level4: "Total 12 kotak × 5 kue = 60 kue."
            }
          },
          {
            id: "q-fpb-5",
            stage: "testing",
            title: "5. Menguji",
            question: "Ujilah rancanganmu: Kalikan kembali jumlah kotak dengan isi masing-masing. Apakah jumlahnya persis 24 pastel dan 36 lemper?",
            inputType: "text",
            conceptTag: "Uji Coba Matematis",
            scaffolding: {
              level1: "Uji pastel: 12 × 2 = 24. Cocok!",
              level2: "Uji lemper: 12 × 3 = 36. Cocok!",
              level3: "Sisa kue = 0 (habis sempurna).",
              level4: "Pengujian membuktikan solusi tepat dan adil."
            }
          },
          {
            id: "q-fpb-6",
            stage: "data_analysis",
            title: "6. Menganalisis Data",
            question: "Analisis data hasil pembagian: Jika harga pastel Rp2.000 dan lemper Rp1.500, berapa nilai total makanan di setiap kotak?",
            inputType: "text",
            conceptTag: "Analisis Kuantitatif & Nilai",
            scaffolding: {
              level1: "Pastel di kotak: 2 × Rp2.000 = Rp4.000.",
              level2: "Lemper di kotak: 3 × Rp1.500 = Rp4.500.",
              level3: "Total per kotak: Rp4.000 + Rp4.500 = Rp8.500.",
              level4: "Data menunjukkan nilai tiap kotak sama rata."
            }
          },
          {
            id: "q-fpb-7",
            stage: "improvement",
            title: "7. Memperbaiki",
            question: "Jika ibu kantin menambah 12 pastel lagi (total 36 pastel & 36 lemper), perbaikan apa yang terjadi pada jumlah kotak atau isinya?",
            inputType: "text",
            conceptTag: "Iterasi Solusi",
            scaffolding: {
              level1: "Hitung FPB baru dari 36 dan 36 = 36 kotak.",
              level2: "Atau jika tetap 12 kotak, isi pastel naik menjadi 3 buah per kotak.",
              level3: "Jelaskan pilihan optimasi yang paling efisien.",
              level4: "Solusi menjadi semakin fleksibel."
            }
          },
          {
            id: "q-fpb-8",
            stage: "communication",
            title: "8. Mengomunikasikan Hasil",
            question: "Rangkum kesimpulan proyek pembagian ini dan pesan kunci yang siap kamu bagikan ke kelas!",
            inputType: "text",
            conceptTag: "Komunikasi Solusi",
            scaffolding: {
              level1: "Sampaikan bahwa FPB membantu kita membagi sumber daya secara adil dan efisien.",
              level2: "Jelaskan solusi akhir: 12 kotak snack siap dibagikan.",
              level3: "Tutup dengan pesan kebersamaan yang hangat.",
              level4: "Siapkan kalimat presentasi yang lugas."
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
            stage: "real_problem",
            title: "1. Masalah Nyata",
            question: "Amati objek ini: Masalah penataan atau keteraturan apa yang dapat kamu temukan yang membutuhkan pemecahan matematika?",
            inputType: "text",
            conceptTag: "Masalah Autentik",
            scaffolding: { level1: "Perhatikan jumlah atau susunan objek.", level2: "Cari bagian yang belum rapi atau perlu dikelompokkan.", level3: "Tuliskan masalah nyata yang ingin kamu selesaikan.", level4: "Contoh: penataan buku atau ubin." }
          },
          {
            id: "q-gen-2",
            stage: "ask_inquire",
            title: "2. Bertanya & Mencari Informasi",
            question: "Informasi angka dan konsep matematika apa yang kamu butuhkan untuk menganalisis objek ini?",
            inputType: "text",
            conceptTag: "Inkuiri Data",
            scaffolding: { level1: "Hitung jumlah elemen yang tampak.", level2: "Catat panjang, lebar, atau kelompoknya.", level3: "Kaitkan dengan rumus atau konsep materi kelas.", level4: "Tuliskan data yang telah terkumpul." }
          },
          {
            id: "q-gen-3",
            stage: "design_solution",
            title: "3. Merancang Solusi",
            question: "Rancanglah strategi atau rumus yang akan kamu gunakan untuk menyelesaikan tantangan pada objek ini!",
            inputType: "text",
            conceptTag: "Desain Strategi",
            scaffolding: { level1: "Pilih rumus yang tepat.", level2: "Susun langkah hitung teratur.", level3: "Buat rancangan alur kerja.", level4: "Beri nama metode yang kamu pilih." }
          },
          {
            id: "q-gen-4",
            stage: "prototype",
            title: "4. Membuat Produk/Prototipe",
            question: "Buatlah representasi model (tabel, diagram, atau sketsa susunan) untuk menggambarkan solusimu!",
            inputType: "text",
            conceptTag: "Model Matematis",
            scaffolding: { level1: "Gambarkan pola kelompoknya.", level2: "Isi dengan angka hasil rancangan.", level3: "Pastikan model mudah dibaca.", level4: "Beri keterangan pada diagram." }
          },
          {
            id: "q-gen-5",
            stage: "testing",
            title: "5. Menguji",
            question: "Lakukan pengujian hitung pada modelmu: Apakah semua angka pas dan tidak ada kekeliruan?",
            inputType: "text",
            conceptTag: "Uji Coba",
            scaffolding: { level1: "Hitung ulang dengan cara berbeda.", level2: "Periksa sisa pembagian atau perkalian.", level3: "Bandingkan dengan data awal.", level4: "Konfirmasi keakuratan hasilnya." }
          },
          {
            id: "q-gen-6",
            stage: "data_analysis",
            title: "6. Menganalisis Data",
            question: "Tuliskan data hasil hitungan dan kesimpulan numerik yang kamu dapatkan!",
            inputType: "text",
            conceptTag: "Analisis Data",
            scaffolding: { level1: "Tunjukkan angka akhir yang diperoleh.", level2: "Jelaskan arti dari angka tersebut.", level3: "Bandingkan dengan estimasi awal.", level4: "Tuliskan bukti validitasnya." }
          },
          {
            id: "q-gen-7",
            stage: "improvement",
            title: "7. Memperbaiki",
            question: "Bagaimana kamu bisa membuat perhitungan atau penataan ini menjadi lebih cepat dan efisien?",
            inputType: "text",
            conceptTag: "Iterasi Optimasi",
            scaffolding: { level1: "Cari cara yang lebih praktis.", level2: "Gunakan trik matematika atau pembulatan.", level3: "Tuliskan langkah penyempurnaannya.", level4: "Bandingkan efisiensi sebelum dan sesudah." }
          },
          {
            id: "q-gen-8",
            stage: "communication",
            title: "8. Mengomunikasikan Hasil",
            question: "Apa kesimpulan utama yang siap kamu sampaikan saat presentasi di depan kelas?",
            inputType: "text",
            conceptTag: "Komunikasi Temuan",
            scaffolding: { level1: "Rangkum dalam 2 kalimat jelas.", level2: "Sampaikan manfaat konsep ini di dunia nyata.", level3: "Tutup dengan percaya diri.", level4: "Ucapkan salam penutup yang santun." }
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
          stage: "real_problem",
          title: "1. Masalah Nyata",
          question: "Lapangan sekolah sering terasa panas saat siang hari, namun area di bawah pohon ketapang tetap sejuk dan asri. Apa masalah lingkungan yang perlu kita selidiki?",
          inputType: "text",
          conceptTag: "Masalah Ekosistem Mikro",
          scaffolding: { level1: "Amati perbedaan suhu di tempat terbuka dan di bawah pohon.", level2: "Pohon memberikan naungan dan menghasilkan oksigen.", level3: "Rumuskan masalah: interaksi komponen biotik & abiotik dalam menjaga kesejukan.", level4: "Bayangkan bagaimana jika sekolah tidak punya pohon sama sekali." }
        },
        {
          id: "q-ipas-2",
          stage: "ask_inquire",
          title: "2. Bertanya & Mencari Informasi",
          question: "Pertanyaan inkuiri apa yang kamu ajukan tentang interaksi biotik-abiotik dan apa saja yang dibutuhkan pohon untuk tetap subur?",
          inputType: "text",
          conceptTag: "Inkuiri Sains",
          scaffolding: { level1: "Identifikasi komponen biotik (pohon, burung, semut) dan abiotik (sinar matahari, air, tanah).", level2: "Bagaimana proses fotosintesis mengubah cahaya menjadi energi dan oksigen?", level3: "Kumpulkan data kebutuhan air dan ruang tumbuh akar.", level4: "Tuliskan konsep sains penunjang." }
        },
        {
          id: "q-ipas-3",
          stage: "design_solution",
          title: "3. Merancang Solusi",
          question: "Rancanglah solusi rekayasa lingkungan hijau (misal zona biopori atau model taman sekolah) untuk menjaga kelembapan tanah di sekitar pohon!",
          inputType: "text",
          conceptTag: "Desain Rekayasa Lingkungan",
          scaffolding: { level1: "Rancang lubang biopori atau sistem penyiraman air hujan.", level2: "Tentukan lokasi lubang di sekeliling tajuk pohon.", level3: "Rencanakan pemanfaatan sampah daun gugur sebagai kompos.", level4: "Buat sketsa tata letak zona resapan." }
        },
        {
          id: "q-ipas-4",
          stage: "prototype",
          title: "4. Membuat Produk/Prototipe",
          question: "Buatlah model kerja / miniatur prototipe sistem biopori dan penyiram alami sederhana!",
          inputType: "text",
          conceptTag: "Prototipe Alat/Model",
          scaffolding: { level1: "Gunakan pipa berlubang atau botol daur ulang sebagai model biopori.", level2: "Masukkan dedaunan kering sebagai filter organik.", level3: "Susun langkah pembuatan model.", level4: "Jelaskan fungsi tiap bagian model." }
        },
        {
          id: "q-ipas-5",
          stage: "testing",
          title: "5. Menguji",
          question: "Ujilah prototipe resapan airmu! Tuangkan air dan amati seberapa cepat air terserap ke dalam tanah dibandingkan tanah tanpa biopori.",
          inputType: "text",
          conceptTag: "Uji Coba Laju Resapan",
          scaffolding: { level1: "Gunakan stopwatch untuk mengukur waktu penyerapan air.", level2: "Bandingkan waktu: tanah biasa (lambat) vs tanah berbiopori (cepat).", level3: "Catat apakah ada air yang menggenang.", level4: "Uji coba membuktikan efektivitas resapan." }
        },
        {
          id: "q-ipas-6",
          stage: "data_analysis",
          title: "6. Menganalisis Data",
          question: "Analisis data uji coba: Berapa persen waktu serap lebih cepat dan bagaimana dampaknya bagi kesehatan akar pohon?",
          inputType: "text",
          conceptTag: "Analisis Data Lingkungan",
          scaffolding: { level1: "Tuliskan perbandingan angka waktu serap (misal 30 detik vs 2 menit).", level2: "Jelaskan bahwa air yang cepat terserap mencegah pembusukan akar dan menyuburkan tanah.", level3: "Kaitkan data dengan kelembapan tanah.", level4: "Data membuktikan pohon mendapat cukup air dan nutrisi." }
        },
        {
          id: "q-ipas-7",
          stage: "improvement",
          title: "7. Memperbaiki",
          question: "Apa penyempurnaan yang bisa ditambahkan pada sistem prototipe agar tahan lama dan tidak tersumbat lumpur?",
          inputType: "text",
          conceptTag: "Iterasi & Modifikasi",
          scaffolding: { level1: "Tambahkan kawat jaring atau kerikil di bagian atas.", level2: "Beri penutup berlubang agar daun besar tidak menyumbat.", level3: "Rencanakan jadwal pembersihan rutin.", level4: "Prototipe menjadi lebih kokoh dan minim perawatan." }
        },
        {
          id: "q-ipas-8",
          stage: "communication",
          title: "8. Mengomunikasikan Hasil",
          question: "Susun kesimpulan dan ajakan menjaga ekosistem pohon sekolah yang siap kamu presentasikan ke teman-teman!",
          inputType: "text",
          conceptTag: "Komunikasi Proyek STEM",
          scaffolding: { level1: "Sampaikan peran vital pohon bagi iklim mikro sekolah.", level2: "Ajak teman-teman mempraktikkan pembuatan biopori sederhana.", level3: "Tutup dengan komitmen pelestarian lingkungan.", level4: "Siapkan pesan presentasi yang inspiratif." }
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
          stage: "real_problem",
          title: "1. Masalah Nyata",
          question: "Banyak murid yang masih keliru memasukkan sampah plastik ke tempat sampah organik karena label kurang mencolok atau teks deskripsi belum jelas.",
          inputType: "text",
          conceptTag: "Identifikasi Masalah Literasi & Lingkungan",
          scaffolding: { level1: "Amati kondisi tempat sampah di foto.", level2: "Apa yang membuat orang sering salah membuang sampah?", level3: "Rumuskan masalah: perlunya panduan visual dan deskripsi yang tepat.", level4: "Bayangkan kamu ingin membantu adik kelas agar tidak salah pilah." }
        },
        {
          id: "q-indo-2",
          stage: "ask_inquire",
          title: "2. Bertanya & Mencari Informasi",
          question: "Informasi apa yang dibutuhkan tentang jenis sampah dan kata deskripsi apa yang paling tepat untuk membedakannya?",
          inputType: "text",
          conceptTag: "Inkuiri Kosakata & Kategori",
          scaffolding: { level1: "Kumpulkan contoh sampah organik (daun, sisa buah) dan anorganik (plastik, botol).", level2: "Pilih kata sifat sensorik: basah, kering, mudah membusuk, tahan air.", level3: "Susun daftar istilah yang mudah dimengerti anak SD.", level4: "Tuliskan kosakata kunci yang ditemukan." }
        },
        {
          id: "q-indo-3",
          stage: "design_solution",
          title: "3. Merancang Solusi",
          question: "Rancanglah sebuah teks deskripsi interaktif dan poster infografis pintar untuk ditempel di dekat tempat sampah!",
          inputType: "text",
          conceptTag: "Desain Media Komunikasi",
          scaffolding: { level1: "Rancang layout 3 kolom sesuai warna tong sampah.", level2: "Buat kalimat deskripsi singkat berima yang mudah diingat.", level3: "Tambahkan ikon visual yang menarik.", level4: "Sketsa rancangan tulisan dan gambarnya." }
        },
        {
          id: "q-indo-4",
          stage: "prototype",
          title: "4. Membuat Produk/Prototipe",
          question: "Tuliskan paragraf teks deskripsi lengkap yang menjadi prototipe label edukasi tempat sampah tersebut!",
          inputType: "text",
          conceptTag: "Pembuatan Prototipe Teks Deskripsi",
          scaffolding: { level1: "Paragraf 1: Pengenalan tempat sampah pilah 3 warna.", level2: "Paragraf 2: Rincian ciri-ciri fisik tong hijau, kuning, dan merah.", level3: "Paragraf 3: Ajakan tertib memilah untuk lingkungan sekolah bersih.", level4: "Gunakan kalimat efektif dan ejaan yang baku." }
        },
        {
          id: "q-indo-5",
          stage: "testing",
          title: "5. Menguji",
          question: "Ujilah prototipe teks deskripsimu kepada 3 teman: Apakah mereka bisa memilah sampah dengan benar setelah membaca teksmu?",
          inputType: "text",
          conceptTag: "Uji Keterbacaan & Pemahaman",
          scaffolding: { level1: "Minta teman membaca teksmu.", level2: "Beri mereka kuis kecil memilah 5 jenis sampah.", level3: "Catat berapa banyak jawaban yang benar.", level4: "Uji coba membuktikan teks deskripsi sangat mudah dipahami." }
        },
        {
          id: "q-indo-6",
          stage: "data_analysis",
          title: "6. Menganalisis Data",
          question: "Analisis hasil uji coba: Berapa persen peningkatan akurasi temanmu dalam memilah sampah setelah membaca teks deskripsimu?",
          inputType: "text",
          conceptTag: "Analisis Data Keterbacaan",
          scaffolding: { level1: "Hitung skor: misal sebelum baca benar 2/5 (40%), sesudah baca benar 5/5 (100%).", level2: "Peningkatan pemahaman sebesar 60%.", level3: "Jelaskan kata mana yang paling membantu pemahaman mereka.", level4: "Data membuktikan kekuatan komunikasi teks yang baik." }
        },
        {
          id: "q-indo-7",
          stage: "improvement",
          title: "7. Memperbaiki",
          question: "Bagian kalimat mana yang masih membingungkan dan bagaimana perbaikan yang kamu lakukan agar lebih efektif?",
          inputType: "text",
          conceptTag: "Revisi & Penyuntingan Teks",
          scaffolding: { level1: "Perbaiki kata yang terlalu panjang atau sulit.", level2: "Ganti dengan kalimat ajakan yang lebih ringkas dan ceria.", level3: "Periksa kembali tanda baca dan huruf kapital.", level4: "Teks hasil revisi menjadi jauh lebih menarik." }
        },
        {
          id: "q-indo-8",
          stage: "communication",
          title: "8. Mengomunikasikan Hasil",
          question: "Bacakan kesimpulan proyek literasi STEM ini dan sampaikan pesan cintamu pada kebersihan sekolah di depan kelas!",
          inputType: "text",
          conceptTag: "Komunikasi Publik",
          scaffolding: { level1: "Sampaikan bagaimana tulisan deskripsi yang baik bisa mengubah perilaku orang.", level2: "Ajak semua teman membiasakan pilah sampah setiap hari.", level3: "Tutup dengan pantun atau slogan kebersihan ceria.", level4: "Siapkan presentasi yang penuh semangat." }
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
