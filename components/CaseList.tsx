
import React from 'react';
import { Plus, Trash2, Shield, Compass, Heart, Sparkles, ChevronRight, AlertTriangle, Moon } from 'lucide-react';
import { CaseData, KnowledgeFile } from '../types';
import { calculateDeadlines, isOverdue, DEADLINE_TASK_MAP } from '../utils/dateUtils';
import GeminiAssistant from './GeminiAssistant';
import GitHubSync from './GitHubSync';

interface CaseListProps {
  cases: CaseData[];
  globalFiles: KnowledgeFile[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onUpdateGlobalFiles: (files: KnowledgeFile[]) => void;
  onRestore: (cases: CaseData[], files: KnowledgeFile[]) => void;
  getNextStepText: (c: CaseData) => string;
}

const CaseList: React.FC<CaseListProps> = ({ 
  cases, 
  globalFiles,
  onSelect, 
  onCreate, 
  onDelete, 
  onUpdateGlobalFiles,
  onRestore,
  getNextStepText 
}) => {
  return (
    <div className="space-y-16 py-12 max-w-5xl mx-auto">
      {/* 標題與操作區 */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 border-b border-tiffany/20 pb-12">
        <div className="text-center lg:text-left">
          <h2 className="text-4xl font-bold text-slate-700 tracking-[0.1em] cinzel">
            守護紀錄殿堂
          </h2>
          <p className="text-[10px] font-bold text-tiffany-deep/60 mt-4 uppercase tracking-[0.5em]">The Archive of Outer Sentinels</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-center lg:justify-end">
          <GitHubSync cases={cases} globalFiles={globalFiles} onRestore={onRestore} />
          
          <button 
            onClick={onCreate}
            className="group btn-outer-senshi px-8 py-3.5 rounded-full font-bold tracking-[0.2em] uppercase text-[12px] flex items-center shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> 建立守護任務
          </button>
        </div>
      </div>

      {/* 正在運行的守護星軌 */}
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-6 px-4">
          <h3 className="text-[14px] font-black text-tiffany-deep/40 uppercase tracking-[0.4em] whitespace-nowrap">正在運行的守護星軌</h3>
          <div className="h-[1px] bg-tiffany/20 flex-grow"></div>
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-24 outer-tiffany-card border-dashed border-tiffany/30">
            <Moon className="w-16 h-16 text-tiffany/20 mx-auto mb-6" />
            <p className="text-tiffany/40 font-bold uppercase tracking-widest text-[12px]">星系目前平安，無待處置軌跡</p>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            {cases.map(c => {
              const caseDl = calculateDeadlines(c);
              
              // 判定是否有任何「未完成且已過期」的時效
              const isAnyOverdue = Object.entries(caseDl).some(([key, date]) => {
                const taskId = DEADLINE_TASK_MAP[key];
                const isCompleted = c.checklist?.[taskId] || false;
                return isOverdue(date as Date, isCompleted);
              });
              
              return (
                <div 
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className="outer-tiffany-card p-10 border-white hover:shadow-2xl hover:shadow-tiffany/20 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      onClick={(e) => onDelete(e, c.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-slate-700 group-hover:text-tiffany-deep transition-colors truncate pr-12 cinzel">
                      {c.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-10">
                    <span className={`text-[12px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest bg-white shadow-sm border ${
                      c.incidentType === 'sexual_harassment' ? 'text-orange-400 border-orange-100' :
                      c.incidentType === 'sexual_assault' ? 'text-red-400 border-red-100' : 'text-tiffany-deep border-tiffany/20'
                    }`}>
                      {c.incidentType === 'sexual_harassment' ? '疑似性騷擾' : 
                       c.incidentType === 'sexual_assault' ? '疑似性侵害' : '疑似性霸凌'}
                    </span>
                    {isAnyOverdue && (
                      <span className="flex items-center text-[12px] bg-red-400 text-white px-4 py-1.5 rounded-full font-bold uppercase tracking-widest animate-pulse">
                        <AlertTriangle className="w-4 h-4 mr-2" /> 時空逾時
                      </span>
                    )}
                  </div>

                  <div className="bg-white/50 p-6 rounded-[1.5rem] border border-white flex items-center justify-between group-hover:bg-tiffany/10 transition-all">
                    <div className="flex-1 truncate pr-6">
                      <div className="text-[9px] text-tiffany-deep font-black mb-2 flex items-center uppercase tracking-[0.2em]">
                        <Compass className="w-3 h-3 mr-2 text-tiffany-deep"/> NEXT MISSION
                      </div>
                      <div className="text-sm font-bold text-slate-500 truncate group-hover:text-slate-700 transition-colors">
                        {getNextStepText(c)}
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-tiffany/30 group-hover:text-tiffany-deep group-hover:translate-x-2 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <GeminiAssistant 
        globalFiles={globalFiles}
        onUpdateGlobalFiles={onUpdateGlobalFiles}
      />
    </div>
  );
};

export default CaseList;
