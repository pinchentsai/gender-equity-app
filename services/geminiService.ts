
import { GoogleGenAI } from "@google/genai";
import { KnowledgeFile, CaseData } from "../types";
import { REGULATORY_CONTEXT } from "../constants";

/**
 * 內部診斷函數：確保 API Key 已正確注入
 * Fix: Always use process.env.API_KEY directly in the named parameter.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    // Basic analysis task uses gemini-3-flash-preview.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [...fileParts, { text: prompt }] },
      config: {
        systemInstruction: REGULATORY_CONTEXT,
      },
    });

    return response.text;
  } catch (error) {
    console.error("【合規鑑定失敗】", error);
    throw error;
  }
};

export const callGeminiReportGenerator = async (caseData: CaseData) => {
  try {
    const ai = getAiClient();
    const transcriptsText = caseData.transcripts?.map(t => `【證詞：${t.name}】\n${t.content}`).join("\n\n") || "尚無訪談紀錄。";

    const resultDirection = caseData.investigationResult === 'substantiated' 
      ? "【判定結論：性別事件成立】" 
      : caseData.investigationResult === 'unsubstantiated' 
        ? "【判定結論：性別事件不成立】" 
        : "【判定方向：請根據證詞進行中立客觀之事實認定與判定】";

    const prompt = `
請根據以下訪談逐字稿及案件資料，撰寫一份極具專業深度、論述詳盡的「校園性別事件調查報告書」草案：

【一、 案件基本資料】
案件名稱：${caseData.name}
事件樣態：${caseData.incidentType}
初步背景：${caseData.description}
判定方向指引：${resultDirection}

【二、 訪談證據來源】
${transcriptsText}

【三、 報告撰寫核心指令 - 務必包含以下章節】

1. 案由與程序說明：
   - 簡述收案經過、調查小組組成是否合法（性別及專業比例）。

2. 事實認定與證詞論述（此部分需詳盡）：
   - 摘要申請人與行為人之主張。
   - 針對爭議點，提取證詞中的一致性或矛盾點進行交叉比對。
   - 詳盡敘述經過調查後認定之具體事實。

3. 法律涵攝分析（核心部分）：
   - **這是報告最重要的部分。** 請引用《性別平等教育法》及《校園性別事件防治準則》相關條文。
   - 將「認定之事實」逐一對比法律構成要件（例如：是否違反意願、是否具性本質或性別歧視、是否造成敵意環境等）。
   - 詳細解釋為何該事實「構成」或「不構成」法規所定義之樣態。

4. 調查結論與處置建議：
   - 若成立：請依嚴重程度建議具體的懲處（記過、申誡等）及教育性處置（性平課程、諮商）。
   - 若不成立：請說明不成立理由，並建議校方後續之輔導或環境修復措施。

【撰寫風格】
- 語氣必須具備專業法理、冷靜、客觀。
- 嚴禁使用情緒化字眼。
- 採用台灣標準校園性平調查報告之書面體裁。
`;

    // Complex legal reasoning task: use gemini-3-pro-preview for higher quality reasoning.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一位資深的校園性平調查專家與法務顧問，擅長撰寫具備高度法律涵攝深度與事實論述能力的調查報告. 你的目標是產出一份能經得起申復審議挑戰的專業報告草案。",
      },
    });

    return response.text;
  } catch (error) {
    console.error("【報告生成失敗】", error);
    throw error;
  }
};
