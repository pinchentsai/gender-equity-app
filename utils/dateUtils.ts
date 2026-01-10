
import { CaseData } from '../types';

export const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return '---';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '---';
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  return `${y}-${m}-${d} (${dayOfWeek})`;
};

/**
 * 取得時效狀態
 * @returns 'ok' | 'warning' | 'overdue'
 */
export const getDeadlineStatus = (targetDate: Date | string | undefined, isCompleted: boolean = false) => {
  if (!targetDate || isCompleted) return 'ok';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'warning'; // 倒數 3 日（含今日）預警
  return 'ok';
};

export const isOverdue = (targetDate: Date | string | undefined, isCompleted: boolean = false) => {
  return getDeadlineStatus(targetDate, isCompleted) === 'overdue';
};

/**
 * 檢查日期順序是否正確
 */
export const isValidSequence = (earlierDateStr: string, laterDateStr: string) => {
  if (!earlierDateStr || !laterDateStr) return true;
  const earlier = new Date(earlierDateStr);
  const later = new Date(laterDateStr);
  return later >= earlier;
};

// 時效鍵值與任務 ID 的對應表
export const DEADLINE_TASK_MAP: Record<string, string> = {
  report: "1.2",
  handover: "2.2",
  meetingDecide: "2.4",
  nonAcceptanceAppeal: "2.4", 
  nonAcceptanceAppealReview: "2.5-2",
  investigation: "3.7",
  decision: "5.3", // 修改：對應到 5.3 書面通知處理結果
  resultAppeal: "6.1",
  appealReview: "6.2",
  reinvestigation: "6.5-2",
  remedy: "6.4"
};

export const calculateDeadlines = (caseData: Partial<CaseData>) => {
  if (!caseData || !caseData.dates) return {} as any;
  const d = caseData.dates;
  const deadlines: any = {};

  // 1. 法定通報與受理議決 (知悉觸發)
  if (d.known) {
    const kDate = new Date(d.known);
    const reportDate = new Date(kDate);
    reportDate.setDate(reportDate.getDate() + 1);
    deadlines.report = reportDate;
    
    if (!caseData.hasApplication) {
      const meetingDate = new Date(kDate);
      meetingDate.setDate(meetingDate.getDate() + 20);
      deadlines.meetingDecide = meetingDate;
    }
  }

  // 2. 受理審查與受理議決 (申請觸發)
  if (caseData.hasApplication && d.application) {
    const aDate = new Date(d.application);
    const handoverDate = new Date(aDate);
    handoverDate.setDate(handoverDate.getDate() + 3);
    deadlines.handover = handoverDate;

    const meetingDate = new Date(aDate);
    meetingDate.setDate(meetingDate.getDate() + 20);
    deadlines.meetingDecide = meetingDate;
  }

  // 2.4 不受理申復提出期限 (不受理通知送達日 + 20天)
  if (d.nonAcceptanceNotice) {
    const date = new Date(d.nonAcceptanceNotice);
    date.setDate(date.getDate() + 20);
    deadlines.nonAcceptanceAppeal = date;
  }

  // 2.5-2 不受理之申復處理期限 (收到不受理申復書日 + 20天)
  if (d.nonAcceptanceAppealReceive) {
    const date = new Date(d.nonAcceptanceAppealReceive);
    date.setDate(date.getDate() + 20);
    deadlines.nonAcceptanceAppealReview = date;
  }

  // 4. 調查結案期限 (受理日 + 2個月 + 延長月份)
  if (d.acceptance) {
    const accDate = new Date(d.acceptance);
    const investDate = new Date(accDate);
    investDate.setMonth(investDate.getMonth() + 2 + (caseData.extensionMonths || 0));
    deadlines.investigation = investDate;
  }

  // 5. 權責機關議處期限 (接獲報告日 + 2個月)
  if (d.reportHandover) {
    const rhDate = new Date(d.reportHandover);
    const decisionDate = new Date(rhDate);
    decisionDate.setMonth(decisionDate.getMonth() + 2);
    deadlines.decision = decisionDate;
  }

  // 6.1 申復提出期限 (處理結果通知送達日 + 30天)
  if (d.resultNotice) {
    const date = new Date(d.resultNotice);
    date.setDate(date.getDate() + 30);
    deadlines.resultAppeal = date;
  }

  // 6.2 申復審議期限 (收到申復書日期 + 30天)
  if (d.appealReceive) {
    const date = new Date(d.appealReceive);
    date.setDate(date.getDate() + 30);
    deadlines.appealReview = date;
  }

  // 6.3 重新調查期限 (重新調查起始日 + 40天)
  if (d.reinvestigationStart) {
    const date = new Date(d.reinvestigationStart);
    date.setDate(date.getDate() + 40);
    deadlines.reinvestigation = date;
  }

  // 7. 提起救濟期限 (申復決定書送達日 + 30天)
  if (d.appealDecisionNotice) {
    const date = new Date(d.appealDecisionNotice);
    date.setDate(date.getDate() + 30);
    deadlines.remedy = date;
  }

  return deadlines;
};
