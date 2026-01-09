
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

  const prompt = `請根據以下訪談逐字稿與案件資訊，生成一份正式的「校園性別事件調查報告」草案：\n\n案件：${caseData.name}\n樣態：${caseData.incidentType}\n初步描述：${caseData.description}\n\n訪談內容匯整：\n${transcriptsText}\n\n報告應包含：1. 案件概述 2. 調查過程 3. 事實認定 4. 理由與建議處置。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: REGULATORY_CONTEXT + "\n請以正式、嚴謹的法律公文體裁撰寫報告。",
    },
  });

  return response.text;
};
