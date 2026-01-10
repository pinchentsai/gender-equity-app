
import { GoogleGenAI } from "@google/genai";
import { KnowledgeFile, CaseData } from "../types";
import { REGULATORY_CONTEXT } from "../constants";

/**
 * 內部診斷函數：確保 API Key 已正確注入
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    console.error("【時空警告】API_KEY 未定義。");
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
    console.error("【合規鑑定失敗】", error);
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
      prompt = `
請為以下「台灣校園性別事件」草擬一份結構嚴謹、符合實務需求且細緻的正式會議議程：

【案件基本資訊】
案件名稱：${data.caseName}
事件背景：${data.description || "未提供詳細背景"}
目前程序階段：${data.phaseTitle}
本次會議標題：${data.meetingTitle}

【議程撰寫要求】
1. 結構必須包含：
   一、 開會 (主席宣告開會及出席人數)。
   二、 主席致詞。
   三、 報告事項：
        - 案情通報及受理進度報告。
        - 說明校方已提供之保護措施（引用性平法第26條）。
   四、 討論事項：
        - 核心議題：針對「${data.description}」之事實查證方式進行研議。
        - 證據審核：討論目前掌握之監視錄影或證言之效力。
        - 程序審核：確認調查小組成員符合「性平法§33-2」之性別與專業比例。
   五、 臨時動議。
   六、 散會。
2. 用語應專業且具行政尊嚴。
`;
    } else {
      prompt = `
請根據以下來源生成「台灣校園性平會」正式會議紀錄：

【會議背景】
案件名稱：${data.caseName}
會議主題：${data.meetingTitle}

【來源資料】
${data.transcript || "請深度分析錄音數據"}

【紀錄要求】
1. 詳實記錄委員針對「事實有無」的發言要點。
2. 決議部分必須具備明確的法律效力用語。
`;
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
        systemInstruction: "你是一位精通台灣性平法與校園議事錄撰寫的資深專業秘書，語氣務必嚴謹、精準且具備公務邏輯。",
      },
    });

    return response.text;
  } catch (error) {
    console.error("【議事錄生成失敗】", error);
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一位資深的校園性平調查專家與法務顧問，擅長撰寫具備高度法律涵攝深度與事實論述能力的調查報告。你的目標是產出一份能經得起申復審議挑戰的專業報告草案。",
      },
    });

    return response.text;
  } catch (error) {
    console.error("【報告生成失敗】", error);
    throw error;
  }
};
