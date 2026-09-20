'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Chapter } from '@/lib/types/tournament';

export async function getChapters(subjectId?: string): Promise<Chapter[]> {
  const supabase = await createClient();

  let query = supabase
    .from('chapters')
    .select('id, subject_id, name, created_at')
    .order('name', { ascending: true });

  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data: chapters, error } = await query;

  if (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }

  // Count questions per chapter
  const { data: questionCounts, error: countError } = await supabase
    .from('questions')
    .select('chapter_id');

  const countMap: Record<string, number> = {};
  if (!countError && questionCounts) {
    questionCounts.forEach((q) => {
      countMap[q.chapter_id] = (countMap[q.chapter_id] || 0) + 1;
    });
  }

  return (chapters || []).map((c) => ({
    ...c,
    question_count: countMap[c.id] || 0,
  }));
}

export async function createChapter(
  subjectId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: 'Chapter name cannot be empty' };
  }
  if (!subjectId) {
    return { success: false, error: 'Subject ID is required' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('chapters').insert({
    subject_id: subjectId,
    name: trimmed,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  return { success: true };
}

export async function updateChapter(
  id: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: 'Chapter name cannot be empty' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('chapters').update({ name: trimmed }).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  return { success: true };
}

export async function deleteChapter(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('chapters').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  return { success: true };
}
