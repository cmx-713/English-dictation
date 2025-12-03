import { SentenceResult } from '../components/PracticeScreen';

// 必须和 HistoryScreen.tsx 里的 key 保持完全一致
const STORAGE_KEY = 'dictation_records';

export interface HistoryRecord {
  id: string;
  timestamp: number;
  rawText: string;
  results: SentenceResult[];
}

export const saveRecord = (rawText: string, results: SentenceResult[]) => {
  try {
    // 1. 读取旧记录
    const existingData = localStorage.getItem(STORAGE_KEY);
    let records: HistoryRecord[] = [];
    
    if (existingData) {
      records = JSON.parse(existingData);
    }

    // 2. 构造新记录
    const newRecord: HistoryRecord = {
      id: Date.now().toString(), // 使用时间戳作为唯一ID
      timestamp: Date.now(),
      rawText: rawText,
      results: results
    };

    // 3. 添加到开头 (最新的排前面)
    records.unshift(newRecord);

    // 4. 保存回 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    console.log('练习记录保存成功:', newRecord); // 方便调试
  } catch (error) {
    console.error('保存练习记录失败:', error);
  }
};

export const getRecords = (): HistoryRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取练习记录失败:', error);
    return [];
  }
};

export const clearRecords = () => {
  localStorage.removeItem(STORAGE_KEY);
};