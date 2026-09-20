export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type CognitiveType = 'KNOWLEDGE' | 'CONCEPTUAL' | 'APPLICATION';
export type ReviewStatus = 'INBOX' | 'APPROVED' | 'DISCARDED';

export interface StagedQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correct_option_index: number;
  difficulty: Difficulty;
  cognitive_type: CognitiveType;
  explanation: string | null;
  reviewStatus: ReviewStatus;
}

export interface StudioConfig {
  selectedBookId: string | null;
  targetSubjectId: string | null;
  targetChapterId: string | null;
  startPage: number;
  endPage: number;
  count: number;
  difficultyBias: 'BALANCED' | 'EASY' | 'MEDIUM' | 'HARD';
  cognitiveBias: 'MIXED' | 'KNOWLEDGE' | 'CONCEPTUAL' | 'APPLICATION';
  topicPrompt: string;
}
