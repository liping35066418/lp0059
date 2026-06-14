import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Code,
  Lock,
  Copy,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Server,
  Circle,
  ListTodo,
} from 'lucide-react';
import Toast, { type ToastType } from '@/components/Toast';
import HistoryPanel from '@/components/HistoryPanel';
import { cn } from '@/lib/utils';
import type { EncodeType, HistoryItem } from '@/types';
import {
  encode,
  decode,
  encrypt,
  decrypt,
  getHistory,
  addHistory,
  clearHistory,
} from '@/services/api';

type TabMode = 'encode' | 'crypto';
type EncodeAction = 'encode' | 'decode';
type CryptoAction = 'encrypt' | 'decrypt';

const encodeOptions: { value: EncodeType; label: string }[] = [
  { value: 'url', label: 'URL' },
  { value: 'base64', label: 'Base64' },
  { value: 'unicode', label: 'Unicode' },
  { value: 'html', label: 'HTML' },
  { value: 'hex', label: 'Hex' },
];

export default function Home() {
  const [tabMode, setTabMode] = useState<TabMode>('encode');
  const [encodeType, setEncodeType] = useState<EncodeType>('url');
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [encodeAction, setEncodeAction] = useState<EncodeAction>('encode');
  const [cryptoAction, setCryptoAction] = useState<CryptoAction>('encrypt');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayCount = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return history.filter((item) => item.createdAt.startsWith(todayStr)).length;
  }, [history]);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
  }, []);

  const fetchHistory = useCallback(async () => {
    const res = await getHistory();
    if (res.success && res.data) {
      setHistory(res.data);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(() => {
      fetch('/api/health')
        .then(() => setServerOnline(true))
        .catch(() => setServerOnline(false));
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const processInput = useCallback(async () => {
    if (!inputValue.trim()) {
      setOutputValue('');
      return;
    }

    if (tabMode === 'encode') {
      if (encodeAction === 'encode') {
        const res = await encode(encodeType, inputValue);
        if (res.success && res.result !== undefined) {
          setOutputValue(res.result);
        } else {
          setOutputValue('');
        }
      } else {
        const res = await decode(encodeType, inputValue);
        if (res.success && res.result !== undefined) {
          setOutputValue(res.result);
        } else {
          setOutputValue('');
        }
      }
    } else {
      if (!keyValue.trim()) {
        setOutputValue('');
        return;
      }
      if (cryptoAction === 'encrypt') {
        const res = await encrypt(inputValue, keyValue);
        if (res.success && res.result !== undefined) {
          setOutputValue(res.result);
        } else {
          setOutputValue('');
        }
      } else {
        const res = await decrypt(inputValue, keyValue);
        if (res.success && res.result !== undefined) {
          setOutputValue(res.result);
        } else {
          setOutputValue('');
        }
      }
    }
  }, [inputValue, encodeType, keyValue, tabMode, encodeAction, cryptoAction]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      processInput();
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [processInput]);

  const handleEncode = async () => {
    let content = inputValue;

    if (encodeAction !== 'encode') {
      setEncodeAction('encode');
      if (outputValue.trim()) {
        content = outputValue;
        setInputValue(outputValue);
      }
    }

    if (!content.trim()) {
      showToast('error', '请输入需要编码的内容');
      return;
    }
    const res = await encode(encodeType, content);
    if (res.success && res.result !== undefined) {
      setOutputValue(res.result);
      showToast('success', '编码成功');
      await addHistory({
        type: 'encode',
        subType: encodeType,
        input: content,
        output: res.result,
      });
      fetchHistory();
    } else {
      showToast('error', res.error || '编码失败');
    }
  };

  const handleDecode = async () => {
    let content = inputValue;

    if (encodeAction !== 'decode') {
      setEncodeAction('decode');
      if (outputValue.trim()) {
        content = outputValue;
        setInputValue(outputValue);
      }
    }

    if (!content.trim()) {
      showToast('error', '请输入需要解码的内容');
      return;
    }
    const res = await decode(encodeType, content);
    if (res.success && res.result !== undefined) {
      setOutputValue(res.result);
      showToast('success', '解码成功');
      await addHistory({
        type: 'decode',
        subType: encodeType,
        input: content,
        output: res.result,
      });
      fetchHistory();
    } else {
      showToast('error', res.error || '解码失败');
    }
  };

  const handleEncrypt = async () => {
    let content = inputValue;

    if (cryptoAction !== 'encrypt') {
      setCryptoAction('encrypt');
      if (outputValue.trim()) {
        content = outputValue;
        setInputValue(outputValue);
      }
    }

    if (!content.trim()) {
      showToast('error', '请输入需要加密的内容');
      return;
    }
    if (!keyValue.trim()) {
      showToast('error', '请输入密钥');
      return;
    }
    const res = await encrypt(content, keyValue);
    if (res.success && res.result !== undefined) {
      setOutputValue(res.result);
      showToast('success', '加密成功');
      await addHistory({
        type: 'encrypt',
        subType: 'aes',
        input: content,
        output: res.result,
      });
      fetchHistory();
    } else {
      showToast('error', res.error || '加密失败');
    }
  };

  const handleDecrypt = async () => {
    let content = inputValue;

    if (cryptoAction !== 'decrypt') {
      setCryptoAction('decrypt');
      if (outputValue.trim()) {
        content = outputValue;
        setInputValue(outputValue);
      }
    }

    if (!content.trim()) {
      showToast('error', '请输入需要解密的内容');
      return;
    }
    if (!keyValue.trim()) {
      showToast('error', '请输入密钥');
      return;
    }
    const res = await decrypt(content, keyValue);
    if (res.success && res.result !== undefined) {
      setOutputValue(res.result);
      showToast('success', '解密成功');
      await addHistory({
        type: 'decrypt',
        subType: 'aes',
        input: content,
        output: res.result,
      });
      fetchHistory();
    } else {
      showToast('error', res.error || '解密失败');
    }
  };

  const handleCopy = async () => {
    if (!outputValue) {
      showToast('info', '暂无可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(outputValue);
      setCopied(true);
      showToast('success', '已复制到剪贴板');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('error', '复制失败');
    }
  };

  const handleClear = () => {
    setInputValue('');
    setOutputValue('');
    showToast('info', '已清空');
  };

  const handleReuse = (item: HistoryItem) => {
    setInputValue(item.input);
    setOutputValue(item.output);
    if (item.type === 'encode' || item.type === 'decode') {
      setTabMode('encode');
      setEncodeAction(item.type as EncodeAction);
      if (['url', 'base64', 'unicode', 'html', 'hex'].includes(item.subType)) {
        setEncodeType(item.subType as EncodeType);
      }
    } else {
      setTabMode('crypto');
      setCryptoAction(item.type as CryptoAction);
    }
    showToast('info', '已载入历史记录');
  };

  const handleClearHistory = async () => {
    const res = await clearHistory();
    if (res.success) {
      setHistory([]);
      showToast('success', '历史记录已清空');
    } else {
      showToast('error', res.error || '清空失败');
    }
  };

  const handleSwap = () => {
    const temp = inputValue;
    setInputValue(outputValue);
    setOutputValue(temp);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <header className="px-6 py-5 border-b border-slate-700/30 bg-slate-900/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">网络编码工具箱</h1>
              <p className="text-xs text-slate-400 mt-0.5">本地开发调试安全工具</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
              <Server className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">端口 8719</span>
              <Circle
                className={cn(
                  'w-2.5 h-2.5 fill-current',
                  serverOnline ? 'text-teal-400' : 'text-red-400'
                )}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
              <ListTodo className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">今日操作 {todayCount} 次</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 mb-6 p-1.5 w-fit rounded-xl bg-slate-900/60 border border-slate-700/40">
            <button
              onClick={() => setTabMode('encode')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                tabMode === 'encode'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <Code className="w-4 h-4" />
              编码转换
            </button>
            <button
              onClick={() => setTabMode('crypto')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                tabMode === 'crypto'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <Lock className="w-4 h-4" />
              加解密
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-5">
              {tabMode === 'encode' ? (
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-900/40 backdrop-blur-md border border-slate-700/40">
                  {encodeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEncodeType(opt.value)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        encodeType === opt.value
                          ? 'bg-amber-500/90 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-900/40 backdrop-blur-md border border-slate-700/40">
                  <label className="text-xs text-slate-400 font-medium">加密密钥（AES-128-ECB）</label>
                  <input
                    type="password"
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    placeholder="请输入密钥..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-950/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-teal-500/50 transition-colors text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">输入内容</label>
                    <span className="text-xs text-slate-500">{inputValue.length} 字符</span>
                  </div>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={tabMode === 'encode' ? '请输入需要编码/解码的文本...' : '请输入需要加密/解密的文本...'}
                    className="w-full h-64 px-4 py-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-700/40 text-white placeholder-slate-500 focus:border-teal-500/50 transition-colors resize-none text-sm leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">处理结果</label>
                    <span className="text-xs text-slate-500">{outputValue.length} 字符</span>
                  </div>
                  <textarea
                    value={outputValue}
                    readOnly
                    placeholder="处理结果将显示在这里..."
                    className="w-full h-64 px-4 py-3 rounded-xl bg-slate-950/40 backdrop-blur-md border border-slate-700/40 text-teal-300 placeholder-slate-500 resize-none text-sm leading-relaxed font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {tabMode === 'encode' ? (
                  <>
                    <button
                      onClick={handleEncode}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-lg active:scale-95',
                        encodeAction === 'encode'
                          ? 'bg-gradient-to-r from-teal-600 to-teal-500 shadow-teal-500/20'
                          : 'bg-slate-700/60 hover:from-teal-500 hover:to-teal-400 hover:shadow-teal-500/20'
                      )}
                    >
                      <ArrowRight className="w-4 h-4" />
                      编码
                    </button>
                    <button
                      onClick={handleDecode}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-lg active:scale-95',
                        encodeAction === 'decode'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-amber-500/20'
                          : 'bg-slate-700/60 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/20'
                      )}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      解码
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEncrypt}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-lg active:scale-95',
                        cryptoAction === 'encrypt'
                          ? 'bg-gradient-to-r from-teal-600 to-teal-500 shadow-teal-500/20'
                          : 'bg-slate-700/60 hover:from-teal-500 hover:to-teal-400 hover:shadow-teal-500/20'
                      )}
                    >
                      <Lock className="w-4 h-4" />
                      加密
                    </button>
                    <button
                      onClick={handleDecrypt}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-lg active:scale-95',
                        cryptoAction === 'decrypt'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-amber-500/20'
                          : 'bg-slate-700/60 hover:from-amber-500 hover:to-amber-400 hover:shadow-amber-500/20'
                      )}
                    >
                      <ArrowRight className="w-4 h-4" />
                      解密
                    </button>
                  </>
                )}

                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 border',
                    copied
                      ? 'bg-teal-500/20 border-teal-500/30 text-teal-300'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-200 hover:bg-slate-700/60 hover:border-slate-600'
                  )}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制结果'}
                </button>

                <button
                  onClick={handleSwap}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm font-medium hover:bg-slate-700/60 hover:border-slate-600 transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                  <ArrowRight className="w-4 h-4 -ml-2" />
                  交换
                </button>

                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-sm font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  清空
                </button>
              </div>
            </div>

            <div className="w-full lg:w-80 h-[600px] shrink-0">
              <HistoryPanel history={history} onReuse={handleReuse} onClear={handleClearHistory} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
