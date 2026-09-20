'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Splits text into segments of plain text and LaTeX math ($...$ or $$...$$)
 * and compiles LaTeX segments using KaTeX safely.
 */
export function MathRenderer({ content, className = '', inline = false }: MathRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content || typeof content !== 'string') return '';

    // Standardize delimiters: \(...\) -> $...$ and \[...\] -> $$...$$
    let text = content
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$$1$$$$');

    // Auto-detect common Physics dimensions if not wrapped in $
    if (!text.includes('$')) {
      text = text.replace(/(?:\[[A-Z0-9\s\^\-\+\{\}\=]+\])+/g, (match) => {
        const cleaned = match.replace(/\^([0-9\-]+)/g, '^{$1}');
        return `$${cleaned}$`;
      });
    }

    // Match either display math ($$...$$) or inline math ($...$)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    const parts = text.split(regex);

    return parts
      .map((part) => {
        if (!part) return '';

        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            return katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return part;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            return katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return part;
          }
        } else {
          // Plain text: escape HTML characters
          return part
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }
      })
      .join('');
  }, [content]);

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
      className={`math-renderer overflow-x-auto leading-relaxed text-optic-white ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
