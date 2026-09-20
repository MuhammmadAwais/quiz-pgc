'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Contest } from '@/lib/types/tournament';

export async function getContestStats(): Promise<{
  totalContests: number;
  totalQuestions: number;
  totalSubjects: number;
}> {
  const supabase = await createClient();

  const [
    { count: contestCount },
    { count: questionCount },
    { count: subjectCount },
  ] = await Promise.all([
    supabase.from('contests').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalContests: contestCount || 0,
    totalQuestions: questionCount || 0,
    totalSubjects: subjectCount || 0,
  };
}

export async function getContestHistory(): Promise<Contest[]> {
  const supabase = await createClient();

  const { data: contests, error } = await supabase
    .from('contests')
    .select(`
      id,
      team_a_name,
      team_b_name,
      team_a_score,
      team_b_score,
      winner_name,
      status,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error || !contests) {
    console.error('Error fetching contest history:', error);
    return [];
  }

  // Fetch count of questions per contest
  const { data: cqData } = await supabase
    .from('contest_questions')
    .select('contest_id');

  const countMap: Record<string, number> = {};
  if (cqData) {
    cqData.forEach((cq) => {
      countMap[cq.contest_id] = (countMap[cq.contest_id] || 0) + 1;
    });
  }

  return contests.map((c) => ({
    id: c.id,
    team_a_name: c.team_a_name,
    team_b_name: c.team_b_name,
    team_a_score: c.team_a_score,
    team_b_score: c.team_b_score,
    winner_name: c.winner_name,
    status: c.status,
    created_at: c.created_at,
    revealed_count: countMap[c.id] || 0,
  }));
}

export async function commitContestResult(payload: {
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  winner_name: string | null;
  revealed_question_ids: string[];
}): Promise<{ success: boolean; contestId?: string; error?: string }> {
  const supabase = await createClient();

  // 1. Insert Contest
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .insert({
      team_a_name: payload.team_a_name,
      team_b_name: payload.team_b_name,
      team_a_score: payload.team_a_score,
      team_b_score: payload.team_b_score,
      winner_name: payload.winner_name,
      status: 'completed',
    })
    .select('id')
    .single();

  if (contestError || !contest) {
    console.error('Failed to commit contest record:', contestError);
    return { success: false, error: contestError?.message };
  }

  // 2. Insert into contest_questions ledger (deduplicated IDs)
  const uniqueIds = Array.from(new Set(payload.revealed_question_ids));
  if (uniqueIds.length > 0) {
    const records = uniqueIds.map((qid) => ({
      contest_id: contest.id,
      question_id: qid,
    }));

    const { error: ledgerError } = await supabase
      .from('contest_questions')
      .insert(records);

    if (ledgerError) {
      console.error('Failed to commit contest_questions ledger:', ledgerError);
    }
  }

  revalidatePath('/dashboard');
  return { success: true, contestId: contest.id };
}
