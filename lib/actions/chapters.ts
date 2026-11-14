'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { revalidatePath } from 'next/cache';
import { Chapter } from '@/lib/types/tournament';

export async function getChapters(subjectId?: string): Promise<Chapter[]> {
  const supabase = await createClient();

  const [
    { data: chapters, error },
    { data: questionCounts, error: countError },
  ] = await Promise.all([
    fetchAllPages<Chapter>((from, to) => {
      let query = supabase
        .from('chapters')
        .select('id, subject_id, name, created_at', { count: 'exact' })
        .order('name', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      return query;
    }),
    fetchAllPages<{ chapter_id: string }>((from, to) => {
      let query = supabase
        .from('questions')
        .select('chapter_id', { count: 'exact' })
        .order('id', { ascending: true })
        .range(from, to);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      return query;
    }),
  ]);

  if (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }

  const countMap: Record<string, number> = {};
  if (!countError && questionCounts) {
    questionCounts.forEach((q) => {
      countMap[q.chapter_id] = (countMap[q.chapter_id] || 0) + 1;
    });
  }

  return chapters.map((c) => ({
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
