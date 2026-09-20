import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { GoogleGenAI } from '@google/genai';
import { getB2Client, getB2BucketName } from '@/lib/b2/client';

export const maxDuration = 60; // Up to 60s for PDF slicing + generation

const requestSchema = z.object({
  pdfUrl: z.string().nullable().optional(),
  startPage: z.number().int().min(1).nullable().optional(),
  endPage: z.number().int().min(1).nullable().optional(),
  count: z.number().int().min(1).max(25).default(10),
  difficultyBias: z.enum(['BALANCED', 'EASY', 'MEDIUM', 'HARD']).default('BALANCED'),
  cognitiveBias: z.enum(['MIXED', 'KNOWLEDGE', 'CONCEPTUAL', 'APPLICATION']).default('MIXED'),
  topicPrompt: z.string().nullable().optional(),
  targetSubjectName: z.string().nullable().optional(),
  targetChapterName: z.string().nullable().optional(),
});

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
];

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured in server environment (.env.local).' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message || 'Invalid generation parameters' },
        { status: 400 }
      );
    }

    const {
      pdfUrl,
      startPage,
      endPage,
      count,
      difficultyBias,
      cognitiveBias,
      topicPrompt,
      targetSubjectName,
      targetChapterName,
    } = parsed.data;

    // 1. Fetch & Slice PDF if URL is provided
    let slicedPdfBase64: string | null = null;
    let actualStart = startPage || 1;
    let actualEnd = endPage || 1;

    if (pdfUrl) {
      let rawPdfBuffer: Buffer | null = null;
      const bucketName = getB2BucketName();

      // Attempt 1: Fetch via S3 client if from B2
      try {
        let fileKey = pdfUrl;
        if (pdfUrl.includes(bucketName)) {
          fileKey = decodeURIComponent(pdfUrl.split(`${bucketName}/`)[1] || '');
        } else if (pdfUrl.startsWith('http')) {
          const urlObj = new URL(pdfUrl);
          fileKey = decodeURIComponent(urlObj.pathname.replace(/^\/[^/]+\//, ''));
        }

        if (fileKey) {
          const s3Client = getB2Client();
          const getCmd = new GetObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
          });
          const s3Res = await s3Client.send(getCmd);
          if (s3Res.Body) {
            const bytes = await s3Res.Body.transformToByteArray();
            rawPdfBuffer = Buffer.from(bytes);
          }
        }
      } catch (s3Err) {
        console.warn('S3 GetObject failed in generate route, trying fallback fetch:', s3Err);
      }

      // Attempt 2: Direct HTTP fetch fallback
      if (!rawPdfBuffer) {
        try {
          const res = await fetch(pdfUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            rawPdfBuffer = Buffer.from(arrayBuf);
          }
        } catch (fetchErr) {
          console.warn('Direct HTTP fetch failed in generate route:', fetchErr);
        }
      }

      // Slice the PDF server-side using pdf-lib
      if (rawPdfBuffer) {
        try {
          const srcDoc = await PDFDocument.load(rawPdfBuffer, { ignoreEncryption: true });
          const totalPages = srcDoc.getPageCount();
          actualStart = Math.max(1, Math.min(startPage || 1, totalPages));
          actualEnd = Math.min(totalPages, Math.max(actualStart, endPage || actualStart));

          const pageIndices: number[] = [];
          for (let i = actualStart - 1; i <= actualEnd - 1; i++) {
            pageIndices.push(i);
          }

          const slicedDoc = await PDFDocument.create();
          const copiedPages = await slicedDoc.copyPages(srcDoc, pageIndices);
          copiedPages.forEach((p) => slicedDoc.addPage(p));
          const slicedBytes = await slicedDoc.save();

          slicedPdfBase64 = Buffer.from(slicedBytes).toString('base64');
        } catch (sliceErr) {
          console.warn('PDF slicing failed, using raw buffer:', sliceErr);
          slicedPdfBase64 = rawPdfBuffer.toString('base64');
        }
      }
    }

    // 2. Build Academic Curriculum Prompt & Constraints
    const systemPrompt = `You are an elite academic curriculum specialist and item writer for Punjab Group of Colleges (PGC) and Intermediate Board examinations.
Your goal is to generate ${count} high-yield, competitive multiple-choice questions (MCQs).

ACADEMIC TARGET:
- Subject: ${targetSubjectName || 'Academic Curriculum'}
- Chapter / Unit: ${targetChapterName || 'General Syllabus'}
- Specific Focus: ${topicPrompt || 'Core concepts from the provided textbook excerpt'}
- Difficulty Bias: ${difficultyBias}
- Cognitive Focus: ${cognitiveBias} (KNOWLEDGE = recall/definitions/units, CONCEPTUAL = laws/proportions/reasoning, APPLICATION = numerical problems/formula application)

STRICT GENERATION RULES:
1. MATH & FORMULAS:
   - All mathematical, physical, and chemical symbols, dimensions, fractions, and variables MUST be strictly wrapped in single dollar signs ($ ... $) for KaTeX rendering.
   - Example dimensions: $[M L^2 T^{-2}]$, $[M L T^{-2}]$.
   - Example equations: $\\tau = r \\times F$, $K.E = \\frac{1}{2} m v^2$, $\\lambda = \\frac{h}{p}$, $H_2SO_4$, $\\alpha, \\beta, \\omega$.
2. OPTIONS:
   - Exactly 4 options per question.
   - Exactly 1 correct answer (indicate index 0, 1, 2, or 3).
   - Distractors must represent genuine common student misconceptions, sign errors, or inverted ratios.
3. EXPLANATION:
   - Provide a concise 1-2 sentence pedagogical rationale showing the step or formula proof.

OUTPUT FORMAT:
Output strictly valid JSON matching this exact structure:
{
  "questions": [
    {
      "prompt": "Question text with $math$ if needed",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_option_index": 0,
      "difficulty": "MEDIUM",
      "cognitive_type": "CONCEPTUAL",
      "explanation": "1-2 sentence solution proof"
    }
  ]
}`;

    // 3. Construct Google GenAI Contents
    const contentParts: any[] = [];

    if (slicedPdfBase64) {
      contentParts.push({
        inlineData: {
          data: slicedPdfBase64,
          mimeType: 'application/pdf',
        },
      });
      contentParts.push({
        text: `Please thoroughly examine the attached textbook pages (${actualStart} to ${actualEnd}) and generate ${count} competitive MCQs targeting: "${topicPrompt || targetChapterName || 'Textbook Concepts'}". Follow all system directives.`,
      });
    } else {
      contentParts.push({
        text: `Generate ${count} competitive MCQs based on the following syllabus topic: "${topicPrompt || targetChapterName || 'General Core Syllabus'}". Follow all system directives.`,
      });
    }

    // 4. Initialize GoogleGenAI Client and Execute with Fallback Loop
    const ai = new GoogleGenAI({ apiKey });
    let lastError: any = null;

    for (const modelToTry of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: contentParts,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.35,
          },
        });

        const rawText = response.text || '';
        const parsedJson = JSON.parse(rawText);

        if (!parsedJson.questions || !Array.isArray(parsedJson.questions)) {
          throw new Error('AI response did not contain a questions array');
        }

        // Format into StagedQuestions
        const formattedQuestions = parsedJson.questions.map((q: any, idx: number) => {
          const options = Array.isArray(q.options) && q.options.length >= 4
            ? [String(q.options[0]), String(q.options[1]), String(q.options[2]), String(q.options[3])] as [string, string, string, string]
            : ['Option A', 'Option B', 'Option C', 'Option D'] as [string, string, string, string];

          const correctIndex = typeof q.correct_option_index === 'number' && q.correct_option_index >= 0 && q.correct_option_index <= 3
            ? q.correct_option_index
            : 0;

          const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)
            ? q.difficulty
            : 'MEDIUM';

          const cognitiveType = ['KNOWLEDGE', 'CONCEPTUAL', 'APPLICATION'].includes(q.cognitive_type)
            ? q.cognitive_type
            : 'CONCEPTUAL';

          return {
            id: `staged-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            prompt: String(q.prompt || 'Untitled question stem'),
            options,
            correct_option_index: correctIndex,
            difficulty,
            cognitive_type: cognitiveType,
            explanation: q.explanation ? String(q.explanation) : null,
            reviewStatus: 'PENDING' as const,
          };
        });

        return NextResponse.json({
          success: true,
          modelUsed: modelToTry,
          questions: formattedQuestions,
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`Model attempt ${modelToTry} failed:`, err?.message || err);
      }
    }

    throw lastError || new Error('All candidate Gemini models failed to respond.');
  } catch (err: any) {
    console.error('AI Generation API Error:', err);

    const errMsg = err?.message || String(err);
    const isThrottled =
      err?.statusCode === 429 ||
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('quota') ||
      errMsg.includes('high demand') ||
      errMsg.includes('503');

    if (isThrottled) {
      return NextResponse.json(
        {
          error: 'Google AI quota or high demand reached. Please wait 15-20 seconds before generating again.',
          throttled: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err?.message || 'Failed to generate MCQs from textbook.' },
      { status: 500 }
    );
  }
}
