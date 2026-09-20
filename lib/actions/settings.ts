'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function clearContestHistory(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('contests').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/match-setup');
  return { success: true };
}

export async function resetAllData(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Cascade delete handles chapters, questions, contest_questions
  const { error: contestError } = await supabase
    .from('contests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  const { error: subjectError } = await supabase
    .from('subjects')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (contestError || subjectError) {
    return {
      success: false,
      error: contestError?.message || subjectError?.message,
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  return { success: true };
}
