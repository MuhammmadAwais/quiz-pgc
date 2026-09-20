import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { StagedQuestion } from '@/lib/types/studio';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subjectId, chapterId, questions } = body as {
      subjectId: string;
      chapterId: string;
      questions: StagedQuestion[];
    };

    if (!subjectId || !chapterId) {
      return NextResponse.json(
        { success: false, error: 'Please select both a Subject and a Topic.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: 'Invalid questions payload.' },
        { status: 400 }
      );
    }

    const accepted = questions.filter((q) => q.reviewStatus === 'ACCEPTED');
    if (accepted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please accept at least one question before saving.' },
        { status: 400 }
      );
    }

    // Only store { subject_id, chapter_id, text, options, correct_index } in database
    const rows = accepted.map((q) => ({
      subject_id: subjectId,
      chapter_id: chapterId,
      text: q.prompt.trim(),
      options: q.options.map((opt) => opt.trim()),
      correct_index: q.correct_option_index,
    }));

    const supabase = await createClient();
    const { error } = await supabase.from('questions').insert(rows);

    if (error) {
      console.error('Error saving questions to Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    revalidatePath('/question-bank');
    revalidatePath('/books-bank');
    revalidatePath('/match-setup');
    revalidatePath('/dashboard');

    return NextResponse.json({
      success: true,
      insertedCount: accepted.length,
    });
  } catch (err: any) {
    console.error('Save API route error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error occurred while saving questions.' },
      { status: 500 }
    );
  }
}
