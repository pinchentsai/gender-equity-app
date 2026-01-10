
import { GoogleGenAI } from "@google/genai";
import { KnowledgeFile, CaseData } from "../types";
import { REGULATORY_CONTEXT } from "../constants";

export const callGeminiAnalysis = async (
  caseName: string, 
  type: string, 
  description: string, 
  files: KnowledgeFile[] = []
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fileParts = files.map(file => ({
    inlineData: {
      data: file.data,
      mimeType: file.mimeType
    }
  }));

  const prompt = `案件名稱：${caseName}\n事件樣態：${type}\n描述：${description}\n\n請根據法規進行鑑定與建議。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [...fileParts, { text: prompt }] },
    config: {
      systemInstruction: REGULATORY_CONTEXT,
    },
  });

  return response.text;
};

export const callGeminiMeetingAssistant = async (
  type: 'agenda' | 'minutes',
  data: {
    caseName: string;
    description: string;
    phaseTitle: string;
    meetingTitle: string;
    agenda?: string;
    recordingData?: string;
    recordingMimeType?: string;
    transcript?: string;
  }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  if (type === 'agenda') {
    prompt = `請為以下案件草擬會議議程：\n案件：${data.caseName}\n背景：${data.description}\n目前階段：${data.phaseTitle}\n會議主題：${data.meetingTitle}`;
  } else {
    prompt = `請根據以下資訊生成會議紀錄：\n案件：${data.caseName}\n會議主題：${data.meetingTitle}\n原定議程：${data.agenda || "未提供"}\n\n來源逐字稿/錄音內容：\n${data.transcript || "請分析附件音檔"}`;
  }

  const parts: any[] = [{ text: prompt }];
  if (data.recordingData && data.recordingMimeType) {
    parts.push({
      inlineData: {
        data: data.recordingData,
        mimeType: data.recordingMimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: "你是一位專業的行政秘書，擅長撰寫結構嚴密且符合法律規範的會議議程與紀錄。請確保內容專業且符合性平會程序。",
    },
  });

  return response.text;
};

export const callGeminiReportGenerator = async (caseData: CaseData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const transcriptsText = caseData.transcripts?.map(t => `【證詞：${t.name}】\n${t.content}`).join("\n\n") || "尚無逐字稿。";

  // 根據使用者的選擇設定判定方向
  const resultDirection = caseData.investigationResult === 'substantiated' 
    ? "【本案判定方向：成立 (屬實)】" 
    : caseData.investigationResult === 'unsubstantiated' 
      ? "【本案判定方向：不成立 (不屬實)】" 
      : "【本案判定方向：由 AI 根據證詞中立判定】";

  const prompt = `請根據以下訪談逐字稿與案件資訊，生成一份正式的「校園性別事件調查報告」草案：

案件名稱：${caseData.name}
事件樣態：${caseData.incidentType}
初步描述：${caseData.description}

${resultDirection}

訪談內容匯整：
${transcriptsText}

報告撰寫指令：
1. 必須嚴格遵守上述之「判定方向」。
2. 若為「成立」：請詳述違法事實之認定理由，並根據防治準則提出具體之處置建議（如：記過、申誡、性平教育課程等）。
3. 若為「不成立」：請詳述證據不足或不符合法律要件之理由，並提出後續之輔導與保護措施建議。
4. 報告應包含正式結構：1. 案件概述 2. 調查過程 3. 事實認定 4. 理由與建議。
5. 使用正式、嚴謹的法律公文體裁。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: REGULATORY_CONTEXT + "\n你是一位資深的校園性平調查專員，負責撰寫結案報告草案。",
    },
  });

  return response.text;
};
