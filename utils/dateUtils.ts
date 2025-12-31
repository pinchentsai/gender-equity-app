
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

export const isOverdue = (targetDate: Date | string | undefined) => {
  if (!targetDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return today > target;
};

export const calculateDeadlines = (caseData: Partial<CaseData>) => {
  if (!caseData || !caseData.dates) return {} as any;
  const d = caseData.dates;
  const deadlines: any = {};

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

  if (caseData.hasApplication && d.application) {
    const aDate = new Date(d.application);
    const handoverDate = new Date(aDate);
    handoverDate.setDate(handoverDate.getDate() + 3);
    deadlines.handover = handoverDate;

    const meetingDate = new Date(aDate);
    meetingDate.setDate(meetingDate.getDate() + 20);
    deadlines.meetingDecide = meetingDate;
  }

  if (d.acceptance) {
    const accDate = new Date(d.acceptance);
    const investDate = new Date(accDate);
    investDate.setMonth(investDate.getMonth() + 2);
    deadlines.investigation = investDate;
  }

  return deadlines;
};
