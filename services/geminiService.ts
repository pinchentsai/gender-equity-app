
import { GoogleGenAI } from "@google/genai";
import { KnowledgeFile, CaseData, InterviewTranscript } from "../types";

// Fix: Moved GoogleGenAI initialization inside functions to ensure a fresh instance per call as per SDK recommendations
export const callGeminiAnalysis = async (
  caseName: string, 
  type: string, 
  description: string, 
  files: KnowledgeFile[] = []
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 準備檔案部分
  const fileParts = files.map(file => ({
    inlineData: {
      data: file.data,
      mimeType: file.mimeType
    }
  }));

  const systemInstruction = `你是一位資深的校園性別事件合規審查專家。
【任務核心】
1. 請嚴格參考《性別平等教育法》及《校園性別事件防治準則》。
2. 針對使用者上傳的 PDF 知識庫（校內防治準則），進行精準的規範對齊。
3. 你的分析報告必須專業、客觀，並提供法律實務上的具體建議。

【報告架構】
- 法規要件分析：目前的行為描述是否符合特定樣態之定義？
- 程序合規檢核：目前的處理步驟是否符合法定程序與時效？
- 後續處置建議：根據法規與校內準則，下一步應執行的關鍵步驟與注意事項。`;

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
        temperature: 0.1, // 極低溫度以確保法律準確性
      },
    });

    return response.text || "無法生成分析結果，請確認輸入內容或 PDF 文件是否有效。";
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
    agenda?: string;
    recordingData?: string;
    recordingMimeType?: string;
    transcript?: string;
  }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `你是一位專業的性平會秘書長，精通《性別平等教育法》。
你的職責是撰寫正式的會議文書。
1. 議程模式：需包含法律依據、議案討論（如受理審查、調查小組組成、保護措施等）。
2. 紀錄模式：需根據提供的議程草案與（錄音內容 或 逐字稿文本），整理成結構清晰、用字精確的會議紀錄。
請使用繁體中文，保持正式的法律公文口吻。`;

  let prompt = "";
  const parts: any[] = [];

  if (mode === 'agenda') {
    prompt = `
【案件背景】
名稱：${context.caseName}
描述：${context.description}
目前階段：${context.phaseTitle}

請為此階段擬定一份專業的會議議程。議程需符合當前進度與法定程序。
    `;
  } else {
    prompt = `
【會議紀錄生成】
原定議程：${context.agenda}
${context.transcript ? `【提供之逐字稿內容】：\n${context.transcript}\n` : ""}
錄音內容（若有）已附上。請結合上述參考資料與議程，生成正式的會議紀錄。
內容需包含：會議重點摘要、決議事項。
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
    return response.text;
  } catch (error) {
    console.error("Meeting Assistant Error:", error);
    throw error;
  }
};

export const callGeminiReportGenerator = async (
  caseData: CaseData,
  knowledgeFiles: KnowledgeFile[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `你是一位專業的校園性別事件調查員，精通《性別平等教育法》。
你的任務是根據多份訪談逐字稿，撰寫一份正式的調查報告。
報告架構必須包含：
1. 申請人/被害人、行為人之陳述要旨。
2. 調查小組認定之事實及理由（需交互比對訪談紀錄）。
3. 處理建議（含行政懲處、性平教育處置或其他必要處置）。
請使用嚴謹、中立、且符合法律公文格式之繁體中文撰寫。`;

  const transcriptsContent = caseData.transcripts
    .map(t => `【訪談對象：${t.name}】\n${t.content}`)
    .join('\n\n---\n\n');

  const prompt = `
【案件基本資訊】
案件名稱：${caseData.name}
事件類型：${caseData.incidentType}
初步描述：${caseData.description}

【訪談逐字稿集錦】
${transcriptsContent}

請依據上述資料，草擬一份完整的調查報告草案。
  `;

  const fileParts = knowledgeFiles.map(file => ({
    inlineData: {
      data: file.data,
      mimeType: file.mimeType
    }
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...fileParts,
          { text: prompt }
        ]
      },
      config: { systemInstruction, temperature: 0.1 },
    });
    return response.text;
  } catch (error) {
    console.error("Report Generation Error:", error);
    throw error;
  }
};
