
import React from 'react';
import { PHASES_DATA } from '../constants';
import { Gem, Compass } from 'lucide-react';

interface ProgressBarProps {
  currentPhase: number;
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentPhase, percentage }) => {
  return (
    <div className="outer-tiffany-card p-10 mb-12 border-white/50">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-slate-700 font-bold tracking-widest flex items-center cinzel">
          <Compass className="w-5 h-5 text-tiffany-deep mr-4" />
          星軌運行進度：秩序恢復
        </h3>
        <span className="text-xs font-bold text-tiffany-deep bg-white px-5 py-2 rounded-full pearl-shadow shadow-sm">{percentage}% ORDER RESTORED</span>
      </div>
      
      <div className="relative py-12">
        {/* 背景線 */}
        <div className="absolute top-[40px] left-0 w-full h-[3px] bg-white/60 rounded-full"></div>
        {/* 進度線 */}
        <div 
          className="absolute top-[40px] left-0 h-[3px] bg-gradient-to-r from-[#81d8d0] to-white rounded-full transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${(currentPhase / PHASES_DATA.length) * 100}%` }}
        ></div>

        <div className="relative flex justify-between px-2">
          {PHASES_DATA.map((phase, idx) => {
            const isCompleted = idx + 1 < currentPhase;
            const isCurrent = idx + 1 === currentPhase;
            return (
              <div key={phase.id} className="flex flex-col items-center group relative flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold transition-all z-10 pearl-shadow
                  ${isCompleted ? 'bg-[#81d8d0] text-white shadow-lg shadow-tiffany/20' : 
                    isCurrent ? 'bg-white border-4 border-[#81d8d0] text-tiffany-deep scale-125 ring-8 ring-tiffany/5' : 'bg-white text-slate-300 border border-slate-100'}
                `}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div className={`
                  hidden md:block absolute top-14 w-32 text-center text-[9px] font-bold transition-colors uppercase tracking-[0.1em] leading-relaxed
                  ${isCurrent ? 'text-tiffany-deep opacity-100' : 'text-slate-500 opacity-60'}
                `}>
                  {phase.title.split('：')[1] || phase.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
