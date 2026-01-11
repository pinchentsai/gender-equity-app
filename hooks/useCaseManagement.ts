
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CaseData, CaseDates, KnowledgeFile, Task } from '../types';
import { calculateDeadlines } from '../utils/dateUtils';
import { PHASES_DATA } from '../constants';
import { getDBItem, setDBItem } from '../utils/db';

const STORAGE_KEY = 'genderEquityCases_v4_5'; 
const KNOWLEDGE_KEY = 'genderEquityGlobalKnowledge_v4_5';

export const useCaseManagement = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [globalFiles, setGlobalFiles] = useState<KnowledgeFile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // 初始化：從 IndexedDB 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCases = await getDBItem<any[]>(STORAGE_KEY);
        const savedKnowledge = await getDBItem<KnowledgeFile[]>(KNOWLEDGE_KEY);
        
        if (savedCases) {
          const migration = savedCases.map(c => {
            let role = c.incidentRoleType || 'teacher_vs_student';
            // 處理舊版資料轉移
            if (role === 'principal_vs_student') role = 'teacher_vs_student';
            if (role === 'student_vs_student') role = 'student_vs_student_middle_up';

            return {
              ...c,
              incidentRoleType: role,
              transcripts: c.transcripts || [],
              investigationReport: c.investigationReport || "",
              extensionMonths: c.extensionMonths ?? 0,
              decisionStatus: c.decisionStatus || 'pending',
              filedAppeal: c.filedAppeal ?? false,
              investigationResult: c.investigationResult || 'pending',
              phase6AppealStatus: c.phase6AppealStatus || 'pending',
              phase6AppealResult: c.phase6AppealResult || 'pending',
              phase6AppealFollowUp: c.phase6AppealFollowUp || 'pending',
              phase6RemedyStatus: c.phase6RemedyStatus || 'pending',
              completionDates: c.completionDates || {} // 確保 completionDates 存在
            };
          });
          setCases(migration as CaseData[]);
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
      // 判定星軌可見度
      const isPhaseVisible = phase.id === 6.5 
        ? activeCase.phase6AppealFollowUp === 'reinvestigation' 
        : true;

      if (!isPhaseVisible) return;

      // 取得該階段的任務集
      let tasks = phase.tasks;
      if (phase.id === 2 && activeCase.decisionStatus === 'not_accepted' && activeCase.filedAppeal) {
        tasks = [
          ...phase.tasks, 
          { id: "2.5-1", text: "召開性平會重新議決 (申復處理)", note: "性平法§32-3", unit: "性平會" },
          { id: "2.5-2", text: "書面通知申復結果", note: "性平法§32-3", unit: "性平會" },
          { id: "2.5-3", text: "啟動調查(若申復有理由)", note: "性平法§32-3", unit: "性平會" }
        ];
      }

      tasks.forEach(task => {
        // 判斷是否為生對生案件（不論國小或國中以上）
        const isStudentCase = activeCase.incidentRoleType === 'student_vs_student_middle_up' || activeCase.incidentRoleType === 'student_vs_student_elementary';
        const isLockedByStudentVsStudent = isStudentCase && ['4.4', '5.1', '5.2'].includes(task.id);
        if (isLockedByStudentVsStudent) return;

        totalTasks++;
        if (activeCase.checklist[task.id]) {
          completedTasks++;
        }
      });
      if (tasks.some(task => activeCase.checklist[task.id])) {
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
      incidentRoleType: 'teacher_vs_student',
      hasApplication: true,
      description: '',
      dates: {
        known: '', 
        application: '', 
        acceptance: '',
        nonAcceptanceNotice: '', 
        nonAcceptanceAppealReceive: '',
        reportHandover: '',
        resultNotice: '', 
        appealReceive: '', 
        appealDecisionNotice: '',
        reinvestigationStart: ''
      },
      checklist: {},
      completionDates: {}, // 初始化 completionDates
      transcripts: [],
      investigationReport: "",
      extensionMonths: 0,
      decisionStatus: 'pending',
      filedAppeal: false,
      investigationResult: 'pending',
      phase6AppealStatus: 'pending',
      phase6AppealResult: 'pending',
      phase6AppealFollowUp: 'pending',
      phase6RemedyStatus: 'pending'
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

  const updateCompletionDate = useCallback((taskId: string, date: string) => {
    if (!activeCase) return;
    updateActiveCase({
      completionDates: {
        ...activeCase.completionDates,
        [taskId]: date
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
    updateCompletionDate,
    updateGlobalFiles
  };
};
