
export interface CaseDates {
  known: string;
  application: string;
  acceptance: string;
  nonAcceptanceNotice: string;
  reportHandover: string;
  resultNotice: string;
  appealReceive: string;
  appealDecisionNotice: string;
}

export interface KnowledgeFile {
  name: string;
  data: string; // Base64 encoded PDF data
  mimeType: string;
}

export interface Meeting {
  id: string;
  date: string;
  title: string;
  phaseId: number;
  agenda: string;
  minutes: string;
  recordingData?: string;
  recordingMimeType?: string;
  transcript?: string;
}

export interface InterviewTranscript {
  id: string;
  name: string;
  content: string;
}

export interface CaseData {
  id: string;
  name: string;
  incidentType: 'sexual_harassment' | 'sexual_assault' | 'sexual_bullying';
  hasApplication: boolean;
  description: string;
  dates: CaseDates;
  checklist: Record<string, boolean>;
  meetings: Meeting[];
  transcripts: InterviewTranscript[];
  investigationReport: string;
}

export interface Task {
  id: string;
  text: string;
  note: string;
  unit: string;
  deadlineRef?: string;
  important?: boolean;
}

export interface Phase {
  id: number;
  title: string;
  color: string;
  iconName: string;
  tasks: Task[];
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  path: string;
}

export interface SyncData {
  cases: CaseData[];
  globalFiles: KnowledgeFile[];
  timestamp: number;
}
