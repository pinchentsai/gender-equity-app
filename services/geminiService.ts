
import { GoogleGenAI } from "@google/genai";
import { KnowledgeFile, CaseData, InterviewTranscript } from "../types";

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

  const systemInstruction = `你是一位資長的校園性別事件合規審查專家。
【任務核心】
1. 請嚴格參考《性別平等教育法》及《校園性別事件防治準則》。
2. 針對使用者上傳的 PDF 知識庫（校內防治準則），進行精準的規範對齊。
3. 你的分析報告必須專業、客觀，並提供法律實務上的具體建議。`;

  const promptText = `
【待審案件資訊】
案件名稱：${caseName}
初步判定樣態：${type}
具體情境描述：${description}

請結合附件中的法規知識庫內容，為我生成一份專業的合規性鑑定與處置建議。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...fileParts,
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      },
    });

    return response.text || "無法生成分析結果，可能因內容涉及敏感詞彙被 AI 安全機制攔截。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const callGeminiMeetingAssistant = async (
  mode: 'agenda' | 'minutes',
  context: {
    caseName: string;
    description: string;
    phaseTitle: string;
    meetingTitle?: string;
    agenda?: string;
    recordingData?: string;
    recordingMimeType?: string;
    transcript?: string;
  }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `你是一位專業的性平會秘書長。請依據提供的資訊撰寫正式的會議文書。請使用繁體中文，保持正式的法律公文口吻。`;

  let prompt = "";
  const parts: any[] = [];

  if (mode === 'agenda') {
    prompt = `
【案件背景】
名稱：${context.caseName}
描述：${context.description}
目前進度：${context.phaseTitle}

【本次會議主題】
${context.meetingTitle || "未指定特定主題"}

請擬定一份專業且具體可行的會議議程。
    `;
  } else {
    prompt = `
【會議紀錄生成】
主題：${context.meetingTitle}
原定議程：${context.agenda}
${context.transcript ? `【提供之逐字稿內容】：\n${context.transcript}\n` : ""}
錄音內容（若有）已附上。請生成正式的會議紀錄，含摘要與決議事項。
    `;
    if (context.recordingData && context.recordingMimeType) {
      parts.push({
        inlineData: {
          data: context.recordingData,
          mimeType: context.recordingMimeType
        }
      });
    }
  }

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { systemInstruction, temperature: 0.2 },
    });
    return response.text || "無法自動生成內容。";
  } catch (error) {
    console.error("Meeting Assistant Error:", error);
    throw error;
  }
};

export const callGeminiReportGenerator = async (
  caseData: CaseData
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 特別聲明專業場景以減少安全機制誤判
  const systemInstruction = `【專業角色聲明】
你現在是一位具備法律背景的「校園性別事件專業調查員」。
你正在處理的是一份嚴肅的行政調查文書，請以中立、客觀、且完全符合《性別平等教育法》格式的語氣撰寫報告。
這是一個專業的教育與法律輔助場景，請協助分析事實而不進行道德評判。`;

  const transcriptsContent = caseData.transcripts
    .map(t => `【訪談對象：${t.name}】\n${t.content}`)
    .join('\n\n---\n\n');

  const prompt = `
請根據以下提供的案件資訊與多份訪談逐字稿，撰寫一份結構完整的「調查報告草案」。

【案件基本資訊】
案件名稱：${caseData.name}
事件類型：${caseData.incidentType}
事件初步描述：${caseData.description}

【訪談逐字稿實錄】
${transcriptsContent}

報告架構應包含：
1. 申請人與行為人之陳述要旨（請比對雙方說詞）。
2. 調查小組認定之事實及理由（交互檢驗證詞之可信度）。
3. 具體處理建議（行政處分、心理輔導或教育處置）。

請使用繁體中文撰寫。
  `;

  try {
    // 移除 knowledgeFiles 附件，因為 Base64 數據量過大會導致請求失敗
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: { 
        systemInstruction, 
        temperature: 0.1 
      },
    });

    const resultText = response.text;
    if (!resultText) {
      // 檢查是否被安全機制攔截
      return "【AI 系統提示】報告生成被攔截。這通常是因為訪談內容中包含過於露骨的詞彙，請嘗試手動摘要部分敏感字眼後再重新生成，或檢查 API Key 是否有正確配置。";
    }
    return resultText;
  } catch (error) {
    console.error("Report Generation Error:", error);
    throw error;
  }
};
