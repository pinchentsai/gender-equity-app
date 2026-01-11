
export interface CaseDates {
  known: string;
  application: string;
  acceptance: string;
  nonAcceptanceNotice: string;
  nonAcceptanceAppealReceive: string;
  reportHandover: string;
  resultNotice: string;
  appealReceive: string;
  appealDecisionNotice: string;
  reinvestigationStart: string; // 新增：6.3 重新調查起始日
}

export interface KnowledgeFile {
  name: string;
  data: string; // Base64 encoded PDF data
  mimeType: string;
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
  incidentRoleType: 'teacher_vs_student' | 'student_vs_student_middle_up' | 'student_vs_student_elementary'; // 更新：細分生對生樣態
  hasApplication: boolean;
  description: string;
  dates: CaseDates;
  checklist: Record<string, boolean>;
  completionDates: Record<string, string>; // 新增：儲存各任務實際完成日期
  transcripts: InterviewTranscript[];
  investigationReport: string;
  extensionMonths: number; // 0, 1, or 2
  decisionStatus?: 'pending' | 'accepted' | 'not_accepted';
  investigationMechanism?: 'pending' | 'committee_direct' | 'investigation_team'; // 新增：調查機制
  filedAppeal?: boolean;
  investigationResult?: 'pending' | 'substantiated' | 'unsubstantiated';
  // Phase 6 logic
  phase6AppealStatus?: 'pending' | 'filed' | 'none';
  phase6AppealResult?: 'pending' | 'substantiated' | 'unsubstantiated';
  phase6AppealFollowUp?: 'pending' | 'redetermination' | 'reinvestigation';
  phase6RemedyStatus?: 'pending' | 'filed' | 'none';
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
