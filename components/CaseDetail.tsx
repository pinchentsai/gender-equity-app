
import React, { useState, useRef } from 'react';
import { 
  ArrowRight, Info, Clock, Activity, ChevronDown, ChevronUp, Shield, Calendar, Tag, FileText, Plus, Mic, Trash2, CheckCircle, Loader, BookOpen, FileCheck, ClipboardList, UserCheck, Sparkles
} from 'lucide-react';
import { CaseData, CaseDates, KnowledgeFile, Meeting, InterviewTranscript } from '../types';
import { PHASES_DATA, getIcon } from '../constants';
import { formatDate, isOverdue, DEADLINE_TASK_MAP } from '../utils/dateUtils';
import GeminiAssistant from './GeminiAssistant';
import ProgressBar from './ProgressBar';
import { callGeminiMeetingAssistant, callGeminiReportGenerator } from '../services/geminiService';

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
  const [tab, setTab] = useState<'info' | 'meetings' | 'report'>('info');
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true, 2: true,
    [progressStats.currentPhase]: true 
  });
  const [showAdvancedDates, setShowAdvancedDates] = useState(false);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const reportTranscriptInputRef = useRef<HTMLInputElement>(null);
  const [targetMeetingId, setTargetMeetingId] = useState<string | null>(null);

  const togglePhase = (id: number) => {
    setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateMeeting = () => {
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title: `第 ${(activeCase.meetings?.length || 0) + 1} 次星軌會議`,
      phaseId: progressStats.currentPhase,
      agenda: '',
      minutes: ''
    };
    onUpdateActiveCase({ meetings: [newMeeting, ...(activeCase.meetings || [])] });
  };

  const handleDraftAgenda = async (meeting: Meeting) => {
    setLoadingState(meeting.id + '-agenda');
    try {
      const phase = PHASES_DATA.find(p => p.id === meeting.phaseId);
      const agenda = await callGeminiMeetingAssistant('agenda', {
        caseName: activeCase.name,
        description: activeCase.description,
        phaseTitle: phase?.title || "未知階段",
        meetingTitle: meeting.title
      });
      const updated = activeCase.meetings.map(m => m.id === meeting.id ? { ...m, agenda: agenda || "" } : m);
      onUpdateActiveCase({ meetings: updated });
    } catch (err) {
      console.error("Agenda generation error:", err);
      alert("時空通訊中斷，無法草擬議程。");
    } finally {
      setLoadingState(null);
    }
  };

  const handleUploadRecording = async (e: React.ChangeEvent<HTMLInputElement>, meetingId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const updated = activeCase.meetings.map(m => 
        m.id === meetingId ? { ...m, recordingData: base64, recordingMimeType: file.type } : m
      );
      onUpdateActiveCase({ meetings: updated });
    };
  };

  const handleUploadTranscript = async (e: React.ChangeEvent<HTMLInputElement>, meetingId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let text = "";
    if (file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } catch (err) {
        alert("Word 檔案解析失敗。");
        return;
      }
    } else {
      text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(file);
      });
    }

    const updated = activeCase.meetings.map(m => 
      m.id === meetingId ? { ...m, transcript: text } : m
    );
    onUpdateActiveCase({ meetings: updated });
  };

  const handleGenerateMinutes = async (meeting: Meeting) => {
    if (!meeting.recordingData && !meeting.transcript) {
      alert("請先提供錄音檔或逐字稿。");
      return;
    }
    setLoadingState(meeting.id + '-minutes');
    try {
      const minutes = await callGeminiMeetingAssistant('minutes', {
        caseName: activeCase.name,
        description: activeCase.description,
        phaseTitle: "",
        meetingTitle: meeting.title,
        agenda: meeting.agenda,
        recordingData: meeting.recordingData,
        recordingMimeType: meeting.recordingMimeType,
        transcript: meeting.transcript
      });
      const updated = activeCase.meetings.map(m => m.id === meeting.id ? { ...m, minutes: minutes || "" } : m);
      onUpdateActiveCase({ meetings: updated });
    } catch (err) {
      console.error("Minutes generation error:", err);
      alert("轉錄解析失敗。");
    } finally {
      setLoadingState(null);
    }
  };

  const handleDeleteMeeting = (id: string) => {
    if (!window.confirm("確定要刪除此會議紀錄嗎？")) return;
    onUpdateActiveCase({ meetings: activeCase.meetings.filter(m => m.id !== id) });
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
    console.debug("啟動調查報告生成，案名:", activeCase.name);
    
    try {
      const report = await callGeminiReportGenerator(activeCase);
      onUpdateActiveCase({ investigationReport: report || "" });
      console.debug("報告生成完成");
    } catch (err) {
      console.error("Report Generation Error:", err);
      alert("報告生成失敗，請檢查網路連線或 API 金鑰權限。");
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
          className="flex items-center text-tiffany-deep hover:text-slate-700 transition font-bold group text-sm uppercase tracking-widest"
        >
          <ArrowRight className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform rotate-180"/>
          返回案件列表
        </button>
        <div className="flex bg-white/50 p-1 rounded-full border border-tiffany/20 shadow-sm overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setTab('info')}
            className={`px-6 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'info' ? 'bg-tiffany text-white shadow-md' : 'text-slate-400 hover:text-tiffany-deep'}`}
          >
            星軌資訊
          </button>
          <button 
            onClick={() => setTab('meetings')}
            className={`px-6 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'meetings' ? 'bg-tiffany text-white shadow-md' : 'text-slate-400 hover:text-tiffany-deep'}`}
          >
            會議紀錄 ({activeCase.meetings?.length || 0})
          </button>
          <button 
            onClick={() => setTab('report')}
            className={`px-6 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${tab === 'report' ? 'bg-tiffany text-white shadow-md' : 'text-slate-400 hover:text-tiffany-deep'}`}
          >
            調查報告
          </button>
        </div>
      </div>

      {tab === 'info' ? (
        <>
          <ProgressBar 
            currentPhase={progressStats.currentPhase} 
            percentage={progressStats.percentage} 
          />

          <section className="outer-tiffany-card p-8 md:p-10 mb-10 border-white/50">
            <div className="flex items-center mb-10 border-b border-tiffany/10 pb-6">
              <Info className="w-6 h-6 text-tiffany-deep mr-4" />
              <h2 className="text-2xl font-bold text-slate-700 cinzel">
                案件守護卷軸 (基本資料)
              </h2>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[14px] font-bold text-slate-500 uppercase tracking-widest mb-3">案件名稱/代號</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-white/80 border border-tiffany/10 rounded-2xl focus:ring-4 focus:ring-tiffany/5 outline-none font-bold text-slate-700 shadow-sm" 
                    value={activeCase.name} 
                    onChange={(e) => onUpdateActiveCase({ name: e.target.value })} 
                    placeholder="輸入案件編號..."
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-slate-500 uppercase tracking-widest mb-3">事件樣態</label>
                  <select 
                    className="w-full p-4 bg-white/80 border border-tiffany/10 rounded-2xl focus:ring-4 focus:ring-tiffany/5 outline-none font-bold text-slate-700 shadow-sm" 
                    value={activeCase.incidentType} 
                    onChange={(e: any) => onUpdateActiveCase({ incidentType: e.target.value })}
                  >
                    <option value="sexual_harassment">疑似性騷擾</option>
                    <option value="sexual_assault">疑似性侵害</option>
                    <option value="sexual_bullying">疑似性霸凌</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div>
                  <label className="block text-[14px] font-bold text-red-400 uppercase tracking-widest mb-3">1. 獲知日期 (知悉日)</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-white/80 border border-red-200 rounded-2xl focus:ring-4 focus:ring-red-500/5 outline-none font-bold text-slate-700 shadow-sm" 
                    value={activeCase.dates.known} 
                    onChange={(e) => onUpdateDates('known', e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[14px] font-bold text-blue-400 uppercase tracking-widest mb-3">2. 收件日期 (申請書)</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-white/80 border border-blue-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-slate-700 shadow-sm" 
                    value={activeCase.dates.application} 
                    onChange={(e) => onUpdateDates('application', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-purple-400 uppercase tracking-widest mb-3">3. 性平會決議受理日 (調查起算點)</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-white/80 border border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-500/5 outline-none font-bold text-slate-700 shadow-sm" 
                    value={activeCase.dates.acceptance} 
                    onChange={(e) => onUpdateDates('acceptance', e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[14px] font-bold text-teal-500 uppercase tracking-widest mb-3">4. 處理結果通知送達日</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-white/80 border border-teal-200 rounded-2xl focus:ring-4 focus:ring-teal-500/5 outline-none font-bold text-slate-700 shadow-sm" 
                    value={activeCase.dates.resultNotice} 
                    onChange={(e) => onUpdateDates('resultNotice', e.target.value)} 
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-tiffany/10">
                <button 
                  onClick={() => setShowAdvancedDates(!showAdvancedDates)}
                  className="flex items-center justify-between w-full text-tiffany-deep hover:text-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5" />
                    <span className="text-sm font-bold tracking-widest">進階日期追蹤 (申復、議處、救濟)</span>
                  </div>
                  {showAdvancedDates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {showAdvancedDates && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fadeIn">
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-purple-400">
                      <label className="block text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-3">5.1 權責機關接獲調查報告日</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-purple-100 rounded-2xl text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/5 shadow-sm" value={activeCase.dates.reportHandover} onChange={(e) => onUpdateDates('reportHandover', e.target.value)} />
                    </div>
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-teal-400">
                      <label className="block text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-3">6.1 收到申復書日期</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-teal-100 rounded-2xl text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-500/5 shadow-sm" value={activeCase.dates.appealReceive} onChange={(e) => onUpdateDates('appealReceive', e.target.value)} />
                    </div>
                    <div className="p-5 bg-white/40 rounded-3xl border border-white shadow-sm border-l-4 border-l-indigo-400">
                      <label className="block text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-3">6.4 申復決定書送達日</label>
                      <input type="date" className="w-full p-4 bg-white/80 border border-indigo-100 rounded-2xl text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm" value={activeCase.dates.appealDecisionNotice} onChange={(e) => onUpdateDates('appealDecisionNotice', e.target.value)} />
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
                <span className="text-[9px] bg-tiffany/20 text-tiffany px-3 py-1 rounded-full font-bold">STATUTORY DEADLINES</span>
              </div>
              <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: '法定通報期限', key: 'report', color: 'border-orange-400' },
                  { label: '受理審查期限', key: 'handover', color: 'border-white' },
                  { label: '受理通知期限', key: 'meetingDecide', color: 'border-tiffany' },
                  { label: '調查結案期限', key: 'investigation', color: 'border-white' },
                  { label: '申復期限', key: 'resultAppeal', color: 'border-blue-400' },
                  { label: '提起救濟期限', key: 'remedy', color: 'border-indigo-400' }
                ].filter(item => !!deadlines[item.key]).map(item => {
                  const taskId = DEADLINE_TASK_MAP[item.key];
                  const isCompleted = activeCase.checklist?.[taskId] || false;
                  const overdue = isOverdue(deadlines[item.key], isCompleted);

                  return (
                    <div key={item.key} className={`p-5 rounded-2xl bg-white/5 border-l-4 transition-all ${isCompleted ? 'border-green-400 bg-green-400/5' : item.color}`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-[12px] text-slate-400 font-black uppercase tracking-widest">{item.label}</div>
                        {isCompleted && <CheckCircle className="w-3 h-3 text-green-400" />}
                      </div>
                      <div className={`text-sm font-bold ${overdue ? 'text-red-400' : isCompleted ? 'text-green-400' : 'text-white'}`}>
                        {formatDate(deadlines[item.key]).split(' ')[0]}
                      </div>
                      {isCompleted && <div className="text-[12px] text-green-400/60 font-bold mt-1 uppercase">任務 {taskId} 已完成</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <GeminiAssistant 
            activeCase={activeCase} 
            globalFiles={globalFiles}
            onUpdateCase={onUpdateActiveCase} 
            onUpdateGlobalFiles={onUpdateGlobalFiles}
          />

          <div className="mt-16 space-y-6">
            <h2 className="text-xl font-bold text-slate-700 flex items-center px-4 mb-8 cinzel">
              <Activity className="w-6 h-6 mr-3 text-tiffany-deep" />
              外部戰士・時空星軌合規檢核表 (法規執行程序)
            </h2>
            {PHASES_DATA.map(phase => {
              const isExpanded = !!expandedPhases[phase.id];
              const completedCount = phase.tasks.filter(t => activeCase.checklist?.[t.id]).length;
              
              return (
                <div key={phase.id} className={`rounded-[2rem] border-2 transition-all duration-500 ${isExpanded ? 'shadow-lg border-tiffany/20' : 'border-white'} bg-white overflow-hidden`}>
                  <button 
                    onClick={() => togglePhase(phase.id)}
                    className={`w-full px-8 py-6 flex items-center justify-between text-left transition-colors ${isExpanded ? 'bg-tiffany/5' : 'hover:bg-tiffany/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-tiffany/10">
                        {getIcon(phase.iconName)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-700 text-sm">{phase.title}</h3>
                        <div className="text-[12px] font-black text-tiffany-deep/60 mt-1 uppercase tracking-widest">
                          完成度：{completedCount} / {phase.tasks.length}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-tiffany/40 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-tiffany-deep' : ''}`} />
                  </button>
                  
                  {isExpanded && (
                    <div className="p-8 space-y-6 animate-fadeIn bg-white/50">
                      {phase.tasks.map(task => (
                        <div key={task.id} className={`flex items-start gap-5 p-5 rounded-2xl border border-transparent transition-all ${activeCase.checklist?.[task.id] ? 'bg-tiffany/5 opacity-60' : 'hover:border-tiffany/10 hover:bg-white'}`}>
                          <input 
                            type="checkbox" 
                            checked={activeCase.checklist?.[task.id] || false}
                            onChange={() => onToggleCheck(task.id)}
                            className="mt-1.5 h-5 w-5 text-tiffany-deep rounded-lg border-tiffany/20 focus:ring-tiffany cursor-pointer transition-all"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="text-[10px] font-bold bg-white border border-tiffany/10 text-tiffany-deep px-2 py-0.5 rounded-full">{task.id}</span>
                              <span className={`font-bold text-sm ${task.important ? 'text-red-500' : 'text-slate-700'} ${activeCase.checklist?.[task.id] ? 'line-through opacity-40' : ''}`}>
                                {task.text}
                              </span>
                              {task.unit && <span className="text-[12px] bg-white border border-tiffany/5 text-tiffany-deep/70 px-3 py-0.5 rounded-full font-bold">{task.unit}</span>}
                            </div>
                            {task.note && <p className="text-[12px] text-slate-400 leading-relaxed mt-3 border-l-2 border-tiffany/10 pl-4">{task.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : tab === 'meetings' ? (
        <div className="animate-fadeIn space-y-10">
          <div className="flex justify-between items-center px-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-700 cinzel">星際議事錄</h2>
              <p className="text-[10px] text-tiffany-deep font-bold uppercase tracking-[0.3em] mt-1">Interstellar Meeting Archives</p>
            </div>
            <button 
              onClick={handleCreateMeeting}
              className={`px-8 py-3 btn-outer-senshi rounded-full font-bold text-[12px] uppercase tracking-widest flex items-center`}
            >
              <Plus className="w-4 h-4 mr-2"/>
              新增議程
            </button>
          </div>

          {(!activeCase.meetings || activeCase.meetings.length === 0) ? (
            <div className="text-center py-32 outer-tiffany-card border-dashed border-tiffany/30">
              <Mic className="w-16 h-16 text-tiffany/20 mx-auto mb-6" />
              <p className="text-tiffany/40 font-bold uppercase tracking-widest text-[12px]">尚無會議紀錄軌跡</p>
            </div>
          ) : (
            <div className="space-y-8">
              {activeCase.meetings.map(meeting => (
                <div key={meeting.id} className="outer-tiffany-card p-10 relative overflow-hidden group">
                  <div className="absolute top-8 right-8">
                    <button onClick={() => handleDeleteMeeting(meeting.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10 border-b border-tiffany/10 pb-6">
                    <div className="p-4 bg-tiffany/10 rounded-2xl text-tiffany-deep">
                      <FileText className="w-6 h-6"/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-[12px] font-black bg-tiffany text-white px-3 py-0.5 rounded-full uppercase tracking-widest">階段 {meeting.phaseId}</span>
                        <input type="date" value={meeting.date} onChange={(e) => {
                          const updated = activeCase.meetings.map(m => m.id === meeting.id ? { ...m, date: e.target.value } : m);
                          onUpdateActiveCase({ meetings: updated });
                        }} className="text-xs font-bold text-slate-400 bg-transparent border-none outline-none" />
                      </div>
                      <div className="relative group/input">
                        <input 
                          type="text" 
                          value={meeting.title} 
                          onChange={(e) => {
                            const updated = activeCase.meetings.map(m => m.id === meeting.id ? { ...m, title: e.target.value } : m);
                            onUpdateActiveCase({ meetings: updated });
                          }} 
                          className="text-2xl font-bold text-slate-700 bg-transparent border-b-2 border-transparent focus:border-tiffany outline-none w-full cinzel py-1 transition-all"
                          placeholder="請輸入會議主題 (AI 議程生成之核心主題)..."
                        />
                        <div className="absolute left-0 -bottom-4 text-[12px] font-bold text-tiffany-deep opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                          ✦ 具體的主題名稱有助於生成更貼切的議程
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                          <BookOpen className="w-4 h-4 mr-2 text-tiffany"/> 會議議程草案
                        </h4>
                        <button 
                          onClick={() => handleDraftAgenda(meeting)}
                          disabled={!!loadingState}
                          className="text-[12px] font-bold text-tiffany-deep hover:underline disabled:opacity-30 flex items-center gap-1"
                        >
                          {loadingState === meeting.id + '-agenda' ? '生成中...' : <><Sparkles className="w-3 h-3"/> 根據主題草擬議程</>}
                        </button>
                      </div>
                      <textarea 
                        className="w-full p-6 bg-slate-50/50 rounded-3xl border border-tiffany/5 text-sm leading-relaxed text-slate-600 min-h-[250px] focus:bg-white transition-colors outline-none"
                        value={meeting.agenda}
                        onChange={(e) => {
                          const updated = activeCase.meetings.map(m => m.id === meeting.id ? { ...m, agenda: e.target.value } : m);
                          onUpdateActiveCase({ meetings: updated });
                        }}
                        placeholder="請先在上方輸入會議主題，再點擊「根據主題草擬議程」..."
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                          <Mic className="w-4 h-4 mr-2 text-tiffany"/> 會議紀錄實錄
                        </h4>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setTargetMeetingId(meeting.id);
                              fileInputRef.current?.click();
                            }}
                            className="text-[12px] font-bold text-tiffany-deep hover:underline"
                          >
                            {meeting.recordingData ? '更換錄音' : '✦ 上傳錄音'}
                          </button>
                          <button 
                            onClick={() => {
                              setTargetMeetingId(meeting.id);
                              transcriptInputRef.current?.click();
                            }}
                            className="text-[12px] font-bold text-tiffany-deep hover:underline"
                          >
                            {meeting.transcript ? '更換逐字稿' : '✦ 上傳逐字稿'}
                          </button>
                          {(meeting.recordingData || meeting.transcript) && (
                            <button 
                              onClick={() => handleGenerateMinutes(meeting)}
                              disabled={!!loadingState}
                              className="text-[12px] font-bold text-purple-500 hover:underline disabled:opacity-30"
                            >
                              {loadingState === meeting.id + '-minutes' ? '轉錄中...' : '✦ 生成會議紀錄'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <textarea 
                          className="w-full p-6 bg-slate-50/50 rounded-3xl border border-tiffany/5 text-sm leading-relaxed text-slate-600 min-h-[250px] focus:bg-white transition-colors outline-none"
                          value={meeting.minutes}
                          onChange={(e) => {
                            const updated = activeCase.meetings.map(m => m.id === meeting.id ? { ...m, minutes: e.target.value } : m);
                            onUpdateActiveCase({ meetings: updated });
                          }}
                          placeholder="提供來源（錄音檔或逐字稿）後點擊生成..."
                        />
                        {(meeting.recordingData || meeting.transcript) && !meeting.minutes && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/80 px-6 py-3 rounded-full shadow-lg border border-tiffany/20 text-[12px] font-bold text-tiffany-deep animate-pulse flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2"/> 
                              {meeting.transcript && meeting.recordingData ? "錄音與逐字稿皆已就緒" : meeting.transcript ? "逐字稿已就緒" : "錄音已就緒"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fadeIn space-y-12">
          <div className="flex justify-between items-center px-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-700 cinzel">真理審判卷</h2>
              <p className="text-[10px] text-tiffany-deep font-bold uppercase tracking-[0.3em] mt-1">Final Investigation Scroll</p>
            </div>
            <button 
              onClick={() => reportTranscriptInputRef.current?.click()}
              className="px-8 py-3 btn-outer-senshi rounded-full font-bold text-[12px] uppercase tracking-widest flex items-center"
            >
              <Plus className="w-4 h-4 mr-2"/>
              匯入訪談逐字稿
            </button>
            <input 
              type="file" 
              ref={reportTranscriptInputRef} 
              onChange={handleUploadReportTranscript} 
              accept=".txt,.md,.docx" 
              multiple 
              className="hidden" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-6">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2">
                <UserCheck className="w-4 h-4 mr-2 text-tiffany"/> 已匯入之證詞 ({activeCase.transcripts?.length || 0})
              </h3>
              <div className="space-y-4">
                {(!activeCase.transcripts || activeCase.transcripts.length === 0) ? (
                  <div className="p-10 border-2 border-dashed border-tiffany/10 rounded-3xl text-center">
                    <p className="text-[12px] text-tiffany/30 font-bold uppercase tracking-widest">尚無訪談資料</p>
                  </div>
                ) : (
                  activeCase.transcripts.map(t => (
                    <div key={t.id} className="p-5 bg-white/60 border border-tiffany/10 rounded-2xl flex justify-between items-center pearl-shadow hover:border-tiffany transition-all">
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2 bg-tiffany/10 rounded-lg">
                          <FileCheck className="w-4 h-4 text-tiffany-deep" />
                        </div>
                        <span className="text-sm font-bold text-slate-600 truncate">{t.name}</span>
                      </div>
                      <button onClick={() => handleDeleteTranscript(t.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={handleGenerateReport}
                disabled={loadingState === 'report-generating' || !activeCase.transcripts?.length}
                className="w-full py-5 btn-outer-senshi rounded-full font-bold text-sm tracking-[0.2em] uppercase disabled:opacity-30 flex items-center justify-center mt-8 shadow-lg active:scale-95 transition-all"
              >
                {loadingState === 'report-generating' ? <Loader className="w-5 h-5 mr-3 animate-spin"/> : <Sparkles className="w-5 h-5 mr-3" />}
                {loadingState === 'report-generating' ? '審理生成中...' : '✦ 一鍵草擬調查報告'}
              </button>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center px-2">
                <ClipboardList className="w-4 h-4 mr-2 text-tiffany"/> 調查報告草案實錄
              </h3>
              <div className="outer-tiffany-card overflow-hidden">
                <textarea 
                  className="w-full p-8 bg-white/40 text-sm leading-relaxed text-slate-600 min-h-[600px] focus:bg-white transition-all outline-none border-none resize-none font-medium"
                  value={activeCase.investigationReport}
                  onChange={(e) => onUpdateActiveCase({ investigationReport: e.target.value })}
                  placeholder="匯入訪談紀錄並點擊左方生成按鈕，AI 將自動對齊法規架構撰寫報告..."
                />
              </div>
              {activeCase.investigationReport && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      const blob = new Blob([activeCase.investigationReport], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${activeCase.name}_調查報告草案.txt`;
                      a.click();
                    }}
                    className="text-[12px] font-bold text-tiffany-deep flex items-center hover:underline"
                  >
                    <FileText className="w-4 h-4 mr-2"/> 匯出為文字檔
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => targetMeetingId && handleUploadRecording(e, targetMeetingId)} 
        accept="audio/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={transcriptInputRef} 
        onChange={(e) => targetMeetingId && handleUploadTranscript(e, targetMeetingId)} 
        accept=".txt,.md,.docx" 
        className="hidden" 
      />
    </div>
  );
};

export default CaseDetail;
