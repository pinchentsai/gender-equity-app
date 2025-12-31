
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
 * 判定是否逾時
 * @param targetDate 截止日期
 * @param isCompleted 是否已勾選對應任務
 */
export const isOverdue = (targetDate: Date | string | undefined, isCompleted: boolean = false) => {
  if (!targetDate || isCompleted) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return today > target;
};

// 時效鍵值與任務 ID 的對應表
export const DEADLINE_TASK_MAP: Record<string, string> = {
  report: "1.2",
  handover: "2.3",
  meetingDecide: "2.4",
  investigation: "3.7",
  resultAppeal: "6.1",
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

  // 4. 調查結案期限 (受理日 + 2個月)
  if (d.acceptance) {
    const accDate = new Date(d.acceptance);
    const investDate = new Date(accDate);
    investDate.setMonth(investDate.getMonth() + 2);
    deadlines.investigation = investDate;
  }

  // 5. 申復期限 (處理結果通知送達日 + 30天)
  if (d.resultNotice) {
    const date = new Date(d.resultNotice);
    date.setDate(date.getDate() + 30);
    deadlines.resultAppeal = date;
  }

  // 6. 提起救濟期限 (申復決定書送達日 + 30天)
  if (d.appealDecisionNotice) {
    const date = new Date(d.appealDecisionNotice);
    date.setDate(date.getDate() + 30);
    deadlines.remedy = date;
  }

  return deadlines;
};
