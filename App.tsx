
import React, { useState } from 'react';
import { Home, Sparkles, Gem, Compass, Star, Moon, Heart, Shield, Loader, BookOpen } from 'lucide-react';
import { useCaseManagement } from './hooks/useCaseManagement';
import { PHASES_DATA } from './constants';
import CaseList from './components/CaseList';
import CaseDetail from './components/CaseDetail';
import HelpTutorial from './components/HelpTutorial';

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
    for (const phase of PHASES_DATA) {
      for (const task of phase.tasks) {
        if (!c.checklist[task.id]) return `${task.id} ${task.text}`;
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
              <div className="absolute -top-1 -right-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-slate-700 flex items-center cinzel">
                性平智慧守護星
                <span className="text-[10px] bg-[#81d8d0] text-white px-2 py-0.5 ml-3 rounded font-bold tracking-tighter">OUTER SENSHI</span>
              </h1>
              <div className="text-[9px] text-tiffany-deep font-bold uppercase tracking-[0.5em] mt-1">Deep Sea & Space-Time Sentinel</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-3 text-tiffany-deep hover:bg-tiffany/10 rounded-full transition-all"
              title="查看上傳教學"
            >
              <BookOpen className="w-5 h-5" />
            </button>

            {view === 'detail' && (
              <button 
                onClick={() => setView('list')} 
                className="px-6 py-2 rounded-full border border-tiffany text-tiffany-deep hover:bg-tiffany hover:text-white transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
              >
                <Home className="w-4 h-4"/>
                <span>返回星盤</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 flex-grow container mx-auto">
        {view === 'list' ? (
          <CaseList 
            cases={cases}
            globalFiles={globalFiles}
            onSelect={handleSelectCase}
            onCreate={handleCreateCase}
            onDelete={(e, id) => {
              e.stopPropagation();
              deleteCase(id);
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
              onUpdateGlobalFiles={updateGlobalFiles}
            />
          )
        )}
      </main>

      <footer className="py-12 bg-white/20 border-t border-tiffany/10 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-6 mb-6 opacity-40">
            <span className="text-xl text-tiffany-deep cinzel">♅</span>
            <span className="text-xl text-tiffany-deep cinzel">♆</span>
            <span className="text-xl text-tiffany-deep cinzel">♇</span>
            <span className="text-xl text-tiffany-deep cinzel">♄</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
            守護太陽系邊緣的真相 ・ 113 年修正法案
          </p>
          <p className="text-[9px] text-tiffany-deep/50 mt-3 italic">Eternal Sentinel Compliance Engine v4.2</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
