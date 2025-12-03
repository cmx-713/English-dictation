export interface Sentence {
  id: string;
  text: string;
  startTime?: number; // For audio alignment if we had it
  endTime?: number;
  userAnswer?: string;
  isCompleted: boolean;
}

// 智能分句：根据标点和意群分割文本
export const splitTextIntoSentences = (text: string): Sentence[] => {
  if (!text) return [];

  // 标准化空格
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // 第一步：按照句子终止符分割（. ! ? 等）
  // 避免常见缩写词的误分割
  const abbreviations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Sr.', 'Jr.', 'vs.', 'etc.', 'e.g.', 'i.e.', 'Inc.', 'Ltd.', 'Co.'];
  let processedText = cleanText;
  
  // 暂时替换缩写词中的句号，避免误分割
  abbreviations.forEach((abbr, idx) => {
    const placeholder = `<ABB${idx}>`;
    processedText = processedText.replace(new RegExp(abbr.replace('.', '\\.'), 'gi'), placeholder);
  });

  // 按句子终止符分割
  const rawSentences = processedText.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [processedText];

  // 恢复缩写词
  const sentences = rawSentences.map(s => {
    let restored = s;
    abbreviations.forEach((abbr, idx) => {
      const placeholder = `<ABB${idx}>`;
      restored = restored.replace(new RegExp(placeholder, 'g'), abbr);
    });
    return restored.trim();
  });

  // 第二步：对长句子进行意群分割
  const finalSegments: string[] = [];
  sentences.forEach(sentence => {
    if (shouldSplitByMeaningGroup(sentence)) {
      const chunks = splitByMeaningGroup(sentence);
      finalSegments.push(...chunks);
    } else {
      finalSegments.push(sentence);
    }
  });

  return finalSegments
    .filter(s => s.length > 0)
    .map((segment, index) => ({
      id: `s-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: segment.trim(),
      isCompleted: false,
      userAnswer: ''
    }));
};

// 判断是否需要按意群分割（长句子）
const shouldSplitByMeaningGroup = (sentence: string): boolean => {
  const wordCount = sentence.split(/\s+/).length;
  const charCount = sentence.length;
  // 超过12个单词或80个字符的句子需要分割（降低阈值，更积极地分割）
  return wordCount > 12 || charCount > 80;
};

// 按意群分割长句子
const splitByMeaningGroup = (sentence: string): string[] => {
  const chunks: string[] = [];

  // 尝试用逗号、分号、冒号等分割
  const segments = sentence.split(/([,;:])/).reduce((acc, part, idx, arr) => {
    if (idx % 2 === 0 && part.trim()) {
      const delimiter = arr[idx + 1] || '';
      acc.push(part.trim() + delimiter);
    }
    return acc;
  }, [] as string[]);

  if (segments.length > 1) {
    // 合并过短的片段（少于5个单词）
    let currentChunk = '';
    segments.forEach(seg => {
      const combined = currentChunk + ' ' + seg;
      const wordCount = combined.trim().split(/\s+/).length;
      
      // 降低合并阈值到5个单词，避免片段过短
      if (wordCount < 5 && currentChunk) {
        currentChunk = combined.trim();
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = seg.trim();
      }
    });
    if (currentChunk) chunks.push(currentChunk.trim());
    
    return chunks.filter(c => c.length > 0);
  }

  // 如果没有明显的意群标志，按照固定长度分割（约10个单词一组，更短更易听）
  const words = sentence.split(/\s+/);
  if (words.length > 10) {
    for (let i = 0; i < words.length; i += 10) {
      const chunk = words.slice(i, i + 10).join(' ');
      if (chunk) chunks.push(chunk);
    }
    return chunks;
  }

  return [sentence];
};

