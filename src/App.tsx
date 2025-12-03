import { useState } from 'react';
import { Header } from './components/Header';
import { SetupScreen } from './components/SetupScreen';
import { PracticeScreen, SentenceResult } from './components/PracticeScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { saveRecord } from './utils/historyManager';

type AppMode = 'setup' | 'practice' | 'results' | 'history' | 'review';

function App() {
  const [mode, setMode] = useState<AppMode>('setup');
  const [rawText, setRawText] = useState('');
  const [results, setResults] = useState<SentenceResult[]>([]);

  const handleStart = (text: string) => {
    setRawText(text);
    setMode('practice');
  };

  const handleFinish = (res: SentenceResult[]) => {
    setResults(res);
    if (rawText && res.length > 0) {
        saveRecord(rawText, res);
    }
    setMode('results');
  };

  const handleViewHistory = () => {
    setMode('history');
  };

  const handleViewRecord = (text: string, recordResults: SentenceResult[]) => {
    setRawText(text);
    setResults(recordResults);
    setMode('review');
  };

  const handleRestart = () => {
    setMode('setup');
    setRawText('');
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header onRestart={handleRestart} onViewHistory={handleViewHistory} />
      
      <main className="py-8 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10">
          {mode === 'setup' && (
            <SetupScreen onStart={handleStart} />
          )}

          {mode === 'practice' && (
            <PracticeScreen 
              rawText={rawText} 
              onFinish={handleFinish}
              // 修改点：传入 onBack 回调，点击后回到初始设置页
              onBack={handleRestart}
            />
          )}

          {mode === 'results' && (
            <ResultsScreen 
              results={results} 
              onRestart={handleRestart} 
            />
          )}

          {mode === 'review' && (
            <ReviewScreen 
              results={results} 
              onBack={handleViewHistory} 
            />
          )}

          {mode === 'history' && (
            <HistoryScreen
              onViewRecord={handleViewRecord}
              onBack={handleRestart}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;