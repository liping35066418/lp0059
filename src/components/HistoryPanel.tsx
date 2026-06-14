import { useState, useMemo, useEffect, useRef } from 'react';
import { History, Trash2, RotateCcw, Star, Search } from 'lucide-react';
import type { HistoryItem } from '@/types';
import { toggleFavorite } from '@/services/api';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'encode' | 'decode' | 'encrypt' | 'decrypt';

interface HistoryPanelProps {
  history: HistoryItem[];
  onReuse: (item: HistoryItem) => void;
  onClear: () => void;
}

const filterTabs: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'encode', label: '编码' },
  { value: 'decode', label: '解码' },
  { value: 'encrypt', label: '加密' },
  { value: 'decrypt', label: '解密' },
];

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getTypeLabel(item: HistoryItem): string {
  const labels: Record<string, string> = {
    encode: '编码',
    decode: '解码',
    encrypt: '加密',
    decrypt: '解密',
  };
  const typeLabel = labels[item.type] || item.type;
  if (item.subType && item.subType !== 'aes') {
    const subLabels: Record<string, string> = {
      url: 'URL',
      base64: 'Base64',
      unicode: 'Unicode',
      html: 'HTML',
      hex: 'Hex',
    };
    return `${typeLabel} · ${subLabels[item.subType] || item.subType}`;
  }
  return typeLabel;
}

function truncate(text: string, maxLen = 30): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export default function HistoryPanel({ history, onReuse, onClear }: HistoryPanelProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [keyword, setKeyword] = useState('');
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>(history);
  const historyRef = useRef(history);

  useEffect(() => {
    if (JSON.stringify(historyRef.current) !== JSON.stringify(history)) {
      historyRef.current = history;
      setLocalHistory(history);
    }
  }, [history]);

  const filteredHistory = useMemo(() => {
    let result = localHistory;

    if (filterType !== 'all') {
      result = result.filter((item) => item.type === filterType);
    }

    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.input.toLowerCase().includes(kw) ||
          item.output.toLowerCase().includes(kw)
      );
    }

    const favorites = result.filter((item) => item.favorited);
    const others = result.filter((item) => !item.favorited);

    favorites.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    others.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return [...favorites, ...others];
  }, [localHistory, filterType, keyword]);

  const handleToggleFavorite = async (id: string) => {
    const res = await toggleFavorite(id);
    if (res.success && res.data) {
      setLocalHistory((prev) =>
        prev.map((item) => (item.id === id ? res.data! : item))
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-semibold text-white">历史记录</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
            {localHistory.length}
          </span>
        </div>
        {localHistory.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        )}
      </div>

      <div className="px-4 pt-3 pb-2 border-b border-slate-700/30 space-y-2">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
                filterType === tab.value
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索输入或输出内容..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-teal-500/50 transition-colors text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
            <History className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {localHistory.length === 0 ? '暂无历史记录' : '没有匹配的记录'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'group px-4 py-3 hover:bg-slate-800/40 transition-colors',
                  item.favorited && 'bg-amber-500/5'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/20">
                    {getTypeLabel(item)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className={cn(
                        'p-1 rounded transition-colors',
                        item.favorited
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                      )}
                      title={item.favorited ? '取消收藏' : '收藏'}
                    >
                      <Star
                        className="w-3.5 h-3.5"
                        fill={item.favorited ? 'currentColor' : 'none'}
                      />
                    </button>
                    <span className="text-xs text-slate-500">{formatTime(item.createdAt)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate mb-2" title={item.input}>
                  {truncate(item.input)}
                </p>
                <button
                  onClick={() => onReuse(item)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors opacity-70 group-hover:opacity-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  复用
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
