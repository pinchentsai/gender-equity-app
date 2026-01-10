
import { GoogleGenAI } from "@google/genai";
import { KnowledgeFile, CaseData } from "../types";
import { REGULATORY_CONTEXT } from "../constants";

/**
 * 內部診斷函數：確保 API Key 已正確從 Vite/環境變數注入
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    console.error("【時空警告】API_KEY 未定義。請檢查 GitHub Secrets 是否設定為 API_KEY，且 deploy.yml 已正確映射。");
    throw new Error("Missing API Key");
  }
  return new GoogleGenAI({ apiKey });
};

export const callGeminiAnalysis = async (
  caseName: string, 
  type: string, 
  description: string, 
  files: KnowledgeFile[] = []
) => {
  try {
    const ai = getAiClient();
    const fileParts = files.map(file => ({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    }));

    const prompt = `案件名稱：${caseName}\n事件樣態：${type}\n描述：${description}\n\n請根據法規進行鑑定與建議。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [...fileParts, { text: prompt }] },
      config: {
        systemInstruction: REGULATORY_CONTEXT,
      },
    });

    return response.text;
  } catch (error) {
    console.error("【合規鑑定失敗】詳細錯誤：", error);
    throw error;
  }
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
  try {
    const ai = getAiClient();
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
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: "你是一位專業的行政秘書，擅長撰寫結構嚴密且符合法律規範的會議議程與紀錄。請確保內容專業且符合性平會程序。",
      },
    });

    return response.text;
  } catch (error) {
    console.error("【議事錄生成失敗】詳細錯誤：", error);
    throw error;
  }
};

export const callGeminiReportGenerator = async (caseData: CaseData) => {
  try {
    const ai = getAiClient();
    const transcriptsText = caseData.transcripts?.map(t => `【證詞：${t.name}】\n${t.content}`).join("\n\n") || "尚無逐字稿。";

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
2. 若為「成立」：請詳述違法事實之認定理由，並根據防治準則提出具體之處置建議。
3. 若為「不成立」：請詳述理由，並提出後續之輔導措施。
4. 使用正式公文體裁。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: REGULATORY_CONTEXT + "\n你是一位資深的校園性平調查專員，負責撰寫結案報告草案。",
      },
    });

    return response.text;
  } catch (error) {
    console.error("【報告生成失敗】詳細錯誤：", error);
    throw error;
  }
};
