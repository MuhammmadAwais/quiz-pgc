export interface Book {
  id: string;
  title: string;
  subject_tags: string[]; // Flexible tags, e.g. ["Physics", "Class 11", "General"]
  file_url: string;
  file_key: string;
  page_count: number;
  file_size_bytes?: number;
  thumbnail_url?: string | null;
  created_at?: string;
}
