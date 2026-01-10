
import React, { useState, useRef, useMemo } from 'react';
import { 
  ArrowRight, Info, Clock, Activity, ChevronDown, ChevronUp, Shield, Calendar, Tag, FileText, Plus, Mic, Trash2, CheckCircle, Loader, BookOpen, FileCheck, ClipboardList, UserCheck, Sparkles, Timer, AlertCircle, HelpCircle, Hammer, Scale, Undo2, SearchCheck, CheckCircle2, Gavel, RotateCcw, UserPlus, Zap, Lock
} from 'lucide-react';
import { CaseData, CaseDates, KnowledgeFile, InterviewTranscript, Task } from '../types';
import { PHASES_DATA, getIcon } from '../constants';
import { formatDate, getDeadlineStatus, isValidSequence, DEADLINE_TASK_MAP } from '../utils/dateUtils';
import GeminiAssistant from './GeminiAssistant';
import ProgressBar from './ProgressBar';
import { callGeminiReportGenerator } from '../services/geminiService';

interface CaseDetailProps {
  activeCase: CaseData;
  deadlines: any;
  progressStats: { currentPhase: number, percentage: number };
  globalFiles: KnowledgeFile[];
  onBack: () => void;
  onUpdateActiveCase: (updates: Partial<CaseData>) => void;
  onUpdateDates: (field: keyof CaseDates, value: string) => void;
  onToggleCheck: (taskId: string) => void;
  onUpdateGlobalFiles: (files: KnowledgeFile[]) => void;
}

