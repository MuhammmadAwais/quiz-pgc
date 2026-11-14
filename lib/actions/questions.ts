'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { revalidatePath } from 'next/cache';
import { Question, TournamentConfig } from '@/lib/types/tournament';

interface RawQuestionRow {
  id: string;
  subject_id: string;
  chapter_id: string;
  text: string;
  options: string[];
  correct_index: number;
  created_at?: string;
  subjects: { name: string } | { name: string }[] | null;
  chapters: { name: string } | { name: string }[] | null;
}

function mapRawQuestion(q: RawQuestionRow): Question {
  const subName = Array.isArray(q.subjects) ? q.subjects[0]?.name : q.subjects?.name;
  const chapName = Array.isArray(q.chapters) ? q.chapters[0]?.name : q.chapters?.name;
  return {
    id: q.id,
    subject_id: q.subject_id,
    chapter_id: q.chapter_id,
    text: q.text,
    options: q.options as [string, string, string, string],
    correct_index: q.correct_index,
    created_at: q.created_at,
    subject_name: subName,
    chapter_name: chapName,
  };
}

async function getUsedQuestionIdSet(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Set<string>> {
  const { data: used } = await fetchAllPages<{ question_id: string | null }>((from, to) =>
    supabase
      .from('contest_questions')
      .select('question_id', { count: 'exact' })
      .order('id', { ascending: true })
      .range(from, to)
  );
  return new Set(used.map((u) => u.question_id).filter((id): id is string => Boolean(id)));
}

export async function getQuestions(
  subjectId?: string,
  chapterId?: string
): Promise<Question[]> {
  const supabase = await createClient();

  const { data, error } = await fetchAllPages<RawQuestionRow>((from, to) => {
    let query = supabase
      .from('questions')
      .select(
        `
        id,
        subject_id,
        chapter_id,
        text,
        options,
        correct_index,
        created_at,
        subjects ( name ),
        chapters ( name )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    }
    return query as unknown as PromiseLike<{
      data: RawQuestionRow[] | null;
      error: { message: string } | null;
      count?: number | null;
    }>;
  });

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  return data.map(mapRawQuestion);
}

export async function createQuestion(data: {
  subject_id: string;
  chapter_id: string;
  text: string;
  options: [string, string, string, string];
  correct_index: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!data.text.trim()) {
    return { success: false, error: 'Question prompt cannot be empty' };
  }
  if (data.options.some((opt) => !opt.trim())) {
    return { success: false, error: 'All 4 options must be filled' };
  }
  if (data.correct_index < 0 || data.correct_index > 3) {
    return { success: false, error: 'Valid correct option index required (0-3)' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('questions').insert({
    subject_id: data.subject_id,
    chapter_id: data.chapter_id,
    text: data.text.trim(),
    options: data.options.map((o) => o.trim()),
    correct_index: data.correct_index,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateQuestion(
  id: string,
  data: {
    text: string;
    options: [string, string, string, string];
    correct_index: number;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!data.text.trim()) {
    return { success: false, error: 'Question prompt cannot be empty' };
  }
  if (data.options.some((opt) => !opt.trim())) {
    return { success: false, error: 'All 4 options must be filled' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('questions')
    .update({
      text: data.text.trim(),
      options: data.options.map((o) => o.trim()),
      correct_index: data.correct_index,
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  return { success: true };
}

export async function deleteQuestion(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('questions').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getPoolStats(
  selectedSubjectIds: string[],
  includeUsed: boolean
): Promise<{ totalAvailable: number; breakdown: Record<string, number> }> {
  if (selectedSubjectIds.length === 0) {
    return { totalAvailable: 0, breakdown: {} };
  }

  const supabase = await createClient();

  const [usedSet, { data, error }] = await Promise.all([
    includeUsed ? Promise.resolve(new Set<string>()) : getUsedQuestionIdSet(supabase),
    fetchAllPages<{ id: string; subject_id: string }>((from, to) =>
      supabase
        .from('questions')
        .select('id, subject_id', { count: 'exact' })
        .in('subject_id', selectedSubjectIds)
        .order('id', { ascending: true })
        .range(from, to)
    ),
  ]);

  if (error) {
    return { totalAvailable: 0, breakdown: {} };
  }

  let totalAvailable = 0;
  const breakdown: Record<string, number> = {};
  data.forEach((q) => {
    if (!includeUsed && usedSet.has(q.id)) return;
    totalAvailable += 1;
    breakdown[q.subject_id] = (breakdown[q.subject_id] || 0) + 1;
  });

  return {
    totalAvailable,
    breakdown,
  };
}

export async function fetchEligibleQuestions(
  config: TournamentConfig
): Promise<Record<string, Question[]>> {
  const supabase = await createClient();

  const [usedSet, { data: allRows, error }] = await Promise.all([
    config.includeUsedQuestions ? Promise.resolve(new Set<string>()) : getUsedQuestionIdSet(supabase),
    fetchAllPages<RawQuestionRow>((from, to) =>
      supabase
        .from('questions')
        .select(
          `
          id,
          subject_id,
          chapter_id,
          text,
          options,
          correct_index,
          subjects ( name ),
          chapters ( name )
        `,
          { count: 'exact' }
        )
        .in('subject_id', config.selectedSubjectIds)
        .order('id', { ascending: true })
        .range(from, to) as unknown as PromiseLike<{
          data: RawQuestionRow[] | null;
          error: { message: string } | null;
          count?: number | null;
        }>
    ),
  ]);

  if (error) {
    console.error('Failed to load eligible questions:', error);
    return {};
  }

  // Group fresh questions first, appending previously used rows only as Super Over fallback reserve
  const grouped: Record<string, Question[]> = {};
  const reserveBySubject: Record<string, Question[]> = {};

  allRows.forEach((item) => {
    const q = mapRawQuestion(item);
    if (!config.includeUsedQuestions && usedSet.has(q.id)) {
      if (!reserveBySubject[q.subject_id]) reserveBySubject[q.subject_id] = [];
      reserveBySubject[q.subject_id].push(q);
      return;
    }
    if (!grouped[q.subject_id]) {
      grouped[q.subject_id] = [];
    }
    grouped[q.subject_id].push(q);
  });

  if (!config.includeUsedQuestions && usedSet.size > 0) {
    for (const [subId, reserve] of Object.entries(reserveBySubject)) {
      if (grouped[subId]) {
        grouped[subId].push(...reserve);
      }
    }
  }

  return grouped;
}

export async function seedSampleQuestions(): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  // 1. Create Subjects
  const sampleData = [
    {
      subject: 'Computer Science',
      chapters: [
        {
          name: 'Data Structures & Algorithms',
          questions: [
            {
              text: 'What is the worst-case time complexity of lookup in an unbalanced Binary Search Tree?',
              options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
              correct_index: 2,
            },
            {
              text: 'Which data structure is fundamentally utilized to implement Breadth-First Search (BFS)?',
              options: ['Stack', 'Queue', 'Priority Queue', 'Disjoint Set'],
              correct_index: 1,
            },
            {
              text: 'In asymptotic analysis, what does the Big-Omega (Ω) notation strictly represent?',
              options: ['Tight bound', 'Upper bound', 'Lower bound', 'Average expected case'],
              correct_index: 2,
            },
          ],
        },
        {
          name: 'Operating Systems',
          questions: [
            {
              text: 'Which condition is NOT one of the four necessary Coffman conditions for deadlock?',
              options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
              correct_index: 2,
            },
            {
              text: 'What is the primary purpose of the Translation Lookaside Buffer (TLB) in CPU memory management?',
              options: [
                'Cache disk blocks',
                'Cache virtual-to-physical address translations',
                'Store kernel registers during context switch',
                'Schedule CPU threads',
              ],
              correct_index: 1,
            },
          ],
        },
      ],
    },
    {
      subject: 'Physics',
      chapters: [
        {
          name: 'Thermodynamics',
          questions: [
            {
              text: 'Which thermodynamic process occurs at constant pressure?',
              options: ['Isothermal', 'Isobaric', 'Isochoric', 'Adiabatic'],
              correct_index: 1,
            },
            {
              text: 'According to the Second Law of Thermodynamics, what happens to the total entropy of an isolated system?',
              options: [
                'It always decreases',
                'It remains constant or increases',
                'It fluctuates periodically',
                'It drops to absolute zero',
              ],
              correct_index: 1,
            },
          ],
        },
        {
          name: 'Electromagnetism',
          questions: [
            {
              text: 'Which of Maxwell’s equations establishes that magnetic monopoles do not exist in classical physics?',
              options: [
                'Gauss’s Law for Electricity',
                'Gauss’s Law for Magnetism (∇ · B = 0)',
                'Faraday’s Law of Induction',
                'Ampère-Maxwell Law',
              ],
              correct_index: 1,
            },
            {
              text: 'What is the SI unit of magnetic flux density?',
              options: ['Weber', 'Tesla', 'Henry', 'Gauss'],
              correct_index: 1,
            },
          ],
        },
      ],
    },
    {
      subject: 'Mathematics',
      chapters: [
        {
          name: 'Calculus & Linear Algebra',
          questions: [
            {
              text: 'If matrix A has eigenvalues λ₁ = 3 and λ₂ = 5, what is the determinant of matrix A?',
              options: ['8', '15', '2', '-2'],
              correct_index: 1,
            },
            {
              text: 'What is the derivative of f(x) = ln(sec(x) + tan(x)) with respect to x?',
              options: ['sec²(x)', 'tan(x)', 'sec(x)', 'sec(x)tan(x)'],
              correct_index: 2,
            },
            {
              text: 'What is the rank of an n × n identity matrix?',
              options: ['0', '1', 'n', 'n - 1'],
              correct_index: 2,
            },
          ],
        },
      ],
    },
  ];

  for (const item of sampleData) {
    let { data: existingSub } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', item.subject)
      .single();

    let subjectId = existingSub?.id;
    if (!subjectId) {
      const { data: newSub, error: subErr } = await supabase
        .from('subjects')
        .insert({ name: item.subject })
        .select('id')
        .single();
      if (subErr || !newSub) continue;
      subjectId = newSub.id;
    }

    for (const chap of item.chapters) {
      let { data: existingChap } = await supabase
        .from('chapters')
        .select('id')
        .eq('name', chap.name)
        .eq('subject_id', subjectId)
        .single();

      let chapterId = existingChap?.id;
      if (!chapterId) {
        const { data: newChap, error: chapErr } = await supabase
          .from('chapters')
          .insert({ subject_id: subjectId, name: chap.name })
          .select('id')
          .single();
        if (chapErr || !newChap) continue;
        chapterId = newChap.id;
      }

      for (const q of chap.questions) {
        // Check if question already exists
        const { data: existingQ } = await supabase
          .from('questions')
          .select('id')
          .eq('text', q.text)
          .single();

        if (!existingQ) {
          await supabase.from('questions').insert({
            subject_id: subjectId,
            chapter_id: chapterId,
            text: q.text,
            options: q.options,
            correct_index: q.correct_index,
          });
        }
      }
    }
  }

  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  revalidatePath('/dashboard');
  return { success: true, message: 'Tournament questions successfully seeded!' };
}
