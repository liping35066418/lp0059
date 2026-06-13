import { History, Trash2, RotateCcw } from 'lucide-react';
import type { HistoryItem } from '@/types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onReuse: (item: HistoryItem) => void;
  onClear: () => void;
}

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
  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-semibold text-white">历史记录</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
            {history.length}
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
            <History className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">暂无历史记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {history.map((item) => (
              <div
                key={item.id}
                className="group px-4 py-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/20">
                    {getTypeLabel(item)}
                  </span>
                  <span className="text-xs text-slate-500">{formatTime(item.createdAt)}</span>
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
