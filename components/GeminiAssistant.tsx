
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader, Copy, AlertTriangle, FileText, Upload, X, Gem, Globe, Eye, Key, Sword, BookOpen } from 'lucide-react';
import { CaseData, KnowledgeFile } from '../types';
import { callGeminiAnalysis } from '../services/geminiService';

interface GeminiAssistantProps {
  activeCase?: CaseData | null;
  globalFiles: KnowledgeFile[];
  onUpdateCase?: (updates: Partial<CaseData>) => void;
  onUpdateGlobalFiles: (files: KnowledgeFile[]) => void;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ 
  activeCase, 
  globalFiles,
  onUpdateCase, 
  onUpdateGlobalFiles 
}) => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [generalQuery, setGeneralQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setResult('');
    setError('');
  }, [activeCase?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newFiles: KnowledgeFile[] = [...globalFiles];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') continue;
      const base64 = await fileToBase64(file);
      newFiles.push({ name: file.name, data: base64, mimeType: file.type });
    }
    onUpdateGlobalFiles(newFiles);
    setUploading(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
  };

  const handleAnalyze = async () => {
    const description = activeCase ? activeCase.description : generalQuery;
    if (!description) return;
    setLoading(true);
    setError('');
    try {
      const analysis = await callGeminiAnalysis(
        activeCase?.name || "真相研析",
        activeCase?.incidentType || "通用軌跡",
        description,
        globalFiles
      );
      setResult(analysis);
    } catch (err) {
      setError('時空能量波干擾中，請檢查守護卷軸。');
    } finally {
      setLoading(false);
    }
  };

  const isDetailMode = !!activeCase;

  return (
    <div className="mb-12">
      <div className={`outer-tiffany-card overflow-hidden border-2 border-white/50 transition-all shadow-xl`}>
        {/* 標題與操作區 */}
        <div className={`px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-tiffany/10 bg-white/40`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-2xl mr-5 pearl-shadow ${isDetailMode ? 'bg-[#e0f7f6]' : 'bg-[#fffde7]'}`}>
              {isDetailMode ? <Eye className="w-6 h-6 text-tiffany-deep" /> : <Key className="w-6 h-6 text-[#d4af37]" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-700 cinzel">
                {isDetailMode ? "深海之鏡：真相鑑定" : "時空之門：冥王星守護卷軸"}
              </h2>
              <div className="text-[10px] text-tiffany-deep font-black tracking-widest uppercase flex items-center mt-1">
                <span className="mr-2">✦</span> 
                {isDetailMode ? "Talisman Reality Appraisal" : "Eternal Space-Time Archive"}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isDetailMode && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-tiffany/30 text-tiffany-deep font-bold text-xs uppercase tracking-widest hover:bg-tiffany/10 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                查看守護法規 ({globalFiles.length})
              </button>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-outer-senshi px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center"
            >
              {uploading ? <Loader className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 mr-2" />}
              更新守護卷軸
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" multiple className="hidden" />
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* 輸入區 */}
          <div className="space-y-6">
            <label className="text-[14px] font-black text-tiffany-deep/70 uppercase tracking-[0.3em] flex items-center">
              {isDetailMode ? <Sword className="w-4 h-4 mr-3 text-tiffany-deep" /> : <Sparkles className="w-4 h-4 mr-3 text-yellow-400" />}
              {isDetailMode ? "啟動宇宙劍：斷罪判定" : "向守護意志提問"}
            </label>
            <textarea 
              className="w-full p-6 bg-white/50 border border-tiffany/10 rounded-3xl focus:border-tiffany focus:ring-4 focus:ring-tiffany/5 outline-none text-sm text-slate-600 transition-all shadow-inner placeholder:text-slate-300"
              placeholder={isDetailMode ? "描述此事件的因果流轉..." : "輸入關於法規的疑惑，尋求星辰引導..."}
              rows={5}
              value={isDetailMode ? activeCase.description : generalQuery}
              onChange={(e) => isDetailMode ? onUpdateCase?.({ description: e.target.value }) : setGeneralQuery(e.target.value)}
            />

            <button 
              onClick={handleAnalyze}
              disabled={loading || (isDetailMode ? !activeCase.description : !generalQuery) || !globalFiles.length}
              className="w-full py-5 btn-outer-senshi rounded-full font-bold text-sm tracking-[0.3em] uppercase disabled:opacity-30 flex items-center justify-center"
            >
              {loading ? <Loader className="w-5 h-5 mr-4 animate-spin"/> : <Gem className="w-5 h-5 mr-4" />}
              {loading ? '星軌掃描中...' : '以外部戰士之名・啟動合規鑑定'}
            </button>
            {!globalFiles.length && (
              <p className="text-[10px] text-red-400 font-bold text-center animate-pulse">
                <AlertTriangle className="w-3 h-3 inline mr-1" /> 請先更新法規卷軸以啟動鑑定
              </p>
            )}
          </div>

          {/* 結果報告 */}
          {result && (
            <div className="mt-12 animate-fadeIn bg-white/90 rounded-[2.5rem] p-10 border border-tiffany/20 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 border-b border-tiffany/10 pb-5">
                <h3 className="font-bold text-tiffany-deep text-lg tracking-widest flex items-center cinzel">
                  <span className="text-tiffany-deep mr-4">✥</span> 守護者判定報告書
                </h3>
                <button onClick={() => navigator.clipboard.writeText(result)} className="text-[10px] font-bold text-slate-400 hover:text-tiffany-deep flex items-center transition-colors uppercase tracking-widest">
                  <Copy className="w-4 h-4 mr-2"/> 複製鑑定紀錄
                </button>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-tiffany">
                {result}
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-50 border border-red-100 text-red-400 rounded-2xl text-xs flex items-center">
              <AlertTriangle className="w-4 h-4 mr-3" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 時空法規庫 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl outer-tiffany-card bg-white p-8 shadow-2xl animate-scaleIn border-2 border-tiffany/30">
            <div className="flex justify-between items-center mb-8 border-b border-tiffany/10 pb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-700 cinzel flex items-center">
                  <BookOpen className="w-6 h-6 mr-3 text-tiffany-deep" />
                  時空法規庫
                </h3>
                <p className="text-[9px] text-tiffany-deep font-bold tracking-[0.3em] uppercase mt-1">Regulation Repository</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-tiffany/10 rounded-full transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
              {globalFiles.length === 0 ? (
                <div className="text-center py-20 bg-tiffany/5 rounded-[2rem] border-2 border-dashed border-tiffany/20">
                  <Globe className="w-12 h-12 text-tiffany/20 mx-auto mb-4" />
                  <p className="text-xs font-bold text-tiffany/40 uppercase tracking-[0.2em]">時空庫尚無數據，請先上傳守護卷軸</p>
                </div>
              ) : (
                globalFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-tiffany/10 p-5 rounded-2xl pearl-shadow hover:border-tiffany transition-all group">
                    <div className="flex items-center">
                      <div className="p-2 bg-tiffany/5 rounded-lg mr-4">
                        <FileText className="w-5 h-5 text-tiffany-deep" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{file.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">{file.mimeType}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const next = [...globalFiles];
                        next.splice(idx, 1);
                        onUpdateGlobalFiles(next);
                      }}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-tiffany/10 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 bg-tiffany text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-tiffany/20"
              >
                關閉法規庫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiAssistant;
