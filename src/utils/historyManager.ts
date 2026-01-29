import { SentenceResult } from '../components/PracticeScreen';
import { supabase } from '../lib/supabase';
import { 
  analyzeResults, 
  getDeviceInfo, 
  getTimeInfo, 
  analyzeTextDifficulty 
} from './analyticsHelper';

// 必须和 HistoryScreen.tsx 里的 key 保持完全一致
const STORAGE_KEY = 'dictation_records';

export interface HistoryRecord {
  id: string;
  timestamp: number;
  rawText: string;
  results: SentenceResult[];
}

export const saveRecord = (
  rawText: string, 
  results: SentenceResult[],
  metadata?: {
    inputMethod?: 'voice' | 'text' | 'image';
    durationSeconds?: number;
  }
) => {
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

    // 5. 分析数据
    const statistics = analyzeResults(rawText, results);
    const deviceInfo = getDeviceInfo();
    const timeInfo = getTimeInfo();
    const textInfo = analyzeTextDifficulty(rawText);

    // 6. 尝试同步到 Supabase (不阻塞主流程)
    const cloudRecord = {
      raw_text: rawText,
      results: results,
      created_at: new Date(newRecord.timestamp).toISOString(),
      
      // 统计数据
      total_sentences: statistics.totalSentences,
      correct_sentences: statistics.correctSentences,
      accuracy_rate: statistics.accuracyRate,
      total_words: statistics.totalWords,
      correct_words: statistics.correctWords,
      average_score: statistics.averageScore,
      
      // 文本信息
      text_difficulty: textInfo.difficulty,
      text_length: textInfo.textLength,
      text_word_count: textInfo.totalWords,
      
      // 设备信息
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      screen_resolution: deviceInfo.screenResolution,
      
      // 时间信息
      time_of_day: timeInfo.timeOfDay,
      day_of_week: timeInfo.dayOfWeek,
      is_weekend: timeInfo.isWeekend,
      
      // 输入方式
      input_method: metadata?.inputMethod || 'text',
      duration_seconds: metadata?.durationSeconds,
      
      // 详细分析（JSON格式）
      error_summary: statistics.errorTypes,
      difficult_sentences: statistics.difficultSentences,
      text_analysis: textInfo,
    };

    supabase.from('practice_records').insert(cloudRecord).then(({ error }) => {
      if (error) {
        console.error('同步到云端失败:', error);
        console.log('失败的记录:', cloudRecord);
      } else {
        console.log('同步到云端成功，包含详细分析数据');
      }
    });

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