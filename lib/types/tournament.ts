export type TeamTurn = 'TEAM_A' | 'TEAM_B';

export interface Subject {
  id: string;
  name: string;
  created_at?: string;
  question_count?: number;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  created_at?: string;
  question_count?: number;
}

export interface Question {
  id: string;
  subject_id: string;
  chapter_id: string;
  text: string;
  options: [string, string, string, string];
  correct_index: number;
  created_at?: string;
  subject_name?: string;
  chapter_name?: string;
}

export interface Contest {
  id: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  winner_name: string | null;
  status: string;
  created_at: string;
  revealed_count?: number;
}

export interface TournamentConfig {
  teamAName: string;
  teamBName: string;
  teamAColor?: string;
  teamBColor?: string;
  selectedSubjectIds: string[];
  subjectQuestionCounts: Record<string, number>; // subject_id -> questions per team
  mcqsPerSubject?: number; // fallback total
  pointsPerMcq: number;
  includeUsedQuestions: boolean;
}

export interface TurnSnapshot {
  teamTurn: TeamTurn;
  subjectIndex: number;
  questionIndexInSubject: number;
  teamAScore: number;
  teamBScore: number;
  isQuestionRevealed: boolean;
  selectedOptionIndex: number | null;
  isAnswerSubmitted: boolean;
  isTieBreaker: boolean;
  tieBreakerQuestionIndex: number;
  selectedMysteryBox?: number | null;
  revealedQuestionIds: string[];
}

export interface TournamentState {
  config: TournamentConfig | null;
  questionPool: Record<string, Question[]>; // Full pool for reference
  teamAQuestionPool: Record<string, Question[]>; // Non-overlapping questions for Team A
  teamBQuestionPool: Record<string, Question[]>; // Non-overlapping questions for Team B
  subjects: Subject[];
  currentSubjectIndex: number;
  currentQuestionIndex: number;
  teamTurn: TeamTurn;
  teamAScore: number;
  teamBScore: number;
  isQuestionRevealed: boolean;
  selectedOptionIndex: number | null;
  isAnswerSubmitted: boolean;
  isTieBreaker: boolean;
  tieBreakerQuestions: Question[];
  tieBreakerQuestionIndex: number;
  selectedMysteryBox: number | null;
  revealedQuestionIds: string[];
  isMatchFinished: boolean;
  winnerName: string | null;
  historyStack: TurnSnapshot[];

  // Actions
  initializeMatch: (config: TournamentConfig, questionsBySubject: Record<string, Question[]>, subjects: Subject[]) => void;
  revealQuestion: () => void;
  selectOption: (index: number) => void;
  confirmAnswer: () => void;
  nextTurn: () => void;
  undoLastAction: () => void;
  selectMysteryBox: (boxIndex: number) => void;
  finishMatch: () => void;
  resetMatch: () => void;
}
