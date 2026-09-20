'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  Library,
  BookOpen,
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Search,
  Tag,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Book } from '@/lib/types/books';
import { Subject, Chapter } from '@/lib/types/tournament';
import { getBooks, createBookRecord, deleteBook } from '@/lib/actions/books';
import { getSubjects } from '@/lib/actions/subjects';
import { getChapters } from '@/lib/actions/chapters';
import { AiStudioModal } from '@/components/studio/AiStudioModal';

export default function BooksBankPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [selectedBookForAi, setSelectedBookForAi] = useState<Book | null>(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bks, subs, chaps] = await Promise.all([
        getBooks(),
        getSubjects(),
        getChapters(),
      ]);
      setBooks(bks);
      setSubjects(subs);
      setChapters(chaps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute all unique tags across textbooks
  const allTags = Array.from(
    new Set(books.flatMap((b) => b.subject_tags || []).filter(Boolean))
  );

  // Filtered books
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      !searchQuery.trim() ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subject_tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || b.subject_tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name
          .replace(/\.pdf$/i, '')
          .replace(/[_-]/g, ' ')
          .trim();
        setTitle(cleanName);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF file.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please provide a textbook title.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/library/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload file to storage.');
      }

      const subject_tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const saveRes = await createBookRecord({
        title: title.trim(),
        subject_tags,
        file_url: data.fileUrl,
        file_key: data.fileKey,
        page_count: data.pageCount || 1,
        file_size_bytes: data.fileSizeBytes,
      });

      if (!saveRes.success) {
        throw new Error(saveRes.error || 'Failed to save textbook metadata.');
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setTitle('');
      setTagsInput('');
      await loadData();

      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccess(false);
      }, 1200);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err?.message || 'Error uploading textbook. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Are you sure you want to remove "${book.title}" from Books Bank?`)) return;
    try {
      await deleteBook(book.id, book.file_key);
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-obsidian flex flex-col font-sans">
      {/* Top Action Header */}
      <div className="bg-surface-onyx border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/question-bank"
                className="text-xs text-text-muted-slate hover:text-optic-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Question Bank</span>
              </Link>
            </div>
            <h1 className="text-xl font-bold font-mono tracking-wider text-optic-white flex items-center gap-2">
              <Library className="w-5 h-5 text-team-b-cyan" />
              <span>BOOKS BANK</span>
            </h1>
            <p className="text-xs text-text-muted-slate mt-0.5">
              Digital textbook repository • Upload, inspect, and generate high-yield MCQs with AI
            </p>
          </div>

          {/* Search & Upload Action */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted-slate" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or tag..."
                className="w-full bg-surface-carbon border border-white/15 rounded-md pl-9 pr-3 py-1.5 text-xs text-optic-white placeholder-text-muted-slate focus:outline-none focus:border-team-b-cyan"
              />
            </div>

            <Button
              variant="team-b"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>+ Upload Textbook</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Tag Filters Strip */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                selectedTag === null
                  ? 'bg-team-b-cyan text-surface-obsidian font-bold shadow-sm'
                  : 'bg-surface-carbon border border-white/10 text-text-muted-slate hover:text-optic-white'
              }`}
            >
              All Textbooks ({books.length})
            </button>
            {allTags.map((tag) => {
              const isSelected = selectedTag === tag;
              const count = books.filter((b) => b.subject_tags.includes(tag)).length;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-team-b-cyan text-surface-obsidian font-bold shadow-sm'
                      : 'bg-surface-carbon border border-white/10 text-text-bright-slate hover:text-optic-white'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Books Shelf Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-team-b-cyan" />
            <p className="text-xs text-text-muted-slate font-mono">Loading Books Bank repository...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl p-8 space-y-4 max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-text-muted-slate mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-optic-white">
                {searchQuery || selectedTag ? 'No matching textbooks found' : 'Your Books Bank is empty'}
              </h3>
              <p className="text-xs text-text-muted-slate">
                {searchQuery || selectedTag
                  ? 'Try adjusting your search or filter tags.'
                  : 'Upload your curriculum textbooks to generate accurate, syllabus-aligned questions with AI.'}
              </p>
            </div>
            <Button
              variant="team-b"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Textbook PDF</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="p-5 rounded-2xl bg-surface-carbon border border-border-subtle hover:border-team-b-cyan/50 transition-all flex flex-col justify-between group shadow-lg space-y-4"
              >
                {/* Header & Meta */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-onyx border border-white/10 flex items-center justify-center text-team-b-cyan shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-optic-white leading-snug truncate">
                          {book.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted-slate font-mono">
                          <span className="text-team-b-cyan font-bold">{book.page_count} pages</span>
                          {book.file_size_bytes && (
                            <>
                              <span>•</span>
                              <span>{(book.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(book)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted-slate hover:text-state-warning-rose hover:bg-state-warning-rose/10 transition-all cursor-pointer shrink-0"
                      title="Delete Textbook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Subject Tags */}
                  {book.subject_tags && book.subject_tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {book.subject_tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          onClick={() => setSelectedTag(tag)}
                          className="px-2.5 py-0.5 rounded-md bg-surface-onyx border border-white/10 text-[10px] font-mono text-text-bright-slate hover:text-team-b-cyan cursor-pointer transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  <a
                    href={`/api/library/proxy?url=${encodeURIComponent(book.file_url)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-text-muted-slate hover:text-optic-white font-mono flex items-center gap-1 transition-colors"
                  >
                    <span>View PDF</span>
                    <span>↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookForAi(book);
                      setIsAiStudioOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-team-b-cyan hover:bg-team-b-cyan/90 text-surface-obsidian text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-team-b-cyan/20 cursor-pointer hover:scale-[1.02]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate MCQs</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Textbook Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Textbook to Books Bank"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-state-warning-rose/15 border border-state-warning-rose/30 text-state-warning-rose text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-state-success/15 border border-state-success/30 text-state-success text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Textbook successfully uploaded and registered!</span>
            </div>
          )}

          {/* Drag & Drop Surface */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-team-b-cyan/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-surface-onyx/50 hover:bg-surface-onyx"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <UploadCloud className="w-10 h-10 text-team-b-cyan mx-auto mb-2 opacity-80" />
            {selectedFile ? (
              <div>
                <p className="text-sm font-bold text-optic-white truncate max-w-sm mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-team-b-cyan mt-1 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs sm:text-sm font-semibold text-optic-white">
                  Click to choose or drag &amp; drop textbook PDF
                </p>
                <p className="text-[11px] text-text-muted-slate mt-1 font-mono">
                  Supported formats: PDF (up to 100 MB)
                </p>
              </div>
            )}
          </div>

          {/* Title Input */}
          <Input
            label="Textbook Title"
            placeholder="e.g. Physics Class 11 (Punjab Textbook Board)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Subject Tags */}
          <Input
            label="Subject & Syllabus Tags (comma separated)"
            placeholder="e.g. Physics, Class 11, Mechanics, PGC"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="console"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="team-b"
              size="sm"
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Backblaze B2...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload to Books Bank</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Integrated AI Studio Modal */}
      <AiStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        subjects={subjects}
        chapters={chapters}
        books={books}
        initialBookId={selectedBookForAi?.id}
        onOpenBooksBank={() => setIsUploadModalOpen(true)}
        onSuccess={loadData}
      />
    </div>
  );
}
