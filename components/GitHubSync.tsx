
import React, { useState, useEffect } from 'react';
import { Settings, UploadCloud, DownloadCloud, Github, AlertCircle, CheckCircle2, Loader2, X, Info } from 'lucide-react';
import { GitHubConfig, CaseData, KnowledgeFile, SyncData } from '../types';

interface GitHubSyncProps {
  cases: CaseData[];
  globalFiles: KnowledgeFile[];
  onRestore: (cases: CaseData[], files: KnowledgeFile[]) => void;
}

const STORAGE_KEY = 'genderEquityGitHubConfig';

const GitHubSync: React.FC<GitHubSyncProps> = ({ cases, globalFiles, onRestore }) => {
  const [config, setConfig] = useState<GitHubConfig>({ token: '', owner: '', repo: '', path: 'gender_equity_backup.json' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setIsModalOpen(false);
  };

  const encodeBase64 = (str: string) => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const decodeBase64 = (str: string) => {
    return decodeURIComponent(escape(atob(str)));
  };

  const handleBackup = async () => {
    if (!config.token || !config.owner || !config.repo) {
      setIsModalOpen(true);
      return;
    }

    setStatus('loading');
    setMessage('正在同步至雲端...');

    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
      const syncData: SyncData = {
        cases,
        globalFiles,
        timestamp: Date.now()
      };

      let sha = '';
      const getRes = await fetch(url, {
        headers: { 'Authorization': `token ${config.token}` }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `星際守護備份同步 - ${new Date().toLocaleString()}`,
          content: encodeBase64(JSON.stringify(syncData)),
          sha: sha || undefined
        })
      });

      if (putRes.ok) {
        setStatus('success');
        setMessage('備份成功！');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('權限或設定錯誤');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || '連線異常');
    }
  };

  const handleRestore = async () => {
    if (!config.token || !config.owner || !config.repo) {
      setIsModalOpen(true);
      return;
    }

    if (!window.confirm("還原將會覆蓋目前的本地資料，確定要啟動時空還原嗎？")) return;

    setStatus('loading');
    setMessage('正在檢索守護紀錄...');

    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `token ${config.token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(decodeBase64(data.content)) as SyncData;
        onRestore(content.cases, content.globalFiles);
        setStatus('success');
        setMessage('還原成功！');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('找不到備份檔案');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || '還原失敗');
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-md p-1.5 rounded-full border border-tiffany/20 shadow-sm">
        <button 
          onClick={handleBackup}
          disabled={status === 'loading'}
          title="備份同步"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-tiffany-deep text-[12px] font-bold uppercase tracking-widest hover:bg-tiffany/10 transition-all disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
          <span className="hidden sm:inline">備份同步</span>
        </button>
        <button 
          onClick={handleRestore}
          disabled={status === 'loading'}
          title="時空還原"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-tiffany-deep text-[12px] font-bold uppercase tracking-widest hover:bg-tiffany/10 transition-all disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
          <span className="hidden sm:inline">時空還原</span>
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          title="同步設定"
          className="p-2 text-slate-400 hover:text-tiffany-deep hover:bg-white rounded-full transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 狀態氣泡提示 */}
      {status !== 'idle' && (
        <div className={`absolute top-full mt-2 right-0 z-50 px-4 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap border shadow-lg animate-fadeIn flex items-center gap-2 ${
          status === 'loading' ? 'bg-blue-50 border-blue-100 text-blue-600' :
          status === 'success' ? 'bg-green-50 border-green-100 text-green-600' :
          'bg-red-50 border-red-100 text-red-600'
        }`}>
          {status === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
           status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {message}
        </div>
      )}

      {/* 設定 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md outer-tiffany-card bg-white p-8 shadow-2xl border-2 border-tiffany/30">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-700 cinzel">GitHub 同步設定</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-300" /></button>
            </div>

            <div className="space-y-5">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[12px] text-amber-700 leading-relaxed font-bold">
                  性平資料極為敏感。強烈建議將此資料備份於 Private 私有倉庫。
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Access Token</label>
                <input 
                  type="password" 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-tiffany/20"
                  value={config.token}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="ghp_..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Owner</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none" value={config.owner} onChange={(e) => setConfig({ ...config, owner: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Repo</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none" value={config.repo} onChange={(e) => setConfig({ ...config, repo: e.target.value })} />
                </div>
              </div>

              <button 
                onClick={saveConfig}
                className="w-full py-3 bg-tiffany text-white rounded-xl font-bold text-sm tracking-widest shadow-lg shadow-tiffany/20 mt-4"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubSync;
