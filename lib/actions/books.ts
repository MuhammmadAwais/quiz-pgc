'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getB2Client, getB2BucketName } from '@/lib/b2/client';
import { Book } from '@/lib/types/books';
import { StagedQuestion } from '@/lib/types/studio';

export async function getBooks(): Promise<Book[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }

  return (data || []).map((b: any) => ({
    id: b.id,
    title: b.title,
    subject_tags: b.subject_tags || [],
    file_url: b.file_url,
    file_key: b.file_key,
    page_count: b.page_count || 1,
    file_size_bytes: b.file_size_bytes,
    thumbnail_url: b.thumbnail_url,
    created_at: b.created_at,
  }));
}

export async function createBookRecord(data: {
  title: string;
  subject_tags: string[];
  file_url: string;
  file_key: string;
  page_count: number;
  file_size_bytes?: number;
}): Promise<{ success: boolean; book?: Book; error?: string }> {
  if (!data.title.trim()) {
    return { success: false, error: 'Book title is required.' };
  }
  if (!data.file_url || !data.file_key) {
    return { success: false, error: 'Valid file information is required.' };
  }

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from('books')
    .insert({
      title: data.title.trim(),
      subject_tags: data.subject_tags,
      file_url: data.file_url,
      file_key: data.file_key,
      page_count: data.page_count,
      file_size_bytes: data.file_size_bytes,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting book record:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/question-bank');
  return {
    success: true,
    book: {
      id: inserted.id,
      title: inserted.title,
      subject_tags: inserted.subject_tags || [],
      file_url: inserted.file_url,
      file_key: inserted.file_key,
      page_count: inserted.page_count,
      file_size_bytes: inserted.file_size_bytes,
      thumbnail_url: inserted.thumbnail_url,
      created_at: inserted.created_at,
    },
  };
}

export async function deleteBook(
  id: string,
  fileKey?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Delete DB record
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) {
    console.error('Error deleting book record:', error);
    return { success: false, error: error.message };
  }

  // 2. Best-effort delete from Backblaze B2 S3 storage
  if (fileKey) {
    try {
      const s3Client = getB2Client();
      const bucketName = getB2BucketName();
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
        })
      );
    } catch (s3Err) {
      console.warn('Could not delete file from B2 bucket:', s3Err);
    }
  }

  revalidatePath('/question-bank');
  return { success: true };
}

export async function commitApprovedQuestions(
  subjectId: string,
  chapterId: string,
  questions: StagedQuestion[]
): Promise<{ success: boolean; insertedCount: number; error?: string }> {
  if (!subjectId || !chapterId) {
    return { success: false, insertedCount: 0, error: 'Target Subject and Chapter must be selected.' };
  }

  const approved = questions.filter((q) => q.reviewStatus === 'APPROVED');
  if (approved.length === 0) {
    return { success: false, insertedCount: 0, error: 'No approved questions to commit.' };
  }

  const rows = approved.map((q) => ({
    subject_id: subjectId,
    chapter_id: chapterId,
    text: q.prompt.trim(),
    options: q.options.map((opt) => opt.trim()),
    correct_index: q.correct_option_index,
  }));

  const supabase = await createClient();
  const { error } = await supabase.from('questions').insert(rows);

  if (error) {
    console.error('Error committing questions batch:', error);
    return { success: false, insertedCount: 0, error: error.message };
  }

  revalidatePath('/question-bank');
  revalidatePath('/match-setup');
  revalidatePath('/dashboard');
  return { success: true, insertedCount: approved.length };
}
