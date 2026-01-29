import React, { useState } from 'react';
import { FileText, ArrowRight, Loader2, Mic, Camera, Image } from 'lucide-react';
import { StudentInfo } from './StudentInfo';
// 引入 OCR 库
import Tesseract from 'tesseract.js';

interface SetupScreenProps {
  onStart: (text: string, metadata?: { studentName: string; className: string; inputMethod: 'text' | 'voice' | 'image' }) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'voice' | 'image'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // 学生信息
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');

  const handleStudentInfoChange = (name: string, classN: string) => {
    setStudentName(name);
    setClassName(classN);
  };

  // --- 真正的图片识别逻辑 ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件（JPG、PNG等格式）');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('正在初始化识别引擎...');

    try {
      // 调用 Tesseract 进行识别
      const result = await Tesseract.recognize(
        file,
        'eng', // 语言：英语
        {
          logger: (m) => {
            // 更新进度条状态
            if (m.status === 'recognizing text') {
              setProcessingStatus(`正在识别文字... ${(m.progress * 100).toFixed(0)}%`);
            } else if (m.status === 'loading tesseract core') {
              setProcessingStatus('正在加载核心组件...');
            } else {
              setProcessingStatus('正在处理图片...');
            }
          }
        }
      );

      // 识别成功
      const recognizedText = result.data.text;
      if (!recognizedText.trim()) {
        alert('未在图片中识别到清晰的英文，请重试。');
      } else {
        setText(recognizedText);
        // 自动切换到文本模式，让用户看到结果
        setMode('text');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('图片识别失败，请检查网络或重试。');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // 实时语音识别
  const handleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别功能。');
      return;
    }

    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    let finalTranscript = '';

    recognizer.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      setText((finalTranscript + interimTranscript).trim());
    };

    recognizer.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognizer.onend = () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        setText(finalTranscript.trim());
      }
    };

    recognizer.start();
    setRecognition(recognizer);
    setIsRecording(true);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">开始你的听力训练</h2>
        <p className="text-slate-600">粘贴任何你想练习的英语文本，系统会自动为你生成听力材料。</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-slate-100">
        {/* 学生信息输入 */}
        <StudentInfo onInfoChange={handleStudentInfoChange} />
        
        <div className="flex gap-3 mb-6 border-b border-slate-100 pb-4">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${mode === 'text' ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText size={20} />
            文本导入
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${mode === 'voice' ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Mic size={20} />
            语音识别
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${mode === 'image' ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Camera size={20} />
            图片识别
          </button>
        </div>

        {mode === 'text' ? (
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在这里粘贴英语文章、新闻或对话..."
              className="w-full h-64 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none resize-none text-lg leading-relaxed text-slate-800"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!studentName.trim()) {
                    alert('请先填写学生信息');
                    return;
                  }
                  onStart(text, { studentName, className, inputMethod: 'text' });
                }}
                disabled={!text.trim()}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                开始练习
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : mode === 'voice' ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-100 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Mic className="text-blue-700" size={20} />
                    实时语音识别
                  </h3>
                  <p className="text-sm text-slate-600">
                    点击麦克风按钮，朗读英语内容，系统会实时转换为文字
                  </p>
                </div>
              </div>

              <button
                onClick={handleVoiceRecording}
                className={`w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 ${isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-blue-700 hover:bg-blue-800 text-white shadow-md'
                  }`}
              >
                <Mic size={24} />
                {isRecording ? '点击停止录音' : '开始语音识别'}
              </button>

              {text && mode === 'voice' && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">已识别内容预览：</p>
                  <p className="text-slate-700 text-sm line-clamp-3">{text}</p>
                </div>
              )}
            </div>

            {text && mode === 'voice' && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!studentName.trim()) {
                      alert('请先填写学生信息');
                      return;
                    }
                    setMode('text');
                    setTimeout(() => onStart(text, { studentName, className, inputMethod: 'voice' }), 300);
                  }}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md"
                >
                  使用此内容开始练习
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors group">
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <Loader2 size={40} className="text-blue-700 animate-spin mb-3" />
                  <p className="text-slate-700 font-medium">{processingStatus}</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <Image size={36} className="text-blue-700" />
                  </div>
                  <p className="text-slate-800 font-bold mb-2 text-lg">拍照或上传图片</p>
                  <p className="text-slate-600 text-sm mb-1">支持 JPG、PNG、WEBP 等格式</p>
                  <p className="text-xs text-slate-400">AI将自动识别图片中的英文文字</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isProcessing}
                  />
                </>
              )}
            </div>

            {text && mode === 'image' && (
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="识别的文字将显示在这里..."
                  className="w-full h-32 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none resize-none text-base leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (!studentName.trim()) {
                        alert('请先填写学生信息');
                        return;
                      }
                      onStart(text, { studentName, className, inputMethod: 'image' });
                    }}
                    disabled={!text.trim()}
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md disabled:opacity-50"
                  >
                    开始练习
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 font-bold border border-blue-100">1</div>
          <h3 className="font-semibold text-slate-900">智能分句</h3>
          <p className="text-sm text-slate-500 mt-1">自动识别句子结构，逐句练习更高效</p>
        </div>
        <div className="p-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold border border-emerald-100">2</div>
          <h3 className="font-semibold text-slate-900">实时反馈</h3>
          <p className="text-sm text-slate-500 mt-1">智能对比答案，精准定位听写错误</p>
        </div>
        <div className="p-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold border border-indigo-100">3</div>
          <h3 className="font-semibold text-slate-900">多维报告</h3>
          <p className="text-sm text-slate-500 mt-1">生成详细的学习报告，见证你的进步</p>
        </div>
      </div>
    </div>
  );
};