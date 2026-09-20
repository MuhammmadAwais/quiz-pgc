'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Subject } from '@/lib/types/tournament';

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient();

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }

  // Count questions per subject
  const { data: questionCounts, error: countError } = await supabase
    .from('questions')
    .select('subject_id');

  const countMap: Record<string, number> = {};
  if (!countError && questionCounts) {
    questionCounts.forEach((q) => {
      countMap[q.subject_id] = (countMap[q.subject_id] || 0) + 1;
    });
  }

  return (subjects || []).map((s) => ({
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
