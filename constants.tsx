
import React from 'react';
import { 
  AlertTriangle, FileText, Users, CheckSquare, 
  ShieldAlert, Activity, Search, ClipboardCheck, 
  MessageCircle, Scale, Archive, Compass, Moon, Zap, Eye, Sword, Key
} from 'lucide-react';
import { Phase } from './types';

export const PHASES_DATA: Phase[] = [
  {
    id: 1,
    title: "第一星軌：知悉與法定通報 (危機處理與協助)",
    color: "bg-[#e6fffa] border-[#81d8d0]",
    iconName: "Compass",
    tasks: [
      { 
        id: "1.1", 
        text: "獲知疑似事件 (申請調查或檢舉)", 
        note: "任何人知悉應立即通報學校權責人員。", 
        unit: "學務處" 
      },
      { 
        id: "1.2", 
        text: "【重要】法定通報 (社政及教育主管機關)", 
        note: "性平法§22-1: 24小時內 向社政主管機關 (性侵害/兒少保護/身障) 及學校主管機關 (校安) 通報。", 
        unit: "學務處", 
        deadlineRef: "report", 
        important: true 
      },
      { 
        id: "1.3", 
        text: "告知當事人 (含家長) 權益與救濟途徑", 
        note: "應提供書面資料包含心理輔導、法律諮詢、救濟管道等資訊。", 
        unit: "" 
      },
      { 
        id: "1.4", 
        text: "啟動提供必要之協助服務", 
        note: "防治準則§26: 依當事人需求提供心理諮商與輔導、保護措施、法律協助等. 後須於性平會上追認。", 
        unit: "" 
      },
    ]
  },
  {
    id: 2,
    title: "第二星軌：受理程序及決定判準",
    color: "bg-[#f0fff4] border-[#81d8d0]",
    iconName: "Eye",
    tasks: [
      { 
        id: "2.1", 
        text: "初步審查 (收件與不受理認定)", 
        note: "性平法§32-2: 不受理情形(非本法事項、匿名、同一事件已處理完畢)。必要時可組3人以上小組認定 (防治準則§19-3)。", 
        unit: "學務處/性平會三人小組" 
      },
      { 
        id: "2.2", 
        text: "移送性平會", 
        note: "性平法§33-1: 除不受理情形外，應於3日內 將事證資料移交性平會。", 
        unit: "學務處" 
      },
      { 
        id: "2.3", 
        text: "召開性平會", 
        note: "1.認定是否受理、審查不予受理情形。\n2.若無人申請，需討論是否要以檢舉案啟動調查(待家長交回同意不調查聲明書後再召開性平會)。\n3.決定受理，啟動調查程序。\n4.決議成立調查小組，確認調查小組成員符合法定要求。\n5.當事人輔導人員、性平會主管/承辦人應迴避調查工作。\n6.議決危機處置與保護措施。\n性平法§32-2: 不受理情形(非本法事項、匿名、同一事件已處理完畢)。\n性平法§33-2: 行為人為校長/教職工，應全部外聘。一般案件女性≥1/2，專家學者≥1/3。\n性平法§33-4: 若為跨校案件，應有被害人現所屬學校代表參與調查。\n防治準則§26-3: 必要處置應經性平會決議通過後執行。", 
        unit: "性平會",
        deadlineRef: "meetingDecide" 
      },
      { 
        id: "2.4", 
        text: "書面通知當事人 (是否受理)", 
        note: "性平法§32-1: 應於20日內 以書面通知申請人/被害人/檢舉人是否受理，不受理應敘明理由。", 
        unit: "學務處" 
      }
    ]
  },
  {
    id: 3,
    title: "第三星軌：調查程序",
    color: "bg-[#f7fafc] border-[#81d8d0]",
    iconName: "Key",
    tasks: [
      { 
        id: "3.1", 
        text: "調查訪談前置作業", 
        note: "1.跟委員約日期。\n2.會前會，確認訪談人員。\n3.發公文給委員。\n4.製作各式表單。\n5.借調查場地。", 
        unit: "學校名義 (承辦人)" 
      },
      { 
        id: "3.2", 
        text: "通知當事人/相關人配合調查", 
        note: "性平法§33-5: 行為人、申請人及受邀協助調查之人或單位，應予配合，並提供相關資料，不得規避、妨礙 or 拒絕。\n性平法§43-4: 行為人無正當理由不配合調查可處罰鍰。", 
        unit: "" 
      },
      { 
        id: "3.3", 
        text: "訪談環境安排", 
        note: "1.規劃當事人家長等候區(需隔開)。\n2.委員茶水？\n3.法規、校安通報、白紙、筆、錄音筆、各式表單。", 
        unit: "" 
      },
      { 
        id: "3.4", 
        text: "進行調查訪談", 
        note: "(給予當事人充分答辯機會)\n性平法§23-1: 秉客觀、公正、專業原則，避免重複詢問。應衡酌雙方權力差距 (性平法施細則§16)。", 
        unit: "調查小組" 
      },
      { 
        id: "3.5", 
        text: "製作訪談逐字稿", 
        note: "防治準則§24-11: 可用錄音輔助，應朗讀/閱覽後簽名確認無誤。", 
        unit: "調查小組/承辦人" 
      },
      { 
        id: "3.6", 
        text: "保密與檔案處理", 
        note: "防治準則§25-3: 原始文書應封存；對外製作文書應刪除真實姓名並以代號為之。不得要求當事人簽署保密切結書 (Q&A 203)。", 
        unit: "全體參與人員" 
      },
      { 
        id: "3.7", 
        text: "撰寫調查報告", 
        note: "內容應包含事實認定及理由、處理建議 (性平法施細則§17)。", 
        unit: "調查小組",
        deadlineRef: "investigation" 
      },
    ]
  },
  {
    id: 4,
    title: "第四星軌：調查結果與報告",
    color: "bg-[#fffaf0] border-[#81d8d0]",
    iconName: "Zap",
    tasks: [
      { 
        id: "4.1", 
        text: "性平會審議調查報告 (事實認定)", 
        note: "性平法§41-1：學校應依據性平會調查報告之事實認定。", 
        unit: "性平會" 
      },
      { 
        id: "4.2", 
        text: "通知行為人陳述意見 (涉及身分改變)", 
        note: "性平法§26-5：懲處涉及身分改變時應給予書面陳述意見機會。", 
        unit: "學校/主管機關" 
      },
      { 
        id: "4.3", 
        text: "決議對行為人所為之懲處及處置措施", 
        note: "性平法§26-2：處置措施包括心理諮商、道歉（需被害人同意）、8小時性平課程等", 
        unit: "性平會" 
      },
      { 
        id: "4.4", 
        text: "性平會審酌陳述意見 (若有提出)", 
        note: "防治準則§30-3：審酌後除有重大瑕疵/新事證，不得重新調查。", 
        unit: "性平會" 
      },
      { 
        id: "4.5", 
        text: "報所屬主管機關 (結案資料)", 
        note: "防治準則§40-1：調查報告經性平會議決後，應報所屬主管機關。", 
        unit: "學校專責單位" 
      },
    ]
  },
  {
    id: 5,
    title: "第五星軌：懲處與處置執行",
    color: "bg-[#faf5ff] border-[#81d8d0]",
    iconName: "Sword",
    tasks: [
      { 
        id: "5.1", 
        text: "權責單位議處", 
        note: "性平法§36-3：學校/主管機關應於接獲報告後2個月內 自行或移送議處。", 
        unit: "權責機關 (如教評會/獎懲會)" 
      },
      { 
        id: "5.2", 
        text: "通知被害人陳述意見 (議處決定前)", 
        note: "防治準則§30-6：議處決定前，應通知被害人/法定代理人/實際照顧者限期陳述意見。", 
        unit: "權責單位" 
      },
      { 
        id: "5.3", 
        text: "書面通知處理結果", 
        note: "性平法§36-3/防治準則§32-1：應通知申請人、被害人、檢舉人及行為人，並一併提供調查報告。(含事實認定、處置措施及議處結果事實、理由)，並告知申復之期限及受理之學校或機關。", 
        unit: "學校名義 (承辦人)" 
      },
      { 
        id: "5.4", 
        text: "執行懲處及處置 (依權責單位議處結果)", 
        note: "性平法§26-1：依相關法律或法規規定執行。\n性平法§26-2：應命行為人接受。\n性平法§26-6：應採取必要措施確保配合遵守，不配合者應報請主管機關裁罰。", 
        unit: "相關單位/人事室" 
      },
    ]
  },
  {
    id: 6,
    title: "第六星軌：申復及救濟程序",
    color: "bg-[#ebf8ff] border-[#81d8d0]",
    iconName: "Scale",
    tasks: [
      { 
        id: "6.1", 
        text: "申復提出 (不服處理結果)", 
        note: "性平法§37-1：收到通知次日起30日內，向學校/主管機關申復，以一次為限 (性平法§37-2)。", 
        unit: "當事人" 
      },
      { 
        id: "6.2", 
        text: "申復審議 (組審議小組)", 
        note: "防治準則§32-4：審議小組應於30日內 作成決定並通知申復人。原性平會委員及調查小組成員不得擔任。", 
        unit: "學校/主管機關申復審議小組" 
      },
      { 
        id: "6.3", 
        text: "申復有理由，要求性平會重新調查", 
        note: "性平法§37-3：僅限調查程序有重大瑕疵或有新事實、新證據。", 
        unit: "" 
      },
      { 
        id: "6.4", 
        text: "提起救濟 (不服申復結果)", 
        note: "性平法§39-1：收到申復決定次日起30日內，依身分別 (教師/學生) 提起申訴/訴願等。", 
        unit: "當事人" 
      },
    ]
  },
  {
    id: 7,
    title: "第七星軌：追蹤與結案",
    color: "bg-[#f0f4f8] border-[#81d8d0]",
    iconName: "Archive",
    tasks: [
      { 
        id: "7.1", 
        text: "通報與追蹤輔導 (轉校/轉職追蹤)", 
        note: "性平法§28-2/3：行為人轉校/轉職應通報，持續追蹤輔導。", 
        unit: "學校專責單位" 
      },
      { 
        id: "7.2", 
        text: "追蹤輔導評估與結案", 
        note: "應於完成所有處置及追蹤輔導評估後 方得結案 (Q&A 67, 68)。", 
        unit: "學校專責單位" 
      },
      { 
        id: "7.3", 
        text: "檔案建立與保存 (原始檔案與報告檔案)", 
        note: "防治準則§34-1：應指定專責單位保存25年。", 
        unit: "學校專責單位" 
      },
    ]
  }
];

export const getIcon = (name: string) => {
  const commonClasses = "w-5 h-5 text-tiffany-deep";
  switch (name) {
    case "Compass": return <Compass className={commonClasses} />;
    case "Eye": return <Eye className={commonClasses} />;
    case "Key": return <Key className={commonClasses} />;
    case "Zap": return <Zap className={commonClasses} />;
    case "Sword": return <Sword className={commonClasses} />;
    case "Archive": return <Archive className={commonClasses} />;
    case "Scale": return <Scale className={commonClasses} />;
    case "MessageCircle": return <MessageCircle className={commonClasses} />;
    default: return <Moon className={commonClasses} />;
  }
};

export const REGULATORY_CONTEXT = `
你是一位精通台灣《性別平等教育法》與《校園性別事件防治準則》的專業法律顧問。
你的回答必須符合 113 年最新修正之法條規範：
1. 嚴格定義：分析性侵害、性騷擾、性霸凌之法律構成要件。
2. 時效檢核：通報(24小時)、受理決定(20日)、調查完成(2個月)。
3. 程序正義：調查小組成員組成比例及專業性。
請保持專業、冷靜且客觀的法律口吻，並引用具體條文編號。
`;
