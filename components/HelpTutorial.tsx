
import React from 'react';
import { X, BookOpen, Upload, Mic, FileCheck, ArrowRight } from 'lucide-react';

interface HelpTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpTutorial: React.FC<HelpTutorialProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      title: "第一步：注入守護法條 (PDF)",
      icon: <Upload className="w-6 h-6 text-tiffany-deep" />,
      desc: "在首頁或案件內點擊「更新守護卷軸」，上傳您學校的防治準則 PDF。AI 將依此進行適法性鑑定。",
      target: "GeminiAssistant"
    },
    {
      title: "第二步：紀錄星軌會議 (錄音/文字)",
      icon: <Mic className="w-6 h-6 text-tiffany-deep" />,
      desc: "在「會議紀錄」分頁，上傳會議錄音檔或逐字稿。AI 會自動為您草擬正式的會議紀錄。",
      target: "Meeting Tab"
    },
    {
      title: "第三步：彙整真相證詞 (逐字稿)",
      icon: <FileCheck className="w-6 h-6 text-tiffany-deep" />,
      desc: "在「調查報告」分頁，匯入所有訪談對象的逐字稿。AI 將交互比對證詞，生成結構嚴謹的報告。",
      target: "Report Tab"
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl outer-tiffany-card bg-white p-10 shadow-2xl border-2 border-tiffany/40 animate-fadeIn">
        <div className="flex justify-between items-center mb-10 border-b border-tiffany/10 pb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-700 cinzel flex items-center">
              <BookOpen className="w-7 h-7 mr-3 text-tiffany-deep" />
              時空引導：上傳教學
            </h3>
            <p className="text-[10px] text-tiffany-deep font-bold tracking-[0.3em] uppercase mt-1">Upload Tutorial Guide</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-tiffany/10 rounded-full transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-8">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-tiffany/10 flex items-center justify-center shadow-inner group-hover:bg-tiffany group-hover:text-white transition-all">
                  {step.icon}
                </div>
                {idx < steps.length - 1 && <div className="w-0.5 h-full bg-tiffany/20 my-2"></div>}
              </div>
              <div className="flex-1 pb-4">
                <h4 className="text-lg font-bold text-slate-700 mb-2 flex items-center">
                  {step.title}
                  <ArrowRight className="w-4 h-4 ml-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-tiffany-deep" />
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-10 py-4 btn-outer-senshi rounded-full font-bold text-xs uppercase tracking-widest"
        >
          我已掌握時空法則，開始守護
        </button>
      </div>
    </div>
  );
};

export default HelpTutorial;