const CaseDetail: React.FC<CaseDetailProps> = ({
  activeCase,
  deadlines,
  progressStats,
  globalFiles,
  onBack,
  onUpdateActiveCase,
  onUpdateDates,
  onToggleCheck,
  onUpdateGlobalFiles
}) => {
  const [tab, setTab] = useState<'info' | 'report'>('info');
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true, 2: true,
    [progressStats.currentPhase]: true 
  });
  const [showAdvancedDates, setShowAdvancedDates] = useState(false);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const reportTranscriptInputRef = useRef<HTMLInputElement>(null);

  const togglePhase = (id: number) => {
    setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isCaseTerminated = activeCase.decisionStatus === 'not_accepted' && activeCase.filedAppeal === false;
  const isInvestigationUnsubstantiated = activeCase.investigationResult === 'unsubstantiated';
  const LOCKED_TASKS_IF_UNSUBSTANTIATED = ['4.2', '4.3', '4.4', '5.1', '5.2', '5.4'];

  const isTeacherVsStudent = activeCase.incidentRoleType === 'teacher_vs_student';
  const isStudentVsStudent = activeCase.incidentRoleType === 'student_vs_student_middle_up' || activeCase.incidentRoleType === 'student_vs_student_elementary';
  
  // 判定是否為國小生對生樣態
  const isElementaryStudentPerpetrator = activeCase.incidentRoleType === 'student_vs_student_elementary';
  
  // 動態上鎖：國小生對生則 4.3 也上鎖；其餘生對生則鎖 4.4, 5.1, 5.2
  const LOCKED_TASKS_IF_STUDENT_VS_STUDENT = isElementaryStudentPerpetrator 
    ? ['4.3', '4.4', '5.1', '5.2'] 
    : ['4.4', '5.1', '5.2'];

  const isPhase6LockedByNoAppeal = activeCase.phase6AppealStatus === 'none';
  const isPhase6Dismissed = activeCase.phase6AppealStatus === 'filed' && activeCase.phase6AppealResult === 'unsubstantiated';
  const isReinvestigationMode = activeCase.phase6AppealFollowUp === 'reinvestigation';

  const isStatutoryReportDone = activeCase.checklist['1.2'] === true;

  const acceptanceDateError = !isValidSequence(activeCase.dates.known, activeCase.dates.acceptance);
  const resultNoticeError = !isValidSequence(activeCase.dates.reportHandover, activeCase.dates.resultNotice);

  const dynamicPhases = useMemo(() => {
    return PHASES_DATA.map(phase => {
      if (phase.id === 2) {
        const newTasks = [...phase.tasks];
        if (activeCase.decisionStatus === 'not_accepted' && activeCase.filedAppeal) {
          const appealTasks: Task[] = [
            { id: "2.5-1", text: "召開性平會重新議決 (申復處理)", note: "性平法§32-3：學校接獲申復後，應將案件交由性平會重新討論受理事宜。", unit: "性平會", important: true },
            { id: "2.5-2", text: "書面通知申復結果", note: "性平法§32-3：學校應於接獲申復後 20 日內，將申復結果以書面通知申復人。", unit: "性平會", deadlineRef: "nonAcceptanceAppealReview", important: true },
            { id: "2.5-3", text: "啟動調查(若申復有理由)", note: "性平法§32-3：若改為決定受理，性平會應即依法啟動調查程序，並於2個月內完成。", unit: "性平會" }
          ];
          newTasks.push(...appealTasks);
        }
        return { ...phase, tasks: newTasks };
      }

      if (phase.id === 3 && activeCase.investigationMechanism === 'committee_direct') {
        return {
          ...phase,
          title: "第三星軌：性平會直接調查 (簡易程序)",
          tasks: [
            { id: "3.1", text: "調查/會議通知 (含權利告知)", note: "性平法§33、防治準則§23：雖不組小組，仍應秉持客觀公正原則通知當事人配合調查，並告知權益。", unit: "性平會" },
            { id: "3.2", text: "相關事證蒐集與確認", note: "性平法§33：由性平會直接蒐集事證(監視器、書面等)，確認事實是否明確無爭議。", unit: "性平會" },
            { id: "3.3", text: "性平會查證/審議 (取代訪談)", note: "性平法§23：應給予充分陳述意見機會。雖未組小組，仍需經委員會會議實質審議事證。", unit: "性平會", important: true },
            { id: "3.4", text: "查證紀錄確認", note: "防治準則§24：相關訪談或會議紀錄應經確認（應由當事人簽名）。", unit: "性平會" },
            { id: "3.5", text: "保密與檔案處理", note: "性平法§22、防治準則§25-3：密件處理，代號呈現。", unit: "性平會" },
            { id: "3.6", text: "撰寫調查報告 (由性平會完成)", note: "性平法§33、施行細則§17：性平會應撰寫調查報告（含事實認定、理由及處理建議）。", unit: "性平會", important: true, deadlineRef: "investigation" }
          ]
        };
      }

      return phase;
    }).filter(phase => {
      if (phase.id === 6.5) return isReinvestigationMode;
      return true;
    });
  }, [activeCase.decisionStatus, activeCase.filedAppeal, activeCase.investigationMechanism, isReinvestigationMode]);

  const getPhaseTheme = (phaseId: number) => {
    switch (phaseId) {
      case 1: return { border: 'border-sky-200', bg: 'bg-sky-50', text: 'text-sky-600', accent: 'text-sky-600', bgAccent: 'bg-sky-500/5', checkbox: 'text-sky-600 focus:ring-sky-500' };
      case 2: return { border: 'border-teal-200', bg: 'bg-teal-50', text: 'text-teal-600', accent: 'text-teal-600', bgAccent: 'bg-teal-500/5', checkbox: 'text-teal-600 focus:ring-teal-500' };
      case 3:
      case 4: return { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-600', accent: 'text-amber-600', bgAccent: 'bg-amber-500/5', checkbox: 'text-amber-600 focus:ring-amber-500' };
      case 5: return { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-600', accent: 'text-purple-600', bgAccent: 'bg-purple-500/5', checkbox: 'text-purple-600 focus:ring-purple-500' };
      case 6:
      case 6.5: return { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-600', accent: 'text-indigo-600', bgAccent: 'bg-indigo-500/5', checkbox: 'text-indigo-600 focus:ring-indigo-500' };
      default: return { border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-600', accent: 'text-slate-600', bgAccent: 'bg-slate-500/5', checkbox: 'text-slate-600 focus:ring-slate-500' };
    }
  };

  const handleUploadReportTranscript = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newTranscripts: InterviewTranscript[] = [...(activeCase.transcripts || [])];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let text = "";
      if (file.name.endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } catch (err) {
          console.error(`Failed to parse docx: ${file.name}`, err);
          continue;
        }
      } else {
        text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });
      }
      newTranscripts.push({
        id: Date.now().toString() + i + Math.random(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        content: text
      });
    }
    onUpdateActiveCase({ transcripts: newTranscripts });
  };

  const handleGenerateReport = async () => {
    if (!activeCase.transcripts || activeCase.transcripts.length === 0) {
      alert("請先上傳至少一份訪談逐字稿。");
      return;
    }
    setLoadingState('report-generating');
    try {
      const report = await callGeminiReportGenerator(activeCase);
      onUpdateActiveCase({ investigationReport: report || "" });
    } catch (err: any) {
      console.error("Report Generation Error:", err);
      alert(`報告生成失敗：${err.message?.includes("API Key") ? "API 金鑰設定有誤" : "服務暫時不可用"}。請檢查 GitHub Secrets 或控制台。`);
    } finally {
      setLoadingState(null);
    }
  };

  const handleDeleteTranscript = (id: string) => {
    onUpdateActiveCase({ transcripts: activeCase.transcripts.filter(t => t.id !== id) });
  };

  return (
    <div className="animate-fadeIn pb-20 max-w-4xl mx-auto py-10">
      <div className="mb-8 flex justify-between items-center px-4">
        <button 
          onClick={onBack}
          className="flex items-center text-tiffany-deep hover:text-slate-700 transition font-bold group text-base uppercase tracking-widest"
        >
          <ArrowRight className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform rotate-180"/>
          返回案件列表
        </button>
        <div className="flex bg-white/50 p-1 rounded-full border border-tiffany/20 shadow-sm overflow-x-auto no-scrollbar">
          <button onClick={() => setTab('info')} className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'info' ? 'bg-tiffany text-white shadow-md' : 'text-slate-400 hover:text-tiffany-deep'}`}>星軌資訊</button>
          <button onClick={() => setTab('report')} className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'report' ? 'bg-tiffany text-white shadow-md' : 'text-slate-400 hover:text-tiffany-deep'}`}>調查報告</button>
        </div>
      </div>

      {tab === 'info' ? (
        <>
          {/* Fix: Access percentage through progressStats.percentage to resolve 'percentage' is not defined error */}
          <ProgressBar currentPhase={progressStats.currentPhase} percentage={progressStats.percentage} />

          <section className="outer-tiffany-card p-8 md:p-10 mb-10 border-white/50">
            <div className="flex items-center mb-10 border-b border-tiffany/10 pb-6">
              <Info className="w-6 h-6 text-tiffany-deep mr-4" />
              <h2 className="text-2xl font-bold text-slate-700 cinzel">案件守護卷軸 (基本資料)</h2>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[14px] font-bold text-slate-500 uppercase tracking-widest mb-3">案件名稱/代號</label>
                  <input type="text" className="w-full p-4 bg-white/80 border border-tiffany/10 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={activeCase.name} onChange={(e) => onUpdateActiveCase({ name: e.target.value })} placeholder="輸入案件編號..." />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-slate-500 uppercase tracking-widest mb-3">事件性質</label>
                  <select className="w-full p-4 bg-white/80 border border-tiffany/10 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={activeCase.incidentType} onChange={(e: any) => onUpdateActiveCase({ incidentType: e.target.value })}>
                    <option value="sexual_harassment">疑似性騷擾</option>
                    <option value="sexual_assault">疑似性侵害</option>
                    <option value="sexual_bullying">疑似性霸凌</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[14px] font-bold text-slate-500 uppercase tracking-widest mb-3">事件樣態</label>
                  <select className="w-full p-4 bg-white/80 border border-tiffany/10 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={activeCase.incidentRoleType} onChange={(e: any) => onUpdateActiveCase({ incidentRoleType: e.target.value })}>
                    <option value="teacher_vs_student">師對生</option>
                    <option value="student_vs_student_middle_up">生對生(行為人國中以上)</option>
                    <option value="student_vs_student_elementary">生對生(行為人國小)</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                   <div className="bg-white/50 p-4 rounded-2xl flex items-center gap-6 border border-white w-full">
                    <span className="text-[14px] font-black text-tiffany-deep uppercase tracking-widest">案件管道</span>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={activeCase.hasApplication} onChange={() => onUpdateActiveCase({ hasApplication: true })} className="w-4 h-4 text-tiffany-deep focus:ring-tiffany"/>
                        <span className="text-[14px] font-bold text-slate-600">申請</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={!activeCase.hasApplication} onChange={() => onUpdateActiveCase({ hasApplication: false })} className="w-4 h-4 text-tiffany-deep focus:ring-tiffany"/>
                        <span className="text-[14px] font-bold text-slate-600">檢舉/知悉</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[14px] font-bold text-sky-600 uppercase tracking-widest mb-3">1.1 獲知日期 (知悉日)</label>
                  <input type="date" className="w-full p-4 bg-white/80 border border-sky-100 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={activeCase.dates.known} onChange={(e) => onUpdateDates('known', e.target.value)} />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-teal-600 uppercase tracking-widest mb-3">2.1 收件日期 (申請書)</label>
                  <input type="date" className="w-full p-4 bg-white/80 border border-teal-100 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={activeCase.dates.application} onChange={(e) => onUpdateDates('application', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <label className={`block text-[14px] font-bold uppercase tracking-widest mb-3 ${acceptanceDateError ? 'text-red-500' : 'text-teal-600'}`}>2.3 性平會決議受理日</label>
                  <input 
                    type="date" 
                    className={`w-full p-4 bg-white/80 border rounded-2xl outline-none font-bold text-slate-700 shadow-sm transition-all ${acceptanceDateError ? 'border-red-400 ring-2 ring-red-100' : 'border-teal-100'}`} 
                    value={activeCase.dates.acceptance} 
                    onChange={(e) => onUpdateDates('acceptance', e.target.value)} 
                  />
                  {acceptanceDateError && <p className="text-[10px] text-red-500 font-bold mt-1 absolute">✦ 警告：受理日不得早於知悉日</p>}
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-amber-600 uppercase tracking-widest mb-3">4.1 性平報告審核完成日</label>
                  <input type="date" className="w-full p-4 bg-white/80 border border-amber-100 rounded-2xl outline-none font-bold text-slate-700 shadow-sm" value={activeCase.dates.reportHandover} onChange={(e) => onUpdateDates('reportHandover', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <label className={`block text-[14px] font-bold uppercase tracking-widest mb-3 ${resultNoticeError ? 'text-red-500' : 'text-purple-600'}`}>5.3 處理結果通知送達日</label>
                  <input 
                    type="date" 
                    className={`w-full p-4 bg-white/80 border rounded-2xl outline-none font-bold text-slate-700 shadow-sm transition-all ${resultNoticeError ? 'border-red-400 ring-2 ring-red-100' : 'border-purple-100'}`} 
                    value={activeCase.dates.resultNotice} 
                    onChange={(e) => onUpdateDates('resultNotice', e.target.value)} 
                  />
                  {resultNoticeError && <p className="text-[10px] text-red-500 font-bold mt-1 absolute">✦ 警告：通知日不得早於報告審核日</p>}
                </div>
                <div className="flex flex-col">
                  <label className="block text-[14px] font-bold text-amber-600 uppercase tracking-widest mb-3">案件延長 (影響調查時效)</label>
                  <div className="grid grid-cols-3 gap-2 h-full">
                    {[
                      { label: '無延長', value: 0 },
                      { label: '延長 1 個月', value: 1 },
                      { label: '延長 2 個月', value: 2 }
                    ].map(opt => (
                      <button key={opt.value} onClick={() => onUpdateActiveCase({ extensionMonths: opt.value })} className={`flex items-center justify-center px-2 py-4 rounded-2xl border font-bold text-[12px] transition-all ${activeCase.extensionMonths === opt.value ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'bg-white/50 text-amber-400 border-amber-100 hover:bg-amber-50'}`}>
                        <Timer className={`w-3 h-3 mr-2 ${activeCase.extensionMonths === opt.value ? 'text-white' : 'text-amber-400'}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-tiffany/10">
                <button onClick={() => setShowAdvancedDates(!showAdvancedDates)} className="flex items-center justify-between w-full text-tiffany-deep hover:text-slate-700 transition">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5" />
                    <span className="text-sm font-bold tracking-widest">進階日期追蹤 (申復、議處、救濟、重查)</span>
                  </div>
                  {showAdvancedDates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showAdvancedDates && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fadeIn">
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-teal-400">
                      <label className="block text-[14px] font-bold text-teal-600 uppercase tracking-widest mb-3">2.4 不受理通知送達日</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-teal-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm" value={activeCase.dates.nonAcceptanceNotice} onChange={(e) => onUpdateDates('nonAcceptanceNotice', e.target.value)} />
                    </div>
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-teal-400">
                      <label className="block text-[14px] font-bold text-teal-600 uppercase tracking-widest mb-3">2.5 收到不受理申復書日期</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-teal-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm" value={activeCase.dates.nonAcceptanceAppealReceive} onChange={(e) => onUpdateDates('nonAcceptanceAppealReceive', e.target.value)} />
                    </div>
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-indigo-400">
                      <label className="block text-[14px] font-bold text-indigo-600 uppercase tracking-widest mb-3">6.1 收到申復書日期</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-indigo-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm" value={activeCase.dates.appealReceive} onChange={(e) => onUpdateDates('appealReceive', e.target.value)} />
                    </div>
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-indigo-400">
                      <label className="block text-[14px] font-bold text-indigo-600 uppercase tracking-widest mb-3">6.3 重新調查起始日</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-indigo-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm" value={activeCase.dates.reinvestigationStart} onChange={(e) => onUpdateDates('reinvestigationStart', e.target.value)} />
                    </div>
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-indigo-400">
                      <label className="block text-[14px] font-bold text-indigo-600 uppercase tracking-widest mb-3">6.4 申復決定書送達日</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-indigo-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm" value={activeCase.dates.appealDecisionNotice} onChange={(e) => onUpdateDates('appealDecisionNotice', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {activeCase.dates.known && (
            <section className="bg-slate-700 rounded-[2rem] shadow-xl overflow-hidden mb-10 text-white">
              <div className="bg-slate-800/50 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-tiffany" />
                  <h3 className="font-bold tracking-widest text-sm uppercase">永恆時光沙漏 (法定時效檢核)</h3>
                </div>
                <span className="text-[12px] bg-tiffany/20 text-tiffany px-3 py-1 rounded-full font-bold uppercase">Statutory Deadlines</span>
              </div>
              <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: '1.2 法定通報期限', key: 'report', color: 'border-sky-400' },
                  { label: '2.2 受理審查期限', key: 'handover', color: 'border-teal-400' },
                  { label: '2.4 受理通知期限', key: 'meetingDecide', color: 'border-teal-400' },
                  { label: '2.4 不受理申復期限', key: 'nonAcceptanceAppeal', color: 'border-teal-400' },
                  { label: '2.5-2 申復處理期限', key: 'nonAcceptanceAppealReview', color: 'border-teal-400' },
                  { label: '3.7 調查結案期限', key: 'investigation', color: 'border-amber-400' },
                  { label: '5.3 書面通知處理結果', key: 'decision', color: 'border-purple-400' },
                  { label: '6.1 申復提出期限', key: 'resultAppeal', color: 'border-indigo-400' },
                  { label: '6.2 申復審議期限', key: 'appealReview', color: 'border-indigo-400' },
                  { label: '6.3 重新調查期限', key: 'reinvestigation', color: 'border-indigo-400' },
                  { label: '6.4 提起救濟期限', key: 'remedy', color: 'border-indigo-400' }
                ].filter(item => !!deadlines[item.key]).map(item => {
                  const taskId = DEADLINE_TASK_MAP[item.key];
                  const isCompleted = activeCase.checklist?.[taskId] || false;
                  const status = getDeadlineStatus(deadlines[item.key], isCompleted);
                  const isNA = false;

                  return (
                    <div key={item.key} className={`p-5 rounded-2xl bg-white/5 border-l-4 transition-all ${
                      isCompleted ? 'border-green-400 bg-green-400/5' : 
                      isNA ? 'border-slate-500 opacity-40' : 
                      status === 'overdue' ? 'border-red-400 bg-red-400/10' :
                      status === 'warning' ? 'border-yellow-400 bg-yellow-400/10 animate-pulse ring-4 ring-yellow-400/20' :
                      item.color
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className={`text-[14px] font-black uppercase tracking-widest ${
                          status === 'warning' ? 'text-yellow-400' : 'text-slate-400'
                        }`}>{item.label}</div>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {status === 'warning' && !isCompleted && <AlertCircle className="w-4 h-4 text-yellow-400 animate-bounce" />}
                      </div>
                      <div className={`text-base font-bold ${
                        status === 'overdue' ? 'text-red-400' : 
                        status === 'warning' ? 'text-yellow-400' :
                        isCompleted ? 'text-green-400' : 
                        isNA ? 'text-slate-500' : 'text-white'
                      }`}>
                        {isNA ? '不適用 (特殊樣態)' : formatDate(deadlines[item.key]).split(' ')[0]}
                      </div>
                      {isCompleted ? (
                        <div className="text-[14px] text-green-400/60 font-bold mt-1 uppercase">任務 {taskId} 已完成</div>
                      ) : status === 'warning' ? (
                        <div className="text-[11px] text-yellow-400 font-bold mt-1 uppercase">✦ 倒數 3 日・預警色標</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <GeminiAssistant activeCase={activeCase} globalFiles={globalFiles} onUpdateCase={onUpdateActiveCase} onUpdateGlobalFiles={onUpdateGlobalFiles} />

          <div className="mt-16 space-y-6">
            <h2 className="text-xl font-bold text-slate-700 flex items-center px-4 mb-8 cinzel">
              <Activity className="w-6 h-6 mr-3 text-tiffany-deep" />
              外部戰士・時空星軌合規檢核表
            </h2>
            {dynamicPhases.map(phase => {
              const isExpanded = !!expandedPhases[phase.id];
              const completedCount = phase.tasks.filter(t => activeCase.checklist?.[t.id]).length;
              const theme = getPhaseTheme(phase.id);
              
              const isPhaseTerminated = isCaseTerminated && phase.id >= 3;
              const isPhaseLocked = isPhaseTerminated;
              const isOrbit6Disabled = isPhase6LockedByNoAppeal && phase.id === 6;

              return (
                <div key={phase.id} className={`rounded-[2rem] border-2 transition-all duration-500 ${isExpanded ? `shadow-lg ${theme.border}` : 'border-white'} bg-white overflow-hidden ${isPhaseLocked ? 'grayscale opacity-50 pointer-events-none cursor-not-allowed' : ''}`}>
                  <button onClick={() => !isPhaseLocked && togglePhase(phase.id)} className={`w-full px-8 py-6 flex items-center justify-between text-left transition-colors ${isExpanded ? theme.bg : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-white rounded-2xl shadow-sm border ${isExpanded ? theme.border : 'border-slate-100'}`}>{getIcon(phase.iconName, isExpanded ? theme.accent : undefined)}</div>
                      <div>
                        <h3 className={`font-bold text-slate-700 text-base ${isExpanded ? theme.text : ''}`}>
                          {phase.title} 
                          {isPhaseTerminated && " (案件已結案/鎖定)"}
                          {isOrbit6Disabled && " (全案確定/鎖定)"}
                        </h3>
                        <div className={`text-[14px] font-black mt-1 uppercase tracking-widest ${isExpanded ? theme.text : 'text-slate-400'}`}>完成度：{completedCount} / {phase.tasks.length}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? `rotate-180 ${theme.text}` : 'text-slate-300'}`} />
                  </button>
                  {isExpanded && !isPhaseLocked && (
                    <div className="p-8 space-y-6 animate-fadeIn bg-white/50">
                      {phase.tasks.map(task => {
                        const isTaskLockedByUnsubstantiated = isInvestigationUnsubstantiated && LOCKED_TASKS_IF_UNSUBSTANTIATED.includes(task.id);
                        const isTaskLockedByStudentVsStudent = isStudentVsStudent && LOCKED_TASKS_IF_STUDENT_VS_STUDENT.includes(task.id);
                        const isTaskLockedByNoAppeal = isPhase6LockedByNoAppeal && phase.id === 6 && task.id !== "6.1";
                        const isTaskLockedByDismissal = isPhase6Dismissed && task.id === "6.3";
                        const isTaskLockedByReinvestigation = isReinvestigationMode && task.id === "6.4";
                        const isTaskLockedByStatutoryReport = !isStatutoryReportDone && task.id === "2.3";

                        const isCurrentlyLocked = isTaskLockedByUnsubstantiated || isTaskLockedByNoAppeal || isTaskLockedByReinvestigation || isTaskLockedByStudentVsStudent || isTaskLockedByStatutoryReport || (isTaskLockedByDismissal && !activeCase.phase6AppealResult);

                        const deadlineRef = task.deadlineRef;
                        const status = deadlineRef ? getDeadlineStatus(deadlines[deadlineRef], activeCase.checklist[task.id]) : 'ok';

                        return (
                          <div key={task.id} className={`flex flex-col gap-4 p-5 rounded-2xl border border-transparent transition-all ${activeCase.checklist?.[task.id] ? `${theme.bg} opacity-60` : 'hover:border-slate-100 hover:bg-white'} ${isCurrentlyLocked ? 'grayscale opacity-40 pointer-events-none' : ''}`}>
                            <div className="flex items-start gap-5">
                              <input 
                                type="checkbox" 
                                checked={activeCase.checklist?.[task.id] || false} 
                                onChange={() => onToggleCheck(task.id)} 
                                className={`mt-1.5 h-6 w-6 rounded-lg border-slate-200 cursor-pointer transition-all ${theme.checkbox}`} 
                              />
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  <span className={`text-[12px] font-bold bg-white border px-2 py-0.5 rounded-full transition-all ${
                                    status === 'warning' ? 'border-yellow-400 text-yellow-500 animate-pulse ring-4 ring-yellow-400/20 bg-yellow-50' : 
                                    status === 'overdue' ? 'border-red-400 text-red-500 bg-red-50' :
                                    `${theme.border} ${theme.text}`
                                  }`}>{task.id}</span>
                                  
                                  <span className={`font-bold text-base ${task.important ? 'text-red-500' : 'text-slate-700'} ${activeCase.checklist?.[task.id] ? 'line-through opacity-40' : ''}`}>
                                    {task.text} 
                                    {isTaskLockedByUnsubstantiated && " (不成立故鎖定)"}
                                    {isTaskLockedByStudentVsStudent && " (行為人國小生案件不適用移送議處程序)"}
                                    {isTaskLockedByNoAppeal && " (全案確定故鎖定)"}
                                    {isTaskLockedByDismissal && task.id === "6.3" && " (申復駁回故鎖定)"}
                                    {isTaskLockedByReinvestigation && " (重新調查中，暫停救濟程序)"}
                                    {isTaskLockedByStatutoryReport && " (⚠ 請先完成 1.2 法定通報以解鎖)"}
                                  </span>
                                  
                                  {task.unit && <span className={`text-[14px] bg-white border px-3 py-0.5 rounded-full font-bold ${theme.border} ${theme.text} opacity-70`}>{task.unit}</span>}
                                  {task.important && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">① 重要</span>}
                                  {status === 'warning' && !activeCase.checklist[task.id] && <span className="text-[10px] bg-yellow-400 text-white px-3 py-0.5 rounded-full font-bold animate-pulse shadow-sm ring-2 ring-yellow-200">⚠ 3日內截止</span>}
                                </div>
                                {task.note && <p className={`text-[14px] text-slate-400 leading-relaxed mt-3 border-l-2 pl-4 whitespace-pre-wrap ${theme.border}`}>{task.note}</p>}
                              </div>
                            </div>

                            {task.id === "2.4" && (
                              <div className="ml-11 mt-4 p-6 bg-white/60 border border-teal-100 rounded-3xl space-y-6">
                                <div>
                                  <label className="text-[12px] font-black text-teal-600 uppercase tracking-widest mb-4 block flex items-center">
                                    <Shield className="w-4 h-4 mr-2"/> 受理決定判定
                                  </label>
                                  <div className="flex gap-4">
                                    {[{ id: 'accepted', label: '決定受理 (啟動調查)' }, { id: 'not_accepted', label: '不予受理' }].map(opt => (
                                      <button key={opt.id} onClick={() => onUpdateActiveCase({ decisionStatus: opt.id as any })} className={`px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${activeCase.decisionStatus === opt.id ? 'bg-teal-500 text-white border-teal-500 shadow-lg' : 'bg-white text-slate-400 border-teal-50 hover:bg-teal-50'}`}>{opt.label}</button>
                                    ))}
                                  </div>
                                </div>

                                {activeCase.decisionStatus === 'accepted' && (
                                  <div className="pt-6 border-t border-teal-50 animate-fadeIn space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                                      <div className="flex-1">
                                        <label className="text-[12px] font-black text-sky-600 uppercase tracking-widest mb-4 block flex items-center">
                                          <Zap className="w-4 h-4 mr-2"/> 調查機制選擇
                                        </label>
                                        <div className="flex gap-4">
                                          {[
                                            { id: 'investigation_team', label: '組成調查小組', icon: <UserPlus className="w-4 h-4" />, disabled: false },
                                            { id: 'committee_direct', label: '性平會直接調查 (簡易)', icon: <CheckCircle className="w-4 h-4" />, disabled: isTeacherVsStudent }
                                          ].map(opt => {
                                            const isSelected = activeCase.investigationMechanism === opt.id;
                                            return (
                                              <button
                                                key={opt.id}
                                                disabled={opt.disabled}
                                                onClick={() => !opt.disabled && onUpdateActiveCase({ investigationMechanism: opt.id as any })}
                                                className={`px-6 py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 relative ${
                                                  isSelected 
                                                    ? 'bg-sky-500 text-white border-sky-500 shadow-lg' 
                                                    : opt.disabled 
                                                      ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60' 
                                                      : 'bg-white text-slate-400 border-sky-50 hover:bg-sky-50'
                                                }`}
                                              >
                                                {opt.disabled ? <Lock className="w-4 h-4" /> : opt.icon}
                                                {opt.label}
                                                {opt.disabled && (
                                                  <span className="absolute -top-3 -right-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full shadow-sm">師對生案不適用</span>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-sm">
                                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed italic">
                                          ✦ 備註說明：<br/>
                                          *依性平法§33：涉教職員工案件（師對生案件）應組成調查小組且全數外聘。<br/>
                                          *僅限「事實清楚且雙方無異議」且「非教職員工案」才可選擇直接調查。
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeCase.decisionStatus === 'not_accepted' && (
                                  <div className="pt-6 border-t border-teal-50 animate-fadeIn">
                                    <label className="text-[12px] font-black text-orange-500 uppercase tracking-widest mb-4 block flex items-center"><HelpCircle className="w-4 h-4 mr-2"/> 申復支線：申請人是否提出申復？</label>
                                    <div className="flex gap-4">
                                      <button onClick={() => onUpdateActiveCase({ filedAppeal: true })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${activeCase.filedAppeal ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-white text-slate-400 border-orange-50 hover:bg-orange-50'}`}>{activeCase.filedAppeal && <CheckCircle className="w-4 h-4" />}有提出申復</button>
                                      <button onClick={() => onUpdateActiveCase({ filedAppeal: false })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${activeCase.filedAppeal === false ? 'bg-slate-500 text-white border-slate-500 shadow-lg' : 'bg-white text-slate-400 border-orange-50 hover:bg-orange-50'}`}>無提出申復 (結案)</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {(task.id === "4.1") && (
                              <div className="ml-11 mt-4 p-6 bg-white/60 border border-amber-100 rounded-3xl space-y-4">
                                <label className="text-[12px] font-black text-amber-600 uppercase tracking-widest mb-2 block flex items-center"><Hammer className="w-4 h-4 mr-2"/> 調查報告事實認定判定</label>
                                <div className="flex gap-4">
                                  {[{ id: 'substantiated', label: '成立 (屬實)' }, { id: 'unsubstantiated', label: '不成立' }].map(opt => (
                                    <button key={opt.id} onClick={() => onUpdateActiveCase({ investigationResult: opt.id as any })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${activeCase.investigationResult === opt.id ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-slate-400 border-amber-50 hover:bg-amber-50'}`}>{opt.label}</button>
                                  ))}
                                </div>
                                {isInvestigationUnsubstantiated && <p className="text-[11px] text-amber-600 font-bold italic mt-2">✦ 偵測到調查不成立。後續懲處與執行任務已鎖定。</p>}
                              </div>
                            )}

                            {task.id === "6.1" && (
                              <div className="ml-11 mt-4 p-6 bg-white/60 border border-indigo-100 rounded-3xl space-y-6">
                                <div>
                                  <label className="text-[12px] font-black text-indigo-600 uppercase tracking-widest mb-4 block flex items-center"><Scale className="w-4 h-4 mr-2"/> 申復提出決策</label>
                                  <div className="flex gap-4">
                                    <button onClick={() => onUpdateActiveCase({ phase6AppealStatus: 'filed' })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${activeCase.phase6AppealStatus === 'filed' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'bg-white text-slate-400 border-indigo-50 hover:bg-indigo-50'}`}>{activeCase.phase6AppealStatus === 'filed' && <CheckCircle className="w-4 h-4" />}提出申復</button>
                                    <button onClick={() => onUpdateActiveCase({ phase6AppealStatus: 'none' })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-2 ${activeCase.phase6AppealStatus === 'none' ? 'bg-slate-700 text-white border-slate-700 shadow-lg' : 'bg-white text-slate-400 border-indigo-50 hover:bg-indigo-50'}`}>{activeCase.phase6AppealStatus === 'none' && <CheckCircle2 className="w-4 h-4" />}無申復 (全案確定)</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {task.id === "6.3" && activeCase.phase6AppealStatus === 'filed' && (
                              <div className="ml-11 mt-4 p-6 bg-white/60 border border-indigo-100 rounded-3xl space-y-10 animate-fadeIn">
                                <div className="space-y-6">
                                  <label className="text-[12px] font-black text-indigo-600 uppercase tracking-widest mb-4 block flex items-center"><SearchCheck className="w-4 h-4 mr-2"/> 6.3-1 申復審議結果</label>
                                  <div className="flex gap-4">
                                    <button onClick={() => onUpdateActiveCase({ phase6AppealResult: 'substantiated' })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${activeCase.phase6AppealResult === 'substantiated' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'bg-white text-slate-400 border-indigo-50 hover:bg-indigo-50'}`}>有理由 (成立)</button>
                                    <button onClick={() => onUpdateActiveCase({ phase6AppealResult: 'unsubstantiated' })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${activeCase.phase6AppealResult === 'unsubstantiated' ? 'bg-slate-700 text-white border-slate-700 shadow-lg' : 'bg-white text-slate-400 border-indigo-50 hover:bg-indigo-50'}`}>無理由 (駁回)</button>
                                  </div>
                                </div>
                                {activeCase.phase6AppealResult === 'substantiated' && (
                                  <div className="pt-8 border-t border-indigo-50 space-y-6 animate-fadeIn">
                                    <label className="text-[12px] font-black text-indigo-600 uppercase tracking-widest mb-4 block flex items-center"><Undo2 className="w-4 h-4 mr-2"/> 6.3-2 後續處理方式</label>
                                    <div className="flex gap-4">
                                      <button onClick={() => onUpdateActiveCase({ phase6AppealFollowUp: 'redetermination' })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${activeCase.phase6AppealFollowUp === 'redetermination' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'bg-white text-slate-400 border-indigo-50 hover:bg-indigo-50'}`}>重為決定 (免重查)</button>
                                      <button onClick={() => onUpdateActiveCase({ phase6AppealFollowUp: 'reinvestigation' })} className={`px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${activeCase.phase6AppealFollowUp === 'reinvestigation' ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-white text-slate-400 border-indigo-50 hover:bg-indigo-50'}`}>重新調查 (40日)</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="animate-fadeIn space-y-12">
          <div className="flex justify-between items-center px-4">
            <div><h2 className="text-2xl font-bold text-slate-700 cinzel">真理審判卷</h2><p className="text-[12px] text-tiffany-deep font-bold uppercase tracking-[0.3em] mt-1">Final Investigation Scroll</p></div>
            <button onClick={() => reportTranscriptInputRef.current?.click()} className="px-8 py-3 btn-outer-senshi rounded-full font-bold text-sm uppercase tracking-widest flex items-center"><Plus className="w-4 h-4 mr-2"/> 匯入訪談逐字稿</button>
            <input type="file" ref={reportTranscriptInputRef} onChange={handleUploadReportTranscript} accept=".txt,.md,.docx" multiple className="hidden" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-8">
              <div className="space-y-6">
                <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2"><Hammer className="w-5 h-5 mr-2 text-tiffany"/> 事實認定預設方向</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'substantiated', label: '預設：成立 (屬實)', color: 'bg-amber-500', hover: 'hover:bg-amber-600' },
                    { id: 'unsubstantiated', label: '預設：不成立', color: 'bg-slate-700', hover: 'hover:bg-slate-800' },
                    { id: 'pending', label: '交由 AI 判斷', color: 'bg-teal-500', hover: 'hover:bg-teal-600' }
                  ].map(opt => (
                    <button 
                      key={opt.id} 
                      onClick={() => onUpdateActiveCase({ investigationResult: opt.id as any })} 
                      className={`py-3 px-6 rounded-2xl border-2 font-bold text-sm transition-all flex items-center justify-between ${
                        activeCase.investigationResult === opt.id 
                          ? `${opt.color} text-white border-transparent shadow-lg scale-[1.02]` 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-tiffany/30'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {activeCase.investigationResult === opt.id && <CheckCircle className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2"><UserCheck className="w-5 h-5 mr-2 text-tiffany"/> 已匯入之證詞 ({activeCase.transcripts?.length || 0})</h3>
                <div className="space-y-4">{(!activeCase.transcripts || activeCase.transcripts.length === 0) ? (<div className="p-10 border-2 border-dashed border-tiffany/10 rounded-3xl text-center"><p className="text-sm text-tiffany/30 font-bold uppercase tracking-widest">尚無訪談資料</p></div>) : (activeCase.transcripts.map(t => (<div key={t.id} className="p-5 bg-white/60 border border-tiffany/10 rounded-2xl flex justify-between items-center pearl-shadow hover:border-tiffany transition-all"><div className="flex items-center gap-3 truncate"><div className="p-2 bg-tiffany/10 rounded-lg"><FileCheck className="w-4 h-4 text-tiffany-deep" /></div><span className="text-base font-bold text-slate-600 truncate">{t.name}</span></div><button onClick={() => handleDeleteTranscript(t.id)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5"/></button></div>)))}</div>
                <button 
                  onClick={handleGenerateReport} 
                  disabled={loadingState === 'report-generating' || !activeCase.transcripts?.length} 
                  className="w-full py-5 btn-outer-senshi rounded-full font-bold text-base tracking-[0.2em] uppercase disabled:opacity-30 flex items-center justify-center mt-8 shadow-lg active:scale-95 transition-all"
                >
                  {loadingState === 'report-generating' ? <Loader className="w-6 h-6 mr-3 animate-spin"/> : <Sparkles className="w-6 h-6 mr-3" />}
                  {loadingState === 'report-generating' ? '審理生成中...' : '✦ 一鍵草擬調查報告'}
                </button>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2"><ClipboardList className="w-5 h-5 mr-2 text-tiffany"/> 調查報告草案實錄</h3>
              <div className="outer-tiffany-card overflow-hidden"><textarea className="w-full p-8 bg-white/40 text-base leading-relaxed text-slate-600 min-h-[600px] focus:bg-white outline-none border-none resize-none font-medium" value={activeCase.investigationReport} onChange={(e) => onUpdateActiveCase({ investigationReport: e.target.value })} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
