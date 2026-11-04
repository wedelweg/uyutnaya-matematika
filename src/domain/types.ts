export type Status =
  "unseen" | "learning" | "review" | "secure" | "needsReview";
export type Format = "direct" | "array" | "strategy" | "word" | "missing";
export type Mood = "easy" | "normal" | "tired";
export type Kind =
  "mission" | "diagnostic" | "baseline" | "intermediate" | "delayed";
export type Purpose =
  "warmup" | "review" | "new" | "probe" | "familiar" | "correction";
export interface Fact {
  id: string;
  a: number;
  b: number;
  status: Status;
  dueDate: string | null;
  step: number;
  currentInterval: number;
  passedInterval: number;
  successes: number;
  errors: number;
  successDates: string[];
  successSessions: string[];
  lastAttempt: string | null;
  lastHint: number;
}
export interface Pair {
  id: string;
  understood: boolean;
  evidence: string[];
}
export interface Task {
  id: string;
  factId: string;
  format: Format;
  purpose: Purpose;
  supported: boolean;
  activeMs?: number;
  firstError?: boolean;
  servedPlates?: number;
}
export interface Attempt {
  id: string;
  sessionId: string;
  factId: string;
  format: Format;
  kind: Kind;
  answer: number | null;
  correct: boolean;
  hint: number;
  revealed: boolean;
  first: boolean;
  activeMs: number;
  utc: string;
  date: string;
  independent: boolean;
  action?: "answer" | "teaching";
  firstCorrect?: boolean;
}
export interface Session {
  mode?: "quick";
  game?: "cafe";
  cafePlates?: number;
  id: string;
  kind: Kind;
  seed: number;
  date: string;
  tasks: Task[];
  cursor: number;
  lessonId: string | null;
  lessonAt: number;
  lessonStep: number;
  lessonDone: boolean;
  newFacts: string[];
  probes: string[];
  adaptation: boolean;
  startedAt: string;
  completedAt: string | null;
  correct: number;
  answered: number;
  activeMs: number;
}
export interface Profile {
  name: string;
  theme: "cozy" | "calm";
  pet: "cat" | "bunny";
  timezone: string;
  motion: boolean;
  mood: Mood;
  onboarded: boolean;
  diagnosticDone: boolean;
}
export interface State {
  room?: { slots: (number | null)[] };
  schemaVersion: 2;
  profile: Profile;
  facts: Record<string, Fact>;
  pairs: Record<string, Pair>;
  lessons: Record<string, "completed" | "skipped">;
  attempts: Attempt[];
  sessions: Session[];
  active: Session | null;
  milestones: string[];
  rewards: number[];
  pendingRewards: string[];
}
export interface Lesson {
  id: string;
  title: string;
  short: string;
  description: string;
  prereqs: string[];
  a: number;
  b: number;
  families: number[];
  approach: string;
  split: number;
}
