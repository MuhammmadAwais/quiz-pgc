const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { GoogleGenAI, Type } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
function getEnv(key) {
  const m = envContent.match(new RegExp(key + '=(.+)'));
  return m ? m[1].trim() : '';
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const geminiApiKey = getEnv('GEMINI_API_KEY');

const ai = new GoogleGenAI({ apiKey: geminiApiKey });
const supabase = createClient(supabaseUrl, supabaseKey);

const MANIFEST_PATH = path.resolve(__dirname, 'textbook-manifest.json');
const MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];
const TARGET_MCQS_PER_CHAPTER = 40;
const MAX_SLICE_BYTES = 4.0 * 1024 * 1024; // <= 4 MB keeps PDF uploads & decode fast
const MAX_SLICE_PAGES = 14;
const CONCURRENCY = 4;

const exhaustedModels = new Set();
const modelCooldownUntil = new Map();
let rrIndex = 0;

const MCQ_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correct_index: { type: Type.INTEGER },
        },
        required: ['text', 'options', 'correct_index'],
      },
    },
  },
  required: ['questions'],
};

async function pickHealthyModel() {
  while (true) {
    const now = Date.now();
    const alive = MODELS.filter((m) => !exhaustedModels.has(m));
    if (alive.length === 0) {
      throw new Error('All Gemini models exhausted daily quota.');
    }
    for (let step = 0; step < MODELS.length; step++) {
      const m = MODELS[(rrIndex + step) % MODELS.length];
      if (exhaustedModels.has(m)) continue;
      if ((modelCooldownUntil.get(m) || 0) <= now) {
        rrIndex = (rrIndex + step + 1) % MODELS.length;
        return m;
      }
    }
    const soonest = Math.min(...alive.map((m) => modelCooldownUntil.get(m) || now + 5000));
    const waitMs = Math.max(1500, Math.min(30000, soonest - now + 500));
    await sleep(waitMs);
  }
}

function handleModelError(model, err) {
  const msg = String(err?.message || err || '');
  if (
    /GenerateRequestsPerDay|PerDayPerProject|limit:\s*0|billing details/i.test(msg) &&
    !/PerMinute/i.test(msg)
  ) {
    console.warn(`  [QUOTA EXHAUSTED] Disabling ${model} for this run.`);
    exhaustedModels.add(model);
    return;
  }
  if (/429|RESOURCE_EXHAUSTED|PerMinute/i.test(msg)) {
    modelCooldownUntil.set(model, Date.now() + 62000);
    return;
  }
  if (/503|UNAVAILABLE|overloaded|high demand|Timeout/i.test(msg)) {
    modelCooldownUntil.set(model, Date.now() + 35000);
    return;
  }
  modelCooldownUntil.set(model, Date.now() + 10000);
}

