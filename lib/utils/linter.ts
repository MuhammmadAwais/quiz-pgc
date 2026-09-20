export interface LinterReport {
  isClean: boolean;
  warnings: string[];
}

/**
 * Validates multiple-choice questions against common AI generation flaws:
 * - Duplicate or identical distractors
 * - Broken or unclosed LaTeX mathematical delimiters
 * - "All of the above" or "None of the above" shortcuts
 * - Out-of-bounds correct answer index
 * - Extreme option length disparity
 */
export function lintQuestion(
  prompt: string,
  options: string[],
  correctIndex: number
): LinterReport {
  const warnings: string[] = [];

  // 1. Prompt Length Check
  if (!prompt || prompt.trim().length < 10) {
    warnings.push('Question stem is too short or empty.');
  }

  // 2. Options Completeness
  if (!Array.isArray(options) || options.length !== 4) {
    warnings.push('Question must have exactly 4 answer options.');
  } else {
    // Check for empty options
    const emptyIndices: string[] = [];
    options.forEach((opt, idx) => {
      if (!opt || !opt.trim()) {
        emptyIndices.push(['A', 'B', 'C', 'D'][idx]);
      }
    });
    if (emptyIndices.length > 0) {
      warnings.push(`Option ${emptyIndices.join(', ')} is blank.`);
    }

    // Check for duplicate options (Hallucination check)
    const normalized = options.map((opt) => opt.trim().toLowerCase());
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        if (normalized[i] && normalized[i] === normalized[j]) {
          const letter1 = ['A', 'B', 'C', 'D'][i];
          const letter2 = ['A', 'B', 'C', 'D'][j];
          warnings.push(`Duplicate options: Option ${letter1} and Option ${letter2} have identical answers.`);
        }
      }
    }

    // Check for "All of the above" or "None of the above"
    const trivialPatterns = [/all of the above/i, /none of the above/i, /both [a-d] and [a-d]/i];
    options.forEach((opt, idx) => {
      const letter = ['A', 'B', 'C', 'D'][idx];
      if (trivialPatterns.some((p) => p.test(opt))) {
        warnings.push(`Option ${letter} uses a generic shortcut ("All/None of the above"). Competitive formats require 4 distinct answers.`);
      }
    });

    // Check for extreme length disparity (common AI tell where correct answer is a giant paragraph)
    const lengths = options.map((o) => o.length);
    const maxLen = Math.max(...lengths);
    const minLen = Math.min(...lengths);
    if (maxLen > 40 && minLen > 0 && maxLen > minLen * 4) {
      warnings.push('Significant option length disparity detected. The longest option is over 4x longer than the shortest.');
    }
  }

  // 3. Valid Correct Option Index
  if (typeof correctIndex !== 'number' || correctIndex < 0 || correctIndex > 3) {
    warnings.push('Invalid correct answer index (must be between A and D).');
  }

  // 4. LaTeX Math Delimiter Symmetry Check
  const checkDelimiters = (text: string, contextName: string) => {
    // Check single $ count
    const singleDollarMatches = text.match(/(?<!\$)\$(?!\$)/g);
    if (singleDollarMatches && singleDollarMatches.length % 2 !== 0) {
      warnings.push(`Unclosed math delimiter ($) found in ${contextName}.`);
    }

    // Check double $$ count
    const doubleDollarMatches = text.match(/\$\$/g);
    if (doubleDollarMatches && doubleDollarMatches.length % 2 !== 0) {
      warnings.push(`Unclosed display math delimiter ($$) found in ${contextName}.`);
    }

    // Check unclosed braces inside math
    const openBraces = (text.match(/\{/g) || []).length;
    const closeBraces = (text.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      warnings.push(`Mismatched curly braces { } found in ${contextName}.`);
    }
  };

  checkDelimiters(prompt, 'question stem');
  if (Array.isArray(options)) {
    options.forEach((opt, i) => {
      checkDelimiters(opt, `Option ${['A', 'B', 'C', 'D'][i]}`);
    });
  }

  return {
    isClean: warnings.length === 0,
    warnings,
  };
}
