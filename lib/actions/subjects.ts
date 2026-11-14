'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { revalidatePath } from 'next/cache';
import { Subject } from '@/lib/types/tournament';

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient();

  const [
    { data: subjects, error },
    { data: questionCounts, error: countError },
  ] = await Promise.all([
    fetchAllPages<{ id: string; name: string; created_at: string }>((from, to) =>
      supabase
        .from('subjects')
        .select('id, name, created_at', { count: 'exact' })
        .order('name', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to)
    ),
    fetchAllPages<{ subject_id: string }>((from, to) =>
      supabase
        .from('questions')
        .select('subject_id', { count: 'exact' })
        .order('id', { ascending: true })
        .range(from, to)
    ),
  ]);

  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }

  const countMap: Record<string, number> = {};
  if (!countError && questionCounts) {
    questionCounts.forEach((q) => {
      countMap[q.subject_id] = (countMap[q.subject_id] || 0) + 1;
    });
  }

  return subjects.map((s) => ({
    ...s,
    question_count: countMap[s.id] || 0,
  }));
}

export async function createSubject(name: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: 'Subject name cannot be empty' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('subjects').insert({ name: trimmed });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateSubject(id: string, name: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: 'Subject name cannot be empty' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('subjects').update({ name: trimmed }).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  return { success: true };
}

export async function deleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('subjects').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  revalidatePath('/dashboard');
  return { success: true };
}
