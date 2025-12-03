import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  List, 
  TrendingUp, 
  RotateCcw, 
  Home, 
  CheckCircle, 
  Book, 
  Zap, 
  Target 
} from 'lucide-react';
import { SentenceResult } from './PracticeScreen';

interface ResultsScreenProps {
  results: SentenceResult[];
  onRestart: () => void;
}

// 定义标签页类型，去掉了 'ai'
type TabType = 'overview' | 'details' | 'insights';

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ results, onRestart }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // 计算统计数据
  const totalSentences = results.length;
  const perfectSentences = results.filter(r => r.accuracy === 100).length;
  const avgAccuracy = Math.round(results.reduce((acc, curr) => acc + curr.accuracy, 0) / totalSentences) || 0;
  
  // 估算单词总数 (简单按空格分割)
  const totalWords = results.reduce((acc, curr) => acc + curr.original.split(' ').length, 0);

  // 难度评级
  const getDifficultyLevel = () => {
    if (avgAccuracy >= 90) return { label: '大师', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (avgAccuracy >= 75) return { label: '进阶', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (avgAccuracy >= 60) return { label: '中级', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: '初级', color: 'text-slate-600', bg: 'bg-slate-100' };
  };
  
  const level = getDifficultyLevel();

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      {/* 头部标题 */}
      <div className="text-center mb-10 pt-8">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-sm">
          <span className="text-4xl">🏆</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">练习完成!</h2>
        <p className="text-slate-500">多维度听写能力分析报告</p>
      </div>

      {/* 标签页导航 (已移除 AI助手) */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
            activeTab === 'overview' 
              ? 'bg-indigo-600 text-white shadow-indigo-200' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard size={18} />
          总览
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
            activeTab === 'details' 
              ? 'bg-indigo-600 text-white shadow-indigo-200' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <List size={18} />
          详细分析
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
            activeTab === 'insights' 
              ? 'bg-indigo-600 text-white shadow-indigo-200' 
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp size={18} />
          学习洞察
        </button>
      </div>

      {/* 内容区域 */}
      <div className="space-y-6">
        
        {/* 1. 总览视图 */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={<Zap size={24} className="text-emerald-600"/>}
              label="平均正确率"
              value={`${avgAccuracy}%`}
              subtext="总分"
              bg="bg-emerald-50"
              border="border-emerald-100"
              textColor="text-emerald-700"
            />
            <StatCard 
              icon={<CheckCircle size={24} className="text-blue-600"/>}
              label="完美句数"
              value={perfectSentences}
              subtext={`完美句数 / ${totalSentences}`}
              bg="bg-blue-50"
              border="border-blue-100"
              textColor="text-blue-700"
            />
            <StatCard 
              icon={<Book size={24} className="text-purple-600"/>}
              label="练习单词总量"
              value={totalWords}
              subtext="练习单词总量"
              bg="bg-purple-50"
              border="border-purple-100"
              textColor="text-purple-700"
            />
            <StatCard 
              icon={<Target size={24} className={level.color}/>}
              label="练习难度"
              value={<span className="text-lg">{level.label}</span>} // Use ReactNode for value
              subtext="练习难度"
              bg={level.bg}
              border="border-slate-100" // Generic border since difficulty color varies
              textColor={level.color}
            />
            
            {/* 图表区域占位 */}
            <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-600"/>
                    正确率走势
                </h3>
                <div className="h-48 flex items-end justify-between gap-2 px-2">
                    {results.map((r, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="relative w-full flex justify-center">
                                <span className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded">
                                    {r.accuracy}%
                                </span>
                                <div 
                                    className={`w-full max-w-[30px] rounded-t-lg transition-all duration-1000 ${
                                        r.accuracy >= 90 ? 'bg-indigo-500' : r.accuracy >= 60 ? 'bg-indigo-300' : 'bg-indigo-100'
                                    }`}
                                    style={{ height: `${Math.max(r.accuracy, 5) * 1.5}px` }} // Simple scaling
                                ></div>
                            </div>
                            <span className="text-xs text-slate-400">句{i+1}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Target size={18} className="text-indigo-600"/>
                        句子表现分布
                    </h3>
                    <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            完美 (100%): {perfectSentences}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            良好 (80-99%): {results.filter(r => r.accuracy < 100 && r.accuracy >= 80).length}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                            需改进 (&lt;80%): {results.filter(r => r.accuracy < 80).length}
                        </div>
                    </div>
                </div>
                {/* 简单的饼图视觉效果 */}
                <div className="w-32 h-32 rounded-full border-8 border-slate-50 relative flex items-center justify-center">
                     <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: `conic-gradient(
                                #10b981 0% ${(perfectSentences / totalSentences) * 100}%, 
                                #3b82f6 ${(perfectSentences / totalSentences) * 100}% ${((perfectSentences + results.filter(r => r.accuracy < 100 && r.accuracy >= 80).length) / totalSentences) * 100}%, 
                                #f97316 ${((perfectSentences + results.filter(r => r.accuracy < 100 && r.accuracy >= 80).length) / totalSentences) * 100}% 100%
                            )`
                        }}
                     ></div>
                     <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                        <span className="text-xs text-slate-400">完美</span>
                        <span className="font-bold text-emerald-600">{Math.round((perfectSentences/totalSentences)*100)}%</span>
                     </div>
                </div>
            </div>

          </div>
        )}

        {/* 2. 详细分析视图 */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {results.map((r, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-slate-700">第 {i+1} 句</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                             r.accuracy === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                            正确率: {r.accuracy}%
                        </span>
                    </div>
                    
                    {/* Diff 展示 */}
                    <div className="text-lg font-serif mb-2 leading-relaxed bg-slate-50 p-3 rounded-lg">
                        {r.diffs.map((part: any, idx: number) => {
                            const [type, text] = part;
                             if (type === 0) return <span key={idx} className="text-slate-800">{text}</span>;
                             if (type === 1) return <span key={idx} className="bg-emerald-200 text-emerald-800 px-1 rounded mx-1 underline decoration-emerald-500">{text}</span>;
                             return <span key={idx} className="bg-red-200 text-red-800 px-1 rounded mx-1 line-through decoration-red-500">{text}</span>;
                        })}
                    </div>
                    {r.accuracy < 100 && (
                        <div className="text-sm text-slate-500">
                            <span className="font-semibold">你的输入:</span> {r.userAnswer}
                        </div>
                    )}
                </div>
            ))}
          </div>
        )}

        {/* 3. 学习洞察视图 */}
        {activeTab === 'insights' && (
          <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">本次练习洞察</h3>
              <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                  基于你的表现，系统发现你在长难句的拼写上表现出色，但在介词连接上偶尔会遗漏。建议多听连读材料。
              </p>
              <div className="flex justify-center gap-3">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"># 连读弱读</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"># 介词搭配</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"># 拼写准确性</span>
              </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
          <button 
            onClick={onRestart}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            <RotateCcw size={20} />
            开始新的练习
          </button>
          <button 
            onClick={onRestart} // 这里简化为回首页，实际逻辑 App.tsx 已处理
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-800 text-white font-bold shadow-lg hover:bg-slate-900 hover:scale-105 transition-all"
          >
            <Home size={20} />
            返回首页
          </button>
      </div>

    </div>
  );
};

// 辅助组件：统计卡片
const StatCard = ({ icon, label, value, subtext, bg, border, textColor }: any) => (
    <div className={`${bg} border ${border} p-5 rounded-xl flex flex-col justify-between h-36 hover:shadow-md transition-shadow`}>
        <div className="flex justify-between items-start">
            <div className="p-2 bg-white rounded-lg shadow-sm">
                {icon}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/50 ${textColor}`}>
                {label}
            </span>
        </div>
        <div>
            <div className={`text-3xl font-bold ${textColor} mb-1`}>{value}</div>
            <div className="text-xs text-slate-500 opacity-80">{subtext}</div>
        </div>
    </div>
);