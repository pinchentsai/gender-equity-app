
import React, { useState } from 'react';
import { Home, Sparkles, Gem, Compass, Star, Moon, Heart, Shield, Loader, BookOpen } from 'lucide-react';
import { useCaseManagement } from './hooks/useCaseManagement';
import { PHASES_DATA } from './constants';
import CaseList from './components/CaseList';
import CaseDetail from './components/CaseDetail';
import HelpTutorial from './components/HelpTutorial';
import { isTaskLocked } from './utils/dateUtils';

// Fix: Add the missing implementation and default export for the App component to resolve the "no default export" error.
const App: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const {
    cases,
    setCases,
    activeCase,
    deadlines,
    progressStats,
    globalFiles,
    setGlobalFiles,
    isLoaded,
    setActiveCaseId,
    createNewCase,
    deleteCase,
    updateActiveCase,
    updateDates,
    toggleCheck,
    updateCompletionDate,
    updateGlobalFiles
  } = useCaseManagement();

  const handleSelectCase = (id: string) => {
    setActiveCaseId(id);
    setView('detail');
  };

  const handleCreateCase = () => {
    createNewCase();
    setView('detail');
  };

  const handleRestore = (restoredCases: any[], restoredFiles: any[]) => {
    setCases(restoredCases);
    setGlobalFiles(restoredFiles);
  };

  const getNextStepText = (c: any) => {
    const isReinvestigationMode = c.phase6AppealFollowUp === 'reinvestigation';

    for (const phase of PHASES_DATA) {
      // 跳過隱藏的星軌 (如 6.5 僅在重新調查模式顯示)
      if (phase.id === 6.5 && !isReinvestigationMode) continue;

      const tasks = [...phase.tasks];
      // 處理動態任務擴充 (2.5 申復支線)
      if (phase.id === 2 && c.decisionStatus === 'not_accepted' && c.filedAppeal) {
        tasks.push({ id: "2.5-1", text: "召開性平會重新議決 (申復處理)", note: "", unit: "" });
        tasks.push({ id: "2.5-2", text: "書面通知申復結果", note: "", unit: "" });
        tasks.push({ id: "2.5-3", text: "啟動調查(若申復有理由)", note: "", unit: "" });
      }

      for (const task of tasks) {
        // 已勾選則跳過
        if (c.checklist[task.id]) continue;
        
        // 如果任務是被鎖定的，也跳過，尋找下一個可執行的任務
        if (isTaskLocked(c, task.id)) continue;

        return `${task.id} ${task.text}`;
      }
    }
    return "星系秩序恢復達成";
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping bg-tiffany/20 rounded-full scale-150"></div>
          <div className="relative bg-white p-8 rounded-full shadow-2xl border border-tiffany/20">
             <Shield className="w-12 h-12 text-tiffany-deep animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-tiffany-deep font-bold tracking-[0.5em] cinzel uppercase">星軌同步中</p>
          <p className="text-[10px] text-slate-400 mt-2 font-black tracking-widest uppercase">Synchronizing Space-Time Archive</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-tiffany/30 selection:text-tiffany-deep">
      <HelpTutorial isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <header className="bg-white/70 backdrop-blur-xl p-6 sticky top-0 z-50 border-b border-tiffany/30 shadow-[0_2px_15px_rgba(129,216,208,0.2)]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center space-x-4 cursor-pointer group" 
            onClick={() => setView('list')}
          >
            <div className="relative">
              <div className="bg-[#81d8d0] p-3 rounded-full shadow-lg shadow-tiffany/20 transform group-hover:rotate-[360deg] transition-transform duration-700">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-700 cinzel tracking-widest">
                星際守護者・性平星軌
              </h1>
              <div className="text-[10px] text-tiffany-deep font-black tracking-widest uppercase flex items-center">
                <span className="mr-2">✦</span> Outer Sentinels: Equity Orbit
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button 
                onClick={() => setIsHelpOpen(true)}
                className="p-3 text-slate-400 hover:text-tiffany-deep hover:bg-tiffany/5 rounded-full transition-all"
                title="時空手冊"
              >
                <BookOpen className="w-6 h-6" />
              </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-10">
        {view === 'list' ? (
          <CaseList 
            cases={cases}
            globalFiles={globalFiles}
            onSelect={handleSelectCase}
            onCreate={handleCreateCase}
            onDelete={(e, id) => {
              e.stopPropagation();
              if (window.confirm('確定要刪除這條星軌紀錄嗎？此動作無法復原。')) {
                deleteCase(id);
              }
            }}
            onUpdateGlobalFiles={updateGlobalFiles}
            onRestore={handleRestore}
            getNextStepText={getNextStepText}
          />
        ) : (
          activeCase && (
            <CaseDetail 
              activeCase={activeCase}
              deadlines={deadlines}
              progressStats={progressStats}
              globalFiles={globalFiles}
              onBack={() => setView('list')}
              onUpdateActiveCase={updateActiveCase}
              onUpdateDates={updateDates}
              onToggleCheck={toggleCheck}
              onUpdateCompletionDate={updateCompletionDate}
              onUpdateGlobalFiles={updateGlobalFiles}
            />
          )
        )}
      </main>

      <footer className="py-12 border-t border-tiffany/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center items-center space-x-2 text-tiffany/30 font-bold uppercase tracking-[0.5em] text-[10px]">
            <Star className="w-3 h-3" />
            <span>Protecting the balance of time and justice</span>
            <Star className="w-3 h-3" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
