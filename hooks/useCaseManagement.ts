
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CaseData, CaseDates, KnowledgeFile } from '../types';
import { calculateDeadlines } from '../utils/dateUtils';
import { PHASES_DATA } from '../constants';
import { getDBItem, setDBItem } from '../utils/db';

const STORAGE_KEY = 'genderEquityCases_v4_2';
const KNOWLEDGE_KEY = 'genderEquityGlobalKnowledge_v4_2';

export const useCaseManagement = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [globalFiles, setGlobalFiles] = useState<KnowledgeFile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // 初始化：從 IndexedDB 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCases = await getDBItem<CaseData[]>(STORAGE_KEY);
        const savedKnowledge = await getDBItem<KnowledgeFile[]>(KNOWLEDGE_KEY);
        
        if (savedCases) {
          // 確保舊資料也有 meetings, transcripts, investigationReport 欄位
          const migration = savedCases.map(c => ({
            ...c,
            meetings: c.meetings || [],
            transcripts: c.transcripts || [],
            investigationReport: c.investigationReport || ""
          }));
          setCases(migration);
        }
        if (savedKnowledge) setGlobalFiles(savedKnowledge);
      } catch (err) {
        console.error("Failed to load from IndexedDB", err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // 同步：當狀態變更且已載入完成時，寫入 IndexedDB
  useEffect(() => {
    if (isLoaded) {
      setDBItem(STORAGE_KEY, cases);
    }
  }, [cases, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      setDBItem(KNOWLEDGE_KEY, globalFiles);
    }
  }, [globalFiles, isLoaded]);

  const activeCase = useMemo(() => 
    cases.find(c => c.id === activeCaseId) || null
  , [cases, activeCaseId]);

  const deadlines = useMemo(() => 
    activeCase ? calculateDeadlines(activeCase) : {}
  , [activeCase]);

  const progressStats = useMemo(() => {
    if (!activeCase) return { currentPhase: 0, percentage: 0 };
    
    let totalTasks = 0;
    let completedTasks = 0;
    let lastCompletedPhaseIndex = 0;

    PHASES_DATA.forEach((phase, index) => {
      phase.tasks.forEach(task => {
        totalTasks++;
        if (activeCase.checklist[task.id]) {
          completedTasks++;
        }
      });
      if (phase.tasks.some(task => activeCase.checklist[task.id])) {
        lastCompletedPhaseIndex = index + 1;
      }
    });

    return {
      currentPhase: Math.max(1, lastCompletedPhaseIndex),
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [activeCase]);

  const createNewCase = useCallback(() => {
    const newCase: CaseData = {
      id: Date.now().toString(),
      name: `新案件 ${new Date().toLocaleDateString()}`,
      incidentType: 'sexual_harassment',
      hasApplication: true,
      description: '',
      dates: {
        known: '', application: '', acceptance: '',
        nonAcceptanceNotice: '', reportHandover: '',
        resultNotice: '', appealReceive: '', appealDecisionNotice: ''
      },
      checklist: {},
      meetings: [],
      transcripts: [],
      investigationReport: ""
    };
    setCases(prev => [newCase, ...prev]);
    setActiveCaseId(newCase.id);
    return newCase.id;
  }, []);

  const deleteCase = useCallback((id: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
    if (activeCaseId === id) setActiveCaseId(null);
  }, [activeCaseId]);

  const updateActiveCase = useCallback((updates: Partial<CaseData>) => {
    if (!activeCaseId) return;
    setCases(prev => prev.map(c => 
      c.id === activeCaseId ? { ...c, ...updates } : c
    ));
  }, [activeCaseId]);

  const updateDates = useCallback((field: keyof CaseDates, value: string) => {
    if (!activeCase) return;
    updateActiveCase({
      dates: { ...activeCase.dates, [field]: value }
    });
  }, [activeCase, updateActiveCase]);

  const toggleCheck = useCallback((taskId: string) => {
    if (!activeCase) return;
    updateActiveCase({
      checklist: { 
        ...activeCase.checklist, 
        [taskId]: !activeCase.checklist[taskId] 
      }
    });
  }, [activeCase, updateActiveCase]);

  const updateGlobalFiles = useCallback((newFiles: KnowledgeFile[]) => {
    setGlobalFiles(newFiles);
  }, []);

  return {
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
  };
};