function parseQuestionsJson(raw) {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.questions)) return parsed.questions;
  } catch {
    // Fallback: extract complete question objects if output truncated mid-array
    const recovered = [];
    const objRegex = /\{\s*"text"\s*:\s*"(?:\\.|[^"\\])*"\s*,\s*"options"\s*:\s*\[[^\]]*\]\s*,\s*"correct_index"\s*:\s*\d+\s*\}/g;
    for (const match of cleaned.matchAll(objRegex)) {
      try {
        recovered.push(JSON.parse(match[0]));
      } catch {}
    }
    return recovered;
  }
  return [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms (${label})`)), ms)
    ),
  ]);
}

/**
 * Mirrors lib/utils/linter.ts checks so seeded MCQs pass Studio & UI rendering cleanly.
 */
function lintQuestion(prompt, options, correctIndex) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) return false;
  if (!Array.isArray(options) || options.length !== 4) return false;
  if (options.some((o) => typeof o !== 'string' || !o.trim())) return false;

  const normalized = options.map((o) => o.trim().toLowerCase());
  if (new Set(normalized).size !== 4) return false;

  const trivialPatterns = [/all of the above/i, /none of the above/i, /both [a-d] and [a-d]/i, /تمام درست/, /ان میں سے کوئی نہیں/];
  if (options.some((o) => trivialPatterns.some((p) => p.test(o)))) return false;

  const lengths = options.map((o) => o.trim().length);
  const maxLen = Math.max(...lengths);
  const minLen = Math.min(...lengths);
  if (maxLen > 40 && minLen > 0 && maxLen > minLen * 4) return false;

  if (typeof correctIndex !== 'number' || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return false;
  }

  const checkDelimiters = (text) => {
    const singleDollar = text.match(/(?<!\$)\$(?!\$)/g);
    if (singleDollar && singleDollar.length % 2 !== 0) return false;
    const doubleDollar = text.match(/\$\$/g);
    if (doubleDollar && doubleDollar.length % 2 !== 0) return false;
    const openBraces = (text.match(/\{/g) || []).length;
    const closeBraces = (text.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) return false;
    return true;
  };

  if (!checkDelimiters(prompt)) return false;
  if (options.some((o) => !checkDelimiters(o))) return false;

  return true;
}

/**
 * Shuffles options per question while preserving the correct answer index,
 * guaranteeing uniform distribution across A/B/C/D even if model has positional bias.
 */
function shuffleOptions(q) {
  const tagged = q.options.map((text, idx) => ({
    text: text.trim(),
    isCorrect: idx === q.correct_index,
  }));
  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
  }
  return {
    text: q.text.trim(),
    options: tagged.map((t) => t.text),
    correct_index: tagged.findIndex((t) => t.isCorrect),
  };
}

// Cache loaded PDFDocument instances by filePath so full-books are parsed only once
const pdfDocCache = new Map();
async function getPdfDoc(filePath) {
  if (!pdfDocCache.has(filePath)) {
    const bytes = fs.readFileSync(filePath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    pdfDocCache.set(filePath, doc);
  }
  return pdfDocCache.get(filePath);
}

/**
 * Builds PDF byte slices covering [startPage..endPage] (1-indexed), splitting further
 * automatically if page count > 18 or raw bytes exceed MAX_SLICE_BYTES.
 */
async function buildChapterSlices(filePath, startPage, endPage) {
  const srcDoc = await getPdfDoc(filePath);
  const total = srcDoc.getPageCount();
  const s = Math.max(1, Math.min(total, startPage));
  const e = Math.max(s, Math.min(total, endPage));

  // Aim for at least 2 slices when chapter has >= 4 pages for full-chapter coverage
  const span = e - s + 1;
  const initialChunks = [];
  if (span >= 4) {
    const mid = s + Math.floor(span / 2) - 1;
    initialChunks.push([s, mid], [mid + 1, e]);
  } else {
    initialChunks.push([s, e]);
  }

  // Subdivide any chunk that is too many pages (> 10) or too large (> MAX_SLICE_BYTES)
  const finalSlices = [];
  const queue = [...initialChunks];

  while (queue.length > 0) {
    const [cs, ce] = queue.shift();
    const count = ce - cs + 1;
    if (count > MAX_SLICE_PAGES) {
      const m = cs + Math.floor(count / 2) - 1;
      queue.unshift([m + 1, ce], [cs, m]);
      continue;
    }

    const outDoc = await PDFDocument.create();
    const indices = Array.from({ length: count }, (_, idx) => cs - 1 + idx);
    const copied = await outDoc.copyPages(srcDoc, indices);
    copied.forEach((p) => outDoc.addPage(p));
    const buf = Buffer.from(await outDoc.save());

    if (buf.length > MAX_SLICE_BYTES && count > 1) {
      const m = cs + Math.floor(count / 2) - 1;
      queue.unshift([m + 1, ce], [cs, m]);
    } else {
      finalSlices.push({ filePath, startPage: cs, endPage: ce, buffer: buf });
    }
  }

  return finalSlices;
}

function getLanguageRule(subjectName) {
  if (subjectName === 'Urdu' || subjectName === 'Pakistan Studies') {
    return 'LANGUAGE RULE: Write EVERY question stem and all 4 options in clean, natural Urdu script (اردو) matching the Urdu textbook (keep historical dates, constitutional articles, or literary terms clear and accurate).';
  }
  if (subjectName === 'Tarjuma-tul-Quran') {
    return 'LANGUAGE RULE: Write questions and options in clean Urdu script (اردو), keeping Quranic Surah/verse names and Arabic terms in clear Arabic/Urdu script as shown in the textbook.';
  }
  return 'LANGUAGE RULE: Write questions and options in clear academic English matching the textbook.';
}

async function generateSliceMcqs(subjectName, chapterName, slice, countNeeded, existingStems = []) {
  const avoidNote =
    existingStems.length > 0
      ? `\nAvoid duplicating these already-generated questions:\n- ${existingStems.slice(-18).join('\n- ')}`
      : '';

  const extraChapterRule = chapterName.toLowerCase().includes('idiom')
    ? '\n- SPECIAL IDIOMS RULE: This file contains ~20 idioms. Generate diverse MCQs covering (a) exact meaning/definition, and (b) fill-in-the-blank / correct contextual sentence usage so every question is unique.'
    : '';

  const systemInstruction = `You are a senior collegiate quiz master authoring MCQs from the attached textbook pages for "${subjectName}" — "${chapterName}".

CRITICAL RULES:
1. GROUNDED IN TEXTBOOK: Base every MCQ strictly on concepts, definitions, facts, theorems, formulas, rules, syntax, or examples present in the attached pages.
2. STRICTLY NO CALCULATOR / NO PEN / NO PAPER:
   - Questions MUST be answerable mentally on stage in 15-30 seconds!
   - NEVER require multi-step arithmetic, messy fractions/decimals, logarithmic tables, long derivations, or tedious calculations.
   - For Math/Physics/Chemistry/Computer: focus on conceptual properties, definitions, standard theorems, laws, units/dimensions, formula recognition, special-case mental results (e.g., value at 0 or 90 deg, identity check, syntax/output rules), and theoretical relationships.
3. RANDOM / MIXED DIFFICULTY:
   - Mix EASY (~30% foundational recall), MEDIUM (~45% conceptual understanding), and HARD (~25% nuanced distinctions or edge-case properties).
4. FORMAT & QUALITY:
   - Exactly 4 distinct, plausible, concise options per question (avoid "All of the above" / "None of the above", keep option lengths balanced, max option length <= 4x min option length).
   - NEVER use $ for currency (write USD or Rs.). Use matching single $...$ delimiters ONLY when LaTeX math symbols/equations are truly needed, with balanced { } braces.${extraChapterRule}
   - ${getLanguageRule(subjectName)}`;

  const prompt = `Inspect the attached pages (pages ${slice.startPage}-${slice.endPage}) of "${chapterName}" (${subjectName}) and generate ${countNeeded} distinct, no-calculator conceptual MCQs of mixed difficulty.${avoidNote}`;

  // Prepare payload once outside retry loop
  let contentParts = null;
  if (subjectName === 'English' || chapterName.includes('سیرت')) {
    const py = `
import pypdf, sys
r = pypdf.PdfReader(sys.argv[1])
s, e = int(sys.argv[2]), int(sys.argv[3])
print("\\n---\\n".join((r.pages[i].extract_text() or "") for i in range(s-1, min(e, len(r.pages)))))
`;
    let extracted = '';
    try {
      extracted = execFileSync('python', ['-c', py, slice.filePath, String(slice.startPage), String(slice.endPage)], { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }).trim();
    } catch {}
    if (extracted.length >= 250) {
      contentParts = [{ text: `${prompt}\n\nTEXTBOOK EXCERPT:\n"""\n${extracted.slice(0, 28000)}\n"""` }];
    }
  }
  if (!contentParts) {
    contentParts = [
      { inlineData: { data: slice.buffer.toString('base64'), mimeType: 'application/pdf' } },
      { text: prompt },
    ];
  }

  for (let attempt = 1; attempt <= 6; attempt++) {
    const model = await pickHealthyModel();
    try {
      const res = await withTimeout(
        ai.models.generateContent({
          model,
          contents: contentParts,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: MCQ_RESPONSE_SCHEMA,
            temperature: 0.4,
          },
        }),
        75000,
        `${subjectName}/${chapterName}/${slice.startPage}-${slice.endPage}/${model}`
      );

      const list = parseQuestionsJson(res.text);
      const clean = list
        .filter((q) => lintQuestion(q.text, q.options, q.correct_index))
        .map(shuffleOptions);

      if (clean.length > 0) {
        return clean;
      }
      console.warn(`  [${subjectName} | ${chapterName}] slice ${slice.startPage}-${slice.endPage} ${model} yielded 0 valid linted MCQs (raw=${list.length}), retrying...`);
    } catch (err) {
      handleModelError(model, err);
      const code = err.status || String(err.message || err).slice(0, 140);
      console.warn(`  [${subjectName} | ${chapterName}] slice ${slice.startPage}-${slice.endPage} ${model} attempt ${attempt} err: ${code}`);
      await sleep(1500 * attempt);
    }
  }
  return [];
}

async function ensureSubjectAndChapters(manifest) {
  const { data: existingSubjects, error: subErr } = await supabase.from('subjects').select('id, name');
  if (subErr) throw subErr;

  const subjectByName = new Map(existingSubjects.map((s) => [s.name.trim().toLowerCase(), s]));
  const subjectById = new Map(existingSubjects.map((s) => [s.id, s]));

  const workItems = [];

  for (const subSpec of manifest.subjects) {
    let subjectId = subSpec.existingSubjectId;
    if (subjectId && !subjectById.has(subjectId)) {
      subjectId = null;
    }
    if (!subjectId) {
      const found = subjectByName.get(subSpec.name.trim().toLowerCase());
      if (found) {
        subjectId = found.id;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('subjects')
          .insert({ name: subSpec.name.trim() })
          .select('id, name')
          .single();
        if (insErr) throw insErr;
        subjectId = inserted.id;
        subjectByName.set(inserted.name.toLowerCase(), inserted);
        console.log(`Created subject: ${inserted.name} (${inserted.id})`);
      }
    }

    const { data: existingChapters, error: chErr } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', subjectId);
    if (chErr) throw chErr;

    const chapterByName = new Map(existingChapters.map((c) => [c.name.trim().toLowerCase(), c]));

    for (const chSpec of subSpec.chapters) {
      const chName = chSpec.name.trim();
      let chapterId;
      const existingCh = chapterByName.get(chName.toLowerCase());
      if (existingCh) {
        chapterId = existingCh.id;
      } else {
        const { data: insertedCh, error: insChErr } = await supabase
          .from('chapters')
          .insert({ subject_id: subjectId, name: chName })
          .select('id, name')
          .single();
        if (insChErr) throw insChErr;
        chapterId = insertedCh.id;
        chapterByName.set(chName.toLowerCase(), insertedCh);
      }

      workItems.push({
        subjectId,
        subjectName: subSpec.name,
        chapterId,
        chapterName: chName,
        filePath: chSpec.filePath,
        startPage: chSpec.startPage,
        endPage: chSpec.endPage,
      });
    }
  }

  return workItems;
}

async function processChapter(item, idx, total) {
  // Check existing question count in DB for idempotency
  const { data: existingRows, error: cntErr } = await supabase
    .from('questions')
    .select('text')
    .eq('chapter_id', item.chapterId);
  if (cntErr) throw cntErr;

  const existingCount = existingRows ? existingRows.length : 0;
  if (existingCount >= TARGET_MCQS_PER_CHAPTER) {
    console.log(`[${idx}/${total}] SKIP (${existingCount}/${TARGET_MCQS_PER_CHAPTER}): ${item.subjectName} -> ${item.chapterName}`);
    return 0;
  }

  let needed = TARGET_MCQS_PER_CHAPTER - existingCount;
  const existingStems = (existingRows || []).map((r) => r.text);
  const seenNormalized = new Set(existingStems.map((t) => t.trim().toLowerCase()));

  const slices = await buildChapterSlices(item.filePath, item.startPage, item.endPage);
  const collected = [];

  // Distribute target evenly across slices, asking for a small buffer (+3) to absorb linter/dedup drops
  const basePerSlice = Math.ceil((needed + 6) / slices.length);

  for (const slice of slices) {
    if (collected.length >= needed) break;
    const reqCount = Math.min(25, Math.max(8, basePerSlice));
    const batch = await generateSliceMcqs(
      item.subjectName,
      item.chapterName,
      slice,
      reqCount,
      [...existingStems, ...collected.map((q) => q.text)]
    );

    for (const q of batch) {
      const key = q.text.trim().toLowerCase();
      if (!seenNormalized.has(key)) {
        seenNormalized.add(key);
        collected.push(q);
      }
    }
  }

  // Top-up pass if any chapter came up slightly short due to linting/dedup
  let topUpTry = 0;
  while (collected.length < needed && topUpTry < 4 && slices.length > 0) {
    const slice = slices[topUpTry % slices.length];
    const deficit = needed - collected.length + 5;
    const extra = await generateSliceMcqs(
      item.subjectName,
      item.chapterName,
      slice,
      Math.min(22, Math.max(8, deficit)),
      [...existingStems, ...collected.map((q) => q.text)]
    );
    for (const q of extra) {
      const key = q.text.trim().toLowerCase();
      if (!seenNormalized.has(key)) {
        seenNormalized.add(key);
        collected.push(q);
      }
    }
    topUpTry++;
  }

  const finalBatch = collected.slice(0, needed);
  if (finalBatch.length === 0) {
    console.error(`[${idx}/${total}] FAILED to generate questions for ${item.subjectName} -> ${item.chapterName}`);
    return 0;
  }

  const rowsToInsert = finalBatch.map((q) => ({
    subject_id: item.subjectId,
    chapter_id: item.chapterId,
    text: q.text,
    options: q.options,
    correct_index: q.correct_index,
  }));

  const { error: insErr } = await supabase.from('questions').insert(rowsToInsert);
  if (insErr) {
    console.error(`[${idx}/${total}] DB insert error on ${item.chapterName}:`, insErr.message);
    throw insErr;
  }

  console.log(`[${idx}/${total}] SEEDED +${rowsToInsert.length} (now ${existingCount + rowsToInsert.length}): ${item.subjectName} -> ${item.chapterName}`);
  return rowsToInsert.length;
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found at ${MANIFEST_PATH}. Run build-textbook-manifest.js first.`);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  console.log('Authenticating with Supabase admin account...');
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@pgc.edu',
    password: 'Admin@PGC2026!',
  });
  if (authErr) throw authErr;
  console.log('Authenticated!');

  const workItems = await ensureSubjectAndChapters(manifest);
  console.log(`Prepared ${workItems.length} total chapters across ${manifest.subjects.length} subjects.`);

  let nextIdx = 0;
  let totalInserted = 0;

  async function worker() {
    while (true) {
      const i = nextIdx++;
      if (i >= workItems.length) break;
      try {
        const added = await processChapter(workItems[i], i + 1, workItems.length);
        totalInserted += added;
      } catch (err) {
        console.error(`Worker error on chapter ${workItems[i].chapterName}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`\n=== SEEDING RUN COMPLETE: Inserted ${totalInserted} new MCQs across ${workItems.length} chapters ===`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

