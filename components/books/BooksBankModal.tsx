'use client';

import React, { useState, useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
} from 'lucide-react';
import { Book } from '@/lib/types/books';
import { createBookRecord, deleteBook } from '@/lib/actions/books';

interface BooksBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onRefreshBooks: () => Promise<void>;
  onSelectBookForAi: (book: Book) => void;
}

export function BooksBankModal({
  isOpen,
  onClose,
  books,
  onRefreshBooks,
  onSelectBookForAi,
}: BooksBankModalProps) {
  const [activeTab, setActiveTab] = useState<'SHELF' | 'UPLOAD'>('SHELF');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        // Auto-fill title from clean filename
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
      setUploadError('Please choose a PDF file to upload.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please enter a textbook title.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // 1. Upload to Backblaze B2 via API route
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/library/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload textbook to storage.');
      }

      // 2. Parse tags
      const subject_tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // 3. Save DB record in public.books
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
      await onRefreshBooks();

      // Switch back to shelf after 1.2s
      setTimeout(() => {
        setActiveTab('SHELF');
        setUploadSuccess(false);
      }, 1200);
    } catch (err: any) {
      console.error('Textbook upload failed:', err);
      setUploadError(err?.message || 'Upload process failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Are you sure you want to remove "${book.title}" from the Books Bank?`)) return;
    try {
      await deleteBook(book.id, book.file_key);
      await onRefreshBooks();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-obsidian/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-surface-carbon border border-border-medium rounded-2xl shadow-2xl flex flex-col max-h-[90vh] z-10 animate-fade-in overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-onyx border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-team-b-cyan/15 border border-team-b-cyan/30 flex items-center justify-center text-team-b-cyan">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono uppercase tracking-wider text-optic-white">
                Books Bank
              </h2>
              <p className="text-xs text-text-muted-slate">
                Central textbook repository for AI Question Generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-surface-interactive border border-white/10 rounded-lg p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('SHELF')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'SHELF'
                    ? 'bg-team-b-cyan text-surface-obsidian font-bold'
                    : 'text-text-muted-slate hover:text-optic-white'
                }`}
              >
                Textbooks ({books.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UPLOAD')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'UPLOAD'
                    ? 'bg-team-b-cyan text-surface-obsidian font-bold'
                    : 'text-text-muted-slate hover:text-optic-white'
                }`}
              >
                + Upload PDF
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted-slate hover:text-optic-white hover:bg-surface-interactive transition-colors ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'SHELF' ? (
            books.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl space-y-3">
                <FileText className="w-12 h-12 text-text-muted-slate mx-auto opacity-40" />
                <p className="text-sm text-optic-white font-medium">No textbooks uploaded yet</p>
                <p className="text-xs text-text-muted-slate max-w-sm mx-auto">
                  Upload your curriculum textbooks (Physics, Chemistry, Math, etc.) to start generating high-yield MCQs with AI.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('UPLOAD')}
                  className="px-4 py-2 rounded-xl bg-team-b-cyan text-surface-obsidian text-xs font-bold font-mono uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer mt-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload First Textbook</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className="p-4 rounded-xl bg-surface-onyx border border-white/10 hover:border-team-b-cyan/40 transition-all flex flex-col justify-between group space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-surface-carbon border border-white/10 flex items-center justify-center text-team-b-cyan shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-optic-white leading-snug">
                              {book.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted-slate font-mono">
                              <span className="text-team-b-cyan font-bold">
                                {book.page_count} pages
                              </span>
                              {book.file_size_bytes && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {(book.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(book)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted-slate hover:text-state-warning-rose transition-opacity"
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
                              className="px-2 py-0.5 rounded bg-surface-carbon border border-white/10 text-[10px] font-mono text-text-bright-slate flex items-center gap-1"
                            >
                              <Tag className="w-2.5 h-2.5 text-team-b-cyan" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <a
                        href={`/api/library/proxy?url=${encodeURIComponent(book.file_url)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-text-muted-slate hover:text-optic-white font-mono transition-colors"
                      >
                        View PDF ↗
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectBookForAi(book);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-team-b-cyan/15 hover:bg-team-b-cyan text-team-b-cyan hover:text-surface-obsidian text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate MCQs</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Upload Tab */
            <form onSubmit={handleUpload} className="max-w-xl mx-auto space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-state-warning-rose/15 border border-state-warning-rose/30 text-state-warning-rose text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 rounded-xl bg-state-success/15 border border-state-success/30 text-state-success text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Textbook uploaded successfully to Books Bank!</span>
                </div>
              )}

              {/* File Drop Surface */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-team-b-cyan/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-surface-onyx/50 hover:bg-surface-onyx"
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
                      Up to 100 MB • Automatically counts pages
                    </p>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider font-bold text-optic-white">
                  Textbook Title:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Class 11 (Punjab Textbook Board)"
                  required
                  className="w-full bg-surface-onyx border border-white/15 rounded-lg px-3 py-2 text-xs text-optic-white placeholder-text-muted-slate focus:outline-none focus:border-team-b-cyan"
                />
              </div>

              {/* Subject Tags Input */}
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider font-bold text-optic-white">
                  Subject &amp; Curriculum Tags (comma separated):
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Physics, Class 11, Mechanics, PGC Syllabus"
                  className="w-full bg-surface-onyx border border-white/15 rounded-lg px-3 py-2 text-xs text-optic-white placeholder-text-muted-slate focus:outline-none focus:border-team-b-cyan"
                />
                <p className="text-[10px] text-text-muted-slate">
                  Tags provide clear subject context while keeping the book versatile for any tournament question.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('SHELF')}
                  className="px-4 py-2 rounded-xl bg-surface-interactive text-text-muted-slate hover:text-optic-white text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2.5 rounded-xl bg-team-b-cyan hover:bg-team-b-cyan/90 disabled:opacity-40 text-surface-obsidian text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-team-b-cyan/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Backblaze B2...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload &amp; Register</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
