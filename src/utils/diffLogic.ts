import { diff_match_patch, Diff } from 'diff-match-patch';

export interface DiffResult {
  diffs: Diff[];
  score: number;
  accuracy: number;
  errors: ErrorAnalysis[];
}

export interface ErrorAnalysis {
  type: 'missing' | 'extra' | 'typo' | 'unknown';
  original: string;
  input?: string;
  reason: string;
}

// 移除标点符号，只保留字母、数字和空格
const removePunctuation = (text: string): string => {
  return text.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
};

export const calculateDiff = (original: string, input: string): DiffResult => {
  const dmp = new diff_match_patch();
  
  // 移除标点符号后进行对比（忽略标点问题）
  const cleanOriginal = removePunctuation(original);
  const cleanInput = removePunctuation(input);
  
  // Semantic cleanup ensures readability
  const diffs = dmp.diff_main(cleanInput, cleanOriginal);
  dmp.diff_cleanupSemantic(diffs);

  let correctChars = 0;
  let totalChars = cleanOriginal.length; // 使用清理后的长度
  const errors: ErrorAnalysis[] = [];

  diffs.forEach((part) => {
    const [type, text] = part;
    if (type === 0) { // Equal
      correctChars += text.length;
    } else if (type === 1) { // Insert (in original, missing in input) -> Actually type 1 in dmp is Insertion into input?
      // Wait, dmp.diff_main(text1, text2) -> 
      // -1: deletion from text1
      // +1: insertion to text1 (present in text2)
      // 0: equality
      // If I use diff_main(input, original):
      // -1 means present in Input but not Original (Extra)
      // +1 means present in Original but not Input (Missing)
    }
  });

  // Let's re-iterate with correct logic
  // diff_main(input, original)
  // -1: Deleted from input (Extra words user typed)
  // +1: Added to input (Missing words user didn't type)
  // 0: Correct

  diffs.forEach((part) => {
    const [type, text] = part;
    if (type === 1) { // Missing in input (present in original)
       // Check if it's just punctuation or spaces
       if (/[a-zA-Z0-9]/.test(text)) {
         errors.push({
           type: 'missing',
           original: text,
           reason: '没听出来或漏写了'
         });
       }
    } else if (type === -1) { // Extra in input
       if (/[a-zA-Z0-9]/.test(text)) {
         errors.push({
           type: 'extra',
           original: text, // This is actually what user typed
           reason: '多写了或听错了'
         });
       }
    }
  });
  
  // Heuristic for Typos (simplistic: if missing and extra are adjacent)
  // This is a simplified approach. Real typo detection needs alignment.
  // We will keep it simple for the MVP: Just show diffs.

  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
  const score = Math.max(0, accuracy); // Ensure no negative

  return {
    diffs,
    score,
    accuracy,
    errors
  };
};

export const predictErrorReason = (diffs: Diff[]): string[] => {
   // 生成智能化的错误分析反馈
   const feedback: string[] = [];
   const missingWords: string[] = [];
   const extraWords: string[] = [];
   const missingPunctuation: string[] = [];
   
   diffs.forEach(([type, text]) => {
     if (type === 1) { // Missing in user input
       if (/[a-zA-Z]+/.test(text)) {
         const words = text.match(/[a-zA-Z]+/g) || [];
         missingWords.push(...words);
       }
       if (/[,;:.!?]/.test(text)) {
         const puncts = text.match(/[,;:.!?]/g) || [];
         missingPunctuation.push(...puncts);
       }
     } else if (type === -1) { // Extra in user input
       if (/[a-zA-Z]+/.test(text)) {
         const words = text.match(/[a-zA-Z]+/g) || [];
         extraWords.push(...words);
       }
     }
   });

   // 分析错误类型
   
   // 1. 漏词分析
   if (missingWords.length > 0) {
     if (missingWords.length === 1) {
       feedback.push(`❌ 漏掉了 "${missingWords[0]}"：可能是连读、弱读导致没听清楚`);
     } else if (missingWords.length <= 3) {
       feedback.push(`❌ 漏掉了 ${missingWords.length} 个词 (${missingWords.join(', ')})：建议放慢语速，逐词仔细听`);
     } else {
       feedback.push(`❌ 漏掉了 ${missingWords.length} 个词：建议分段练习，先听懂句子大意再补充细节`);
     }
     
     // 检查是否是常见弱读词
     const weakFormWords = ['a', 'an', 'the', 'to', 'of', 'and', 'or', 'in', 'on', 'at', 'for', 'with'];
     const missedWeakWords = missingWords.filter(w => weakFormWords.includes(w.toLowerCase()));
     if (missedWeakWords.length > 0) {
       feedback.push(`💡 提示：遗漏的 "${missedWeakWords.join(', ')}" 是常见弱读词，在句子中通常发音很轻`);
     }
     
     // 检查是否是复杂词汇
     const complexWords = missingWords.filter(w => w.length > 8);
     if (complexWords.length > 0) {
       feedback.push(`📚 词汇提升：建议加强 "${complexWords.join(', ')}" 等长词的发音练习`);
     }
   }

   // 2. 多词分析
   if (extraWords.length > 0) {
     if (extraWords.length === 1) {
       feedback.push(`➕ 多写了 "${extraWords[0]}"：可能是听错或脑补了，建议再听一遍确认`);
     } else {
       feedback.push(`➕ 多写了 ${extraWords.length} 个词 (${extraWords.slice(0, 3).join(', ')}...)：注意不要过度联想，以实际听到的为准`);
     }
   }

   // 3. 拼写错误分析（同时有漏词和多词，可能是拼写错误）
   if (missingWords.length > 0 && extraWords.length > 0) {
     // 检查是否是相似单词混淆
     const possibleConfusions = findSimilarWords(missingWords, extraWords);
     if (possibleConfusions.length > 0) {
       possibleConfusions.forEach(([correct, wrong]) => {
         feedback.push(`🔄 可能混淆：把 "${correct}" 听成了 "${wrong}"，注意区分发音`);
       });
     }
   }

   // 4. 标点符号分析
   if (missingPunctuation.length > 0) {
     feedback.push(`⚠️ 标点建议：缺少 ${missingPunctuation.length} 个标点符号，注意语调变化和停顿`);
   }

   // 5. 根据错误率给出学习建议
   const totalErrors = missingWords.length + extraWords.length;
   if (totalErrors >= 5) {
     feedback.push(`📝 学习建议：错误较多，建议先放慢语速（0.5-0.75x）多听几遍，熟悉后再提速`);
   }

   if (feedback.length === 0) {
     feedback.push("🎉 完美！完全正确，继续保持！");
   }

   return feedback;
}

// 找出可能混淆的相似单词
const findSimilarWords = (correctWords: string[], wrongWords: string[]): [string, string][] => {
  const confusions: [string, string][] = [];
  
  correctWords.forEach(correct => {
    wrongWords.forEach(wrong => {
      // 编辑距离小，可能是混淆词
      if (levenshteinDistance(correct.toLowerCase(), wrong.toLowerCase()) <= 2) {
        confusions.push([correct, wrong]);
      }
    });
  });
  
  return confusions;
}

// 计算编辑距离（Levenshtein Distance）
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

