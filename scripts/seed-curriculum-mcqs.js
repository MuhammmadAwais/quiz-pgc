const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

// 1. Read environment variables
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

// 2. Define Chapters and Curriculum Matrix
const CHAPTER_CONFIGS = [
  {
    board: 'Federal Board',
    subjectName: 'Federal Board Mathematics',
    subjectId: '11111111-1111-1111-1111-111111111111',
    chapterName: 'Chapter 1: Functions and Graphs',
    chapterId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    batches: [
      {
        subtopic: 'Concept of function, relations, domain, range, and natural domains of algebraic and fractional functions',
        focus: 'Rapid mental domain/range determination (e.g. 1/(x-a), sqrt(x-a)), vertical line test, mapping definitions'
      },
      {
        subtopic: 'Classification of functions: Even, Odd, Polynomial, Rational, Explicit, Implicit, and Algebraic vs Transcendental',
        focus: 'Testing symmetry f(-x) = f(x) or -f(x), identifying even/odd nature of polynomial/trig combinations mentally'
      },
      {
        subtopic: 'Injective, Surjective, and Bijective functions, Inverse of a function, and conditions for existence of f^(-1)',
        focus: 'Horizontal line test, domain/range swapping for inverse functions, linear inverse rapid evaluation'
      },
      {
        subtopic: 'Graphs of elementary functions, transformations (shifts, reflections), and graphical symmetries',
        focus: 'Symmetry with respect to y-axis vs origin, behavior of |x|, x^2, x^3, 1/x graphs, periodic properties'
      }
    ]
  },
  {
    board: 'Rawalpindi Board',
    subjectName: 'Rawalpindi Board Mathematics',
    subjectId: '22222222-2222-2222-2222-222222222222',
    chapterName: 'Chapter 1: Functions and Limits',
    chapterId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    batches: [
      {
        subtopic: 'Functions, functional values, notation, piecewise functions, and composite functions f(g(x))',
        focus: 'Evaluating f(g(x)) properties, domain of composite functions, recognizing continuous piecewise joints'
      },
      {
        subtopic: 'Concept of Limits, algebraic limit theorems, direct substitution, and factoring indeterminate forms 0/0',
        focus: 'Mental limits as x approaches a of (x^2 - a^2)/(x - a) = 2a, limit properties of sum, product, and quotients'
      },
      {
        subtopic: 'Standard Fundamental Limit Theorems: lim (x->0) sin(x)/x = 1, lim (x->inf) (1 + 1/x)^x = e, and exponential limits',
        focus: 'Recognizing standard limit forms, scaling coefficients in sin(ax)/bx, (1 + kx)^(1/x) = e^k'
      },
      {
        subtopic: 'Continuity of a function at a point, Left-hand and Right-hand limits, and types of discontinuity',
        focus: 'Condition for continuity f(c) = lim f(x), removable vs essential discontinuities, graphical limit existence'
      }
    ]
  },
  {
    board: 'Federal Board',
    subjectName: 'Federal Board Biology',
    subjectId: '33333333-3333-3333-3333-333333333333',
    chapterName: 'Chapter 1: Digestive System of Man',
    chapterId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    batches: [
      {
        subtopic: 'Oral cavity, teeth structure/types, tongue, salivary glands (parotid, submandibular, sublingual), and salivary amylase',
        focus: 'Composition and pH of saliva, starch breakdown into maltose, bolus formation, swallowing reflex phases'
      },
      {
        subtopic: 'Pharynx, Esophagus, Peristalsis, Stomach anatomy, gastric glands (parietal, chief, mucous cells), and Gastrin',
        focus: 'Oxyntic/parietal cell secretions (HCl, Castle intrinsic factor), chief cells (pepsinogen), nervous/gastrin control'
      },
      {
        subtopic: 'Small intestine (Duodenum, Jejunum, Ileum), Secretin and CCK hormones, Bile composition and functions, Pancreatic juice',
        focus: 'Emulsification of fats by bile salts (no enzymes in bile!), trypsinogen activation by enterokinase, pancreatic lipase'
      },
      {
        subtopic: 'Absorption of nutrients, Villi and microvilli structure, Lacteal lymphatic absorption, Hepatic portal vein, Large intestine and Defecation',
        focus: 'Chylomicron absorption into lacteals, storage role of liver, water/electrolyte reabsorption in colon, defecation reflex'
      }
    ]
  },
  {
    board: 'Rawalpindi Board',
    subjectName: 'Rawalpindi Board Biology',
    subjectId: '44444444-4444-4444-4444-444444444444',
    chapterName: 'Chapter 1: Homeostasis (Thermoregulation & Osmoregulation)',
    chapterId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    batches: [
      {
        subtopic: 'Homeostasis principles, Feedback mechanisms, and Osmoregulation in plants (Hydrophytes, Mesophytes, Xerophytes)',
        focus: 'Stomatal adaptations, cuticle thickness, extensive roots vs sunken stomata, turgor pressure regulation'
      },
      {
        subtopic: 'Osmoregulation in aquatic and terrestrial animals, and nitrogenous excretion (Ammonia, Urea, Uric acid)',
        focus: 'Hypotonic vs hypertonic aquatic balance, trimethylamine oxide in marine fishes, toxicity and water cost of urea vs uric acid'
      },
      {
        subtopic: 'Human Urinary System, Nephron anatomy, Ultrafiltration in Glomerulus, Counter-current multiplier, and Hormonal regulation',
        focus: 'Loop of Henle medullary gradient, ADH (vasopressin) water permeability, Aldosterone sodium absorption'
      },
      {
        subtopic: 'Thermoregulation in animals, Poikilotherms/Homeotherms, Ectotherms/Endotherms, Thermogenesis, and Hypothalamic thermostat',
        focus: 'Vasodilation vs vasoconstriction, shivering vs non-shivering brown fat thermogenesis, pyrexia/pyrogens and fever set point'
      }
    ]
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateBatchWithRetry(chapterConfig, batch, batchIndex, targetCount = 26) {
  const systemInstruction = `You are an elite academic quiz author for collegiate science and mathematics competitions.
Generate exactly ${targetCount} competitive MCQs targeting:
Board: ${chapterConfig.board}
Subject: ${chapterConfig.subjectName}
Chapter: ${chapterConfig.chapterName}
Subtopic: ${batch.subtopic}
Focus: ${batch.focus}

CRITICAL TOURNAMENT INVARIANTS:
1. STRICTLY NO CALCULATOR, NO PEN, NO PAPER:
   - Every MCQ must be answerable purely through theoretical concept recognition, mental definition recall, or property identification in 15-20 seconds.
   - Absolutely NO tedious arithmetic or long derivations.
2. STRUCTURE:
   - Exactly 4 plausible, high-quality, mutually exclusive options per question.
   - Exactly 1 unambiguously correct option (correct_index must be 0, 1, 2, or 3).
   - Distractors must represent genuine common conceptual misconceptions.
3. DIFFICULTY:
   - Balance across EASY (foundational definitions), MEDIUM (conceptual deduction), and HARD (nuanced property / counter-example).
4. OUTPUT FORMAT:
   - Return STRICTLY valid JSON with no markdown formatting outside the JSON:
   {
     "questions": [
       {
         "text": "Question stem here...",
         "options": ["Option A", "Option B", "Option C", "Option D"],
         "correct_index": 0
       }
     ]
   }`;

  const candidateModels = ['gemini-3-flash-preview', 'gemini-3.5-flash'];

  for (let attempt = 1; attempt <= 4; attempt++) {
    for (const model of candidateModels) {
      try {
        console.log(`[Batch ${batchIndex + 1}/4] Requesting ${targetCount} MCQs via ${model} (Attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: `Please generate ${targetCount} MCQs for ${chapterConfig.chapterName} - ${batch.subtopic}. Follow all system directives.`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.45,
          },
        });

        const raw = response.text || '';
        const parsed = JSON.parse(raw);

        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length >= 20) {
          // Validate questions
          const valid = parsed.questions.filter((q) => {
            return (
              q.text &&
              typeof q.text === 'string' &&
              q.text.trim().length > 10 &&
              Array.isArray(q.options) &&
              q.options.length === 4 &&
              q.options.every((o) => typeof o === 'string' && o.trim().length > 0) &&
              typeof q.correct_index === 'number' &&
              q.correct_index >= 0 &&
              q.correct_index <= 3
            );
          });

          if (valid.length >= 20) {
            console.log(`[Batch ${batchIndex + 1}/4] Successfully obtained ${valid.length} valid MCQs!`);
            return valid;
          }
        }
      } catch (err) {
        console.warn(`[Batch ${batchIndex + 1}/4] ${model} attempt failed:`, err.status || err.message);
        await sleep(2000 * attempt);
      }
    }
  }

  throw new Error(`Failed to generate batch ${batchIndex + 1} after multiple attempts.`);
}

async function main() {
  console.log('Authenticating with Supabase admin account...');
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@pgc.edu',
    password: 'PGCarena2026!'
  });

  if (authErr) {
    throw new Error('Supabase admin login failed: ' + authErr.message);
  }
  console.log('Authenticated successfully!');

  let totalInsertedAll = 0;

  for (const chapter of CHAPTER_CONFIGS) {
    console.log('\n======================================================');
    console.log(`Processing: ${chapter.board} | ${chapter.subjectName}`);
    console.log(`Chapter: ${chapter.chapterName}`);
    console.log('======================================================');

    const chapterQuestions = [];

    for (let i = 0; i < chapter.batches.length; i++) {
      const batch = chapter.batches[i];
      console.log(`\nSubtopic ${i + 1}/${chapter.batches.length}: ${batch.subtopic}`);
      const questions = await generateBatchWithRetry(chapter, batch, i, 27); // Aim for 27 per batch -> ~108 total
      chapterQuestions.push(...questions);
      await sleep(1500); // Polite pause
    }

    console.log(`\nTotal generated for ${chapter.chapterName}: ${chapterQuestions.length} MCQs`);

    // Prepare rows for Supabase insertion
    const rows = chapterQuestions.map((q) => ({
      subject_id: chapter.subjectId,
      chapter_id: chapter.chapterId,
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()),
      correct_index: q.correct_index,
    }));

    // Insert in chunks of 50
    console.log(`Inserting ${rows.length} MCQs into Supabase 'questions' table...`);
    for (let c = 0; c < rows.length; c += 50) {
      const chunk = rows.slice(c, c + 50);
      const { error: insErr } = await supabase.from('questions').insert(chunk);
      if (insErr) {
        console.error('Error inserting chunk:', insErr.message);
        throw insErr;
      }
    }

    console.log(`Successfully committed ${rows.length} MCQs for ${chapter.chapterName}!`);
    totalInsertedAll += rows.length;
  }

  console.log('\n======================================================');
  console.log(`ALL CHAPTER SEEDING COMPLETE! Total MCQs inserted: ${totalInsertedAll}`);
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
