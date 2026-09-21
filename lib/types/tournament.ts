export type TeamTurn = string; // e.g. 'TEAM_A' | 'TEAM_B' or teamId

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

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
  teams: Team[];
  timeLimitSeconds: number; // 0 = untimed / disabled; or 15, 30, 45, 60, etc.
  teamAName?: string;
  teamBName?: string;
  teamAColor?: string;
  teamBColor?: string;
  selectedSubjectIds: string[];
  subjectQuestionCounts: Record<string, number>; // subject_id -> questions per team
  mcqsPerSubject?: number; // fallback total
  pointsPerMcq: number;
  includeUsedQuestions: boolean;
}

export interface TurnSnapshot {
  activeTeamIndex: number;
  teams: Team[];
  subjectIndex: number;
  questionIndexInSubject: number;
  isQuestionRevealed: boolean;
  selectedOptionIndex: number | null;
  isAnswerSubmitted: boolean;
  isTieBreaker: boolean;
  tieBreakerQuestionIndex: number;
  selectedMysteryBox?: number | null;
  revealedQuestionIds: string[];
  timerStartedAt: number | null;
  isTimeExpired: boolean;
  // Backwards compatibility:
  teamTurn?: TeamTurn;
  teamAScore?: number;
  teamBScore?: number;
}

export interface TournamentState {
  config: TournamentConfig | null;
  teams: Team[];
  activeTeamIndex: number;
  questionPool: Record<string, Question[]>; // Full pool for reference
  teamQuestionPools: Record<string, Record<string, Question[]>>; // teamId -> subjectId -> Question[]
  teamAQuestionPool: Record<string, Question[]>; // Legacy compatibility
  teamBQuestionPool: Record<string, Question[]>; // Legacy compatibility
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

  // Timer State
  timerStartedAt: number | null;
  isTimerPaused: boolean;
  isTimeExpired: boolean;

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

  // Timer Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  expireTimer: () => void;
}
