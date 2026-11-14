const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { GoogleGenAI } = require('@google/genai');

const envPath = path.resolve(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const apiKey = env.match(/GEMINI_API_KEY=(.+)/)[1].trim();
const ai = new GoogleGenAI({ apiKey });

const ROOT_DIR = 'D:\\DisK\\Academics\\Class-12\\Textbooks';
const MANIFEST_PATH = path.resolve(__dirname, 'textbook-manifest.json');
const MODELS = ['gemini-3-flash-preview', 'gemini-3.5-flash'];
const MAX_SLICE_BYTES = 2.8 * 1024 * 1024; // Keep every inline PDF under 2.8 MB for fast responses

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

async function callGeminiJson(parts, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    for (const model of MODELS) {
      try {
        console.log(`[${label}] Calling ${model} (attempt ${attempt})...`);
        const res = await withTimeout(
          ai.models.generateContent({
            model,
            contents: parts,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
          45000,
          `${label}/${model}`
        );
        return JSON.parse(res.text);
      } catch (err) {
        console.warn(`[${label}] ${model} failed:`, err.status || err.message);
        await sleep(1500 * attempt);
      }
    }
  }
  throw new Error(`Failed Gemini call for ${label}`);
}

function extractTextWithPython(filePath, maxPages = 2) {
  try {
    const py = `
import pypdf, sys, json
r = pypdf.PdfReader(sys.argv[1])
n = len(r.pages)
lim = min(n, int(sys.argv[2]))
txt = "\\n".join((r.pages[i].extract_text() or "") for i in range(lim))
print(json.dumps({"totalPages": n, "text": txt[:2500]}))
`;
    const out = execFileSync('python', ['-c', py, filePath, String(maxPages)], {
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
    });
    return JSON.parse(out.trim());
  } catch {
    return null;
  }
}

/**
 * Extracts chapter titles for split-chapter PDFs, chunking composite PDFs to <= 2.8 MB
 * or using fast local text extraction when clean text exists (English, Physics).
 */
async function extractSplitChapterTitles(subjectName, items, preferText = false) {
  if (preferText) {
    const textEntries = [];
    const needVision = [];
    for (const item of items) {
      const info = extractTextWithPython(item.filePath, 2);
      if (info && info.text && info.text.trim().length > 80) {
        textEntries.push({
          ...item,
          totalPages: info.totalPages,
          sampleText: info.text.slice(0, 700).replace(/\s+/g, ' '),
        });
      } else {
        needVision.push(item);
      }
    }

    const titleByFile = new Map();
    const pagesByFile = new Map();
    if (textEntries.length > 0) {
      const listStr = textEntries
        .map((e) => `File "${e.fileName}": """${e.sampleText}"""`)
        .join('\n\n');
      const result = await callGeminiJson(
        [
          {
            text: `Extract the exact clean chapter/unit title for each "${subjectName}" chapter file from its opening text below.\n${listStr}\n\nReturn strictly valid JSON: {"chapters": [{"fileName": "...", "chapterTitle": "Unit X: Title"}]}`,
          },
        ],
        `${subjectName} Text Titles`
      );
      (result.chapters || []).forEach((c) => titleByFile.set(c.fileName, c.chapterTitle));
      textEntries.forEach((e) => pagesByFile.set(e.fileName, e.totalPages));
    }

    if (needVision.length === 0) {
      return items.map((m) => ({
        name: titleByFile.get(m.fileName) || m.fallbackTitle,
        sourceType: 'chapter-pdf',
        filePath: m.filePath,
        startPage: 1,
        endPage: pagesByFile.get(m.fileName) || 1,
        totalPages: pagesByFile.get(m.fileName) || 1,
      }));
    }
  }

  // Vision-based composite batches kept strictly <= MAX_SLICE_BYTES and <= 8 items per batch
  const batches = [];
  let curComposite = await PDFDocument.create();
  let curMap = [];

  for (const item of items) {
    const bytes = fs.readFileSync(item.filePath);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const count = src.getPageCount();

    // Test adding page 0 to current composite; flush first if oversized
    const testDoc = await PDFDocument.create();
    const [p0] = await testDoc.copyPages(src, [0]);
    testDoc.addPage(p0);
    const singleSize = (await testDoc.save()).length;

    const estCurSize = curMap.reduce((a, b) => a + b.estBytes, 0);
    if (curMap.length > 0 && (estCurSize + singleSize > MAX_SLICE_BYTES || curMap.length >= 8)) {
      batches.push({ doc: curComposite, map: curMap });
      curComposite = await PDFDocument.create();
      curMap = [];
    }

    const [copiedP0] = await curComposite.copyPages(src, [0]);
    const pageNum = curComposite.getPageCount() + 1;
    curComposite.addPage(copiedP0);
    curMap.push({
      ...item,
      totalPages: count,
      compositePage: pageNum,
      estBytes: singleSize,
    });
  }
  if (curMap.length > 0) {
    batches.push({ doc: curComposite, map: curMap });
  }

  const titleByFile = new Map();
  const pagesByFile = new Map();

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const { doc, map } = batches[bIdx];
    const compBytes = Buffer.from(await doc.save());
    console.log(`[${subjectName}] Batch ${bIdx + 1}/${batches.length} PDF size: ${(compBytes.length / 1024 / 1024).toFixed(2)} MB (${doc.getPageCount()} pages)`);

    const mappingDesc = map
      .map((m) => `- File "${m.fileName}" (Chapter ${m.order}): PDF page ${m.compositePage}`)
      .join('\n');

    const prompt = `Inspect the attached PDF pages which show the opening page of ${map.length} chapters for "${subjectName}".
Mapping:
${mappingDesc}

Extract the exact chapter/unit title for each file in its original script (Urdu script for Urdu chapters, English for Math/Physics/English).
Return strictly valid JSON:
{
  "chapters": [
    {
      "fileName": "exact filename",
      "chapterTitle": "clean title, e.g. 'Unit 2: Differentiation' or 'سبق 1: مناقبِ عمر بن عبدالعزیز'"
    }
  ]
}`;

    const result = await callGeminiJson(
      [
        { inlineData: { data: compBytes.toString('base64'), mimeType: 'application/pdf' } },
        { text: prompt },
      ],
      `${subjectName} Titles B${bIdx + 1}`
    );

    (result.chapters || []).forEach((c) => titleByFile.set(c.fileName, c.chapterTitle));
    map.forEach((m) => pagesByFile.set(m.fileName, m.totalPages));
  }

  return items.map((m) => ({
    name: titleByFile.get(m.fileName) || m.fallbackTitle,
    sourceType: 'chapter-pdf',
    filePath: m.filePath,
    startPage: 1,
    endPage: pagesByFile.get(m.fileName) || 1,
    totalPages: pagesByFile.get(m.fileName) || 1,
  }));
}

/**
 * Inspects front pages of a full-book PDF in small <=2.8 MB chunks to extract TOC
 * and accurate PDF page offset.
 */
async function extractFullBookChapters(subjectName, filePath, maxFrontPages = 14) {
  const bytes = fs.readFileSync(filePath);
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const limit = Math.min(maxFrontPages, totalPages);

  // Build chunks of front pages where each chunk stays <= MAX_SLICE_BYTES
  const chunks = [];
  let curDoc = await PDFDocument.create();
  let curStart = 1;
  let curBytes = 0;

  for (let p = 1; p <= limit; p++) {
    const tmp = await PDFDocument.create();
    const [tp] = await tmp.copyPages(srcDoc, [p - 1]);
    tmp.addPage(tp);
    const pSize = (await tmp.save()).length;

    if (curDoc.getPageCount() > 0 && (curBytes + pSize > MAX_SLICE_BYTES || curDoc.getPageCount() >= 6)) {
      chunks.push({ start: curStart, end: p - 1, buffer: Buffer.from(await curDoc.save()) });
      curDoc = await PDFDocument.create();
      curStart = p;
      curBytes = 0;
    }

    const [cp] = await curDoc.copyPages(srcDoc, [p - 1]);
    curDoc.addPage(cp);
    curBytes += pSize;
  }
  if (curDoc.getPageCount() > 0) {
    chunks.push({ start: curStart, end: limit, buffer: Buffer.from(await curDoc.save()) });
  }

  console.log(`[${subjectName}] Front matter (${limit}/${totalPages} pages) split into ${chunks.length} small chunks`);

  const parts = chunks.map((c) => ({
    inlineData: { data: c.buffer.toString('base64'), mimeType: 'application/pdf' },
  }));

  const chunkDesc = chunks.map((c, i) => `Attachment ${i + 1}: PDF pages ${c.start} to ${c.end}`).join(', ');
  const prompt = `You are inspecting the first ${limit} pages of a textbook for "${subjectName}" (total book pages: ${totalPages}).
Attachments in order: ${chunkDesc}.

Tasks:
1. Locate the Table of Contents (Contents / فہرست) across these pages. Extract EVERY chapter/unit/Surah in order with its printed book page number where it starts.
2. Identify the exact 1-indexed PDF page number (between 1 and ${limit}, or null if beyond ${limit}) where Chapter/Unit 1 actually begins its main body content, and what printed book page number is printed on that page (usually 1).

Return strictly valid JSON:
{
  "unit1PdfPage": 8,
  "unit1PrintedPage": 1,
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Chapter 1: ...",
      "printedStartPage": 1
    }
  ]
}`;

  parts.push({ text: prompt });
  const toc = await callGeminiJson(parts, `${subjectName} TOC`);

  const rawChapters = toc.chapters || [];
  let offset = 0;
  if (typeof toc.unit1PdfPage === 'number' && typeof toc.unit1PrintedPage === 'number') {
    offset = toc.unit1PdfPage - toc.unit1PrintedPage;
  } else if (rawChapters.length > 0 && typeof toc.unit1PdfPage === 'number') {
    offset = toc.unit1PdfPage - (rawChapters[0].printedStartPage || 1);
  }
  console.log(`[${subjectName}] Offset=${offset}, chapters=${rawChapters.length}`);

  return rawChapters.map((ch, idx) => {
    const startPage = Math.max(1, Math.min(totalPages, (ch.printedStartPage || 1) + offset));
    const nextCh = rawChapters[idx + 1];
    const endPage = nextCh
      ? Math.max(startPage, Math.min(totalPages, (nextCh.printedStartPage || 1) + offset - 1))
      : totalPages;
    return {
      name: ch.title,
      sourceType: 'full-book-slice',
      filePath,
      startPage,
      endPage,
      totalPages,
    };
  });
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

async function main() {
  const manifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : { generatedAt: new Date().toISOString(), subjects: [] };

  const doneSubjects = new Set(manifest.subjects.map((s) => s.name));

  const addSubject = (obj) => {
    manifest.subjects = manifest.subjects.filter((s) => s.name !== obj.name);
    manifest.subjects.push(obj);
    saveManifest(manifest);
  };

  if (!doneSubjects.has('Rawalpindi Board Mathematics')) {
    const mathItems = [];
    for (let i = 2; i <= 11; i++) {
      const f = `Mathematics-Chapter-${i}.pdf`;
      mathItems.push({
        order: i,
        fileName: f,
        filePath: path.join(ROOT_DIR, 'Mathematics', f),
        fallbackTitle: `Chapter ${i}`,
      });
    }
    const mathChapters = await extractSplitChapterTitles('Rawalpindi Board Mathematics', mathItems, false);
    addSubject({
      name: 'Rawalpindi Board Mathematics',
      existingSubjectId: '22222222-2222-2222-2222-222222222222',
      chapters: mathChapters,
    });
  }

  if (!doneSubjects.has('Physics')) {
    const physicsItems = [];
    for (let i = 1; i <= 9; i++) {
      const f = `Physics-Chapter-${i}.pdf`;
      physicsItems.push({
        order: i,
        fileName: f,
        filePath: path.join(ROOT_DIR, 'Physics', f),
        fallbackTitle: `Chapter ${i}`,
      });
    }
    const physicsChapters = await extractSplitChapterTitles('Physics', physicsItems, true);
    addSubject({ name: 'Physics', chapters: physicsChapters });
  }

  if (!doneSubjects.has('English')) {
    const engItems = [];
    for (let i = 1; i <= 13; i++) {
      const f = `English-Chapter-${i}.pdf`;
      engItems.push({
        order: i,
        fileName: f,
        filePath: path.join(ROOT_DIR, 'English', 'Chapters', f),
        fallbackTitle: `Unit ${i}`,
      });
    }
    const engChapters = await extractSplitChapterTitles('English', engItems, true);
    const idiomsPath = path.join(ROOT_DIR, 'English', 'Idioms', 'Idioms.pdf');
    const idiomsDoc = await PDFDocument.load(fs.readFileSync(idiomsPath), { ignoreEncryption: true });
    engChapters.push({
      name: 'Idioms and Phrases',
      sourceType: 'chapter-pdf',
      filePath: idiomsPath,
      startPage: 1,
      endPage: idiomsDoc.getPageCount(),
      totalPages: idiomsDoc.getPageCount(),
    });
    addSubject({ name: 'English', chapters: engChapters });
  }

  if (!doneSubjects.has('Urdu')) {
    const urduItems = [];
    for (let i = 1; i <= 22; i++) {
      const f = `Urdu-Chapter-${i}.pdf`;
      urduItems.push({
        order: i,
        fileName: f,
        filePath: path.join(ROOT_DIR, 'Urdu', f),
        fallbackTitle: `سبق ${i}`,
      });
    }
    const urduChapters = await extractSplitChapterTitles('Urdu', urduItems, false);
    const seeratPath = path.join(ROOT_DIR, 'Urdu', 'سیرت طیبہ مضمون.pdf');
    const seeratDoc = await PDFDocument.load(fs.readFileSync(seeratPath), { ignoreEncryption: true });
    urduChapters.push({
      name: 'مضمون: سیرتِ طیبہ ﷺ',
      sourceType: 'chapter-pdf',
      filePath: seeratPath,
      startPage: 1,
      endPage: seeratDoc.getPageCount(),
      totalPages: seeratDoc.getPageCount(),
    });
    addSubject({ name: 'Urdu', chapters: urduChapters });
  }

  if (!doneSubjects.has('Computer Science')) {
    const compFullPath = path.join(ROOT_DIR, 'Computer', 'Computer-Full-Textbook.pdf');
    const compCh1Path = path.join(ROOT_DIR, 'Computer', 'Computer-Chapter-1.pdf');
    const compChapters = await extractFullBookChapters('Computer Science', compFullPath, 14);
    if (compChapters.length > 0) {
      const ch1Doc = await PDFDocument.load(fs.readFileSync(compCh1Path), { ignoreEncryption: true });
      compChapters[0].filePath = compCh1Path;
      compChapters[0].sourceType = 'chapter-pdf';
      compChapters[0].startPage = 1;
      compChapters[0].endPage = ch1Doc.getPageCount();
      compChapters[0].totalPages = ch1Doc.getPageCount();
    }
    addSubject({ name: 'Computer Science', chapters: compChapters });
  }

  if (!doneSubjects.has('Chemistry')) {
    const chemPath = path.join(ROOT_DIR, 'chemistry', '10 Chemistry Book FBISE (Study++).pdf');
    const chemChapters = await extractFullBookChapters('Chemistry', chemPath, 14);
    addSubject({ name: 'Chemistry', chapters: chemChapters });
  }

  if (!doneSubjects.has('Pakistan Studies')) {
    const pakPath = path.join(ROOT_DIR, 'PakStudy', 'PakStudy-Full-Textbook.pdf');
    const pakChapters = await extractFullBookChapters('Pakistan Studies', pakPath, 14);
    addSubject({ name: 'Pakistan Studies', chapters: pakChapters });
  }

  if (!doneSubjects.has('Tarjuma-tul-Quran')) {
    const thqPath = path.join(ROOT_DIR, 'THQ', 'THQ-Full-Texrtbook.pdf');
    const thqChapters = await extractFullBookChapters('Tarjuma-tul-Quran', thqPath, 14);
    addSubject({ name: 'Tarjuma-tul-Quran', chapters: thqChapters });
  }

  console.log('\nManifest complete! Summary:');
  let totalCh = 0;
  for (const s of manifest.subjects) {
    console.log(`- ${s.name}: ${s.chapters.length} chapters`);
    totalCh += s.chapters.length;
  }
  console.log(`Total chapters: ${totalCh} (Target MCQs: ${totalCh * 40})`);
}

main().catch((err) => {
  console.error('Manifest build failed:', err);
  process.exit(1);
});
