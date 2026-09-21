'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

// Global LRU-bounded in-memory caches to guarantee 0ms repeat performance
const MAX_CACHE_SIZE = 2500;
const fullRenderCache = new Map<string, string>();
const katexSnippetCache = new Map<string, string>();

/**
 * Safely compiles a LaTeX math snippet with KaTeX, caching the resulting HTML.
 */
function safeCompileSnippet(math: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? 'D' : 'I'}:${math}`;
  const cached = katexSnippetCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let rendered = '';
  try {
    rendered = katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    rendered = math
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Bound cache size to prevent long-tournament memory buildup
  if (katexSnippetCache.size >= MAX_CACHE_SIZE) {
    const keys = Array.from(katexSnippetCache.keys()).slice(0, 500);
    for (const k of keys) katexSnippetCache.delete(k);
  }

  katexSnippetCache.set(cacheKey, rendered);
  return rendered;
}

/**
 * Splits text into plain text and LaTeX math ($...$ or $$...$$),
 * compiles LaTeX segments using KaTeX, and caches the full-string result.
 */
export function compileMathContent(content: string, inline = false): string {
  if (!content || typeof content !== 'string') return '';

  const cacheKey = `${inline ? '1' : '0'}:${content}`;
  const cached = fullRenderCache.get(cacheKey);
  if (cached !== undefined) return cached;

  // Ultra-fast path: If no LaTeX delimiters and no bracketed dimensions, return escaped string directly
  if (
    !content.includes('$') &&
    !content.includes('\\(') &&
    !content.includes('\\[') &&
    !content.includes('[')
  ) {
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    fullRenderCache.set(cacheKey, escaped);
    return escaped;
  }

  // Standardize delimiters: \(...\) -> $...$ and \[...\] -> $$...$$
  let text = content
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$$1$$$$');

  // Auto-detect common Physics dimensions if not wrapped in $ (e.g. [M L T^-2])
  if (!text.includes('$')) {
    text = text.replace(/(?:\[[A-Z0-9\s\^\-\+\{\}\=]+\])+/g, (match) => {
      const cleaned = match.replace(/\^([0-9\-]+)/g, '^{$1}');
      return `$${cleaned}$`;
    });
  }

  // Match display math ($$...$$) or inline math ($...$)
  // $$...$$ takes precedence over $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$(?!\$)[^\$\n]+?\$)/g;
  const parts = text.split(regex);

  const result = parts
    .map((part) => {
      if (!part) return '';

      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const math = part.slice(2, -2).trim();
        // If inline rendering requested, force displayMode to false to preserve layout
        return safeCompileSnippet(math, !inline);
      } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const math = part.slice(1, -1).trim();
        return safeCompileSnippet(math, false);
      } else {
        // Plain text: escape HTML characters
        return part
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
    })
    .join('');

  if (fullRenderCache.size >= MAX_CACHE_SIZE) {
    const keys = Array.from(fullRenderCache.keys()).slice(0, 500);
    for (const k of keys) fullRenderCache.delete(k);
  }

  fullRenderCache.set(cacheKey, result);
  return result;
}

/**
 * High-efficiency MathRenderer component with dual-tier memoization.
 * Supports $...$ for inline formulas and $$...$$ for display equations.
 */
export function MathRenderer({ content, className = '', inline = false }: MathRendererProps) {
  const renderedHtml = useMemo(() => compileMathContent(content, inline), [content, inline]);

  if (inline) {
    return (
      <span
        className={`inline-math-container align-middle text-inherit ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div
      className={`math-renderer leading-relaxed text-inherit ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
