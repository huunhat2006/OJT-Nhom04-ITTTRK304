// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ArrowLeftRight,
  Tags,
  Target,
  Loader2,
} from 'lucide-react';
import api from '../lib/axios';
import { useSpaceStore } from '../store/spaceStore';
import { Transaction, Category, SavingsGoal, PageResponse } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

// ── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Highlight matched text ───────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface SearchResults {
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
}

interface GlobalSearchProps {
  /** Called when user closes the search overlay */
  onClose: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { currentSpace } = useSpaceStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ transactions: [], categories: [], goals: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 400);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || !currentSpace) {
      setResults({ transactions: [], categories: [], goals: [] });
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();

    const fetch = async () => {
      setLoading(true);
      try {
        const q = debouncedQuery.trim();
        const [txRes, catRes, goalRes] = await Promise.allSettled([
          api.get<PageResponse<Transaction>>(
            `/transactions?spaceId=${currentSpace.id}&keyword=${encodeURIComponent(q)}&page=0&size=5`,
            { signal: controller.signal }
          ),
          api.get<Category[]>('/categories', { signal: controller.signal }),
          api.get<PageResponse<SavingsGoal>>(
            `/savings-goals?spaceId=${currentSpace.id}&page=0&size=100`,
            { signal: controller.signal }
          ),
        ]);

        const txList =
          txRes.status === 'fulfilled' ? (txRes.value.data.content ?? []) : [];

        // Filter categories client-side (usually small list)
        const catList =
          catRes.status === 'fulfilled'
            ? (catRes.value.data as Category[]).filter((c) =>
                (c.nameVi ?? c.name).toLowerCase().includes(q.toLowerCase())
              ).slice(0, 5)
            : [];

        // Filter goals client-side
        const goalList =
          goalRes.status === 'fulfilled'
            ? (goalRes.value.data.content ?? []).filter((g: SavingsGoal) =>
                g.name.toLowerCase().includes(q.toLowerCase())
              ).slice(0, 5)
            : [];

        if (!controller.signal.aborted) {
          setResults({ transactions: txList, categories: catList, goals: goalList });
          setActiveIndex(-1);
        }
      } catch {
        // ignore aborted / network errors
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetch();
    return () => controller.abort();
  }, [debouncedQuery, currentSpace]);

  // Build flat list of navigable items for keyboard nav
  type NavItem =
    | { kind: 'tx'; item: Transaction }
    | { kind: 'cat'; item: Category }
    | { kind: 'goal'; item: SavingsGoal };

  const flatItems: NavItem[] = [
    ...results.transactions.map((t): NavItem => ({ kind: 'tx', item: t })),
    ...results.categories.map((c): NavItem => ({ kind: 'cat', item: c })),
    ...results.goals.map((g): NavItem => ({ kind: 'goal', item: g })),
  ];

  const handleSelect = useCallback(
    (item: NavItem) => {
      if (item.kind === 'tx') navigate('/transactions');
      else if (item.kind === 'cat') navigate('/categories');
      else navigate('/goals');
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(flatItems[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const hasResults =
    results.transactions.length > 0 ||
    results.categories.length > 0 ||
    results.goals.length > 0;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm toàn cục"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-in-down">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="w-5 h-5 text-gray-400 shrink-0" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm giao dịch, danh mục, mục tiêu..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-base"
            aria-label="Ô tìm kiếm"
            aria-autocomplete="list"
            aria-expanded={hasResults}
            aria-controls="search-results"
            autoComplete="off"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 focus-ring"
            aria-label="Đóng tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hint when empty */}
        {!query.trim() && (
          <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-gray-600" aria-hidden="true" />
            <p>Nhập từ khóa để tìm kiếm</p>
            <p className="mt-1 text-xs">Giao dịch, danh mục, mục tiêu tiết kiệm</p>
          </div>
        )}

        {/* No results */}
        {query.trim() && !loading && !hasResults && (
          <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-gray-600" aria-hidden="true" />
            <p className="font-medium text-gray-600 dark:text-gray-300">Không tìm thấy kết quả</p>
            <p className="mt-1 text-xs">
              Thử tìm với từ khóa khác hoặc kiểm tra chính tả
            </p>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <ul
            id="search-results"
            ref={listRef}
            role="listbox"
            aria-label="Kết quả tìm kiếm"
            className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700"
          >
            {/* Transactions */}
            {results.transactions.length > 0 && (
              <>
                <li className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Giao dịch
                  </span>
                </li>
                {results.transactions.map((tx, i) => {
                  const idx = i;
                  return (
                    <li key={tx.id} role="option" aria-selected={activeIndex === idx}>
                      <button
                        data-idx={idx}
                        onClick={() => handleSelect({ kind: 'tx', item: tx })}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus-ring ${
                          activeIndex === idx ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === 'INCOME' ? 'bg-success/10' : tx.type === 'EXPENSE' ? 'bg-danger/10' : 'bg-gray-100'
                        }`}>
                          <ArrowLeftRight className={`w-4 h-4 ${
                            tx.type === 'INCOME' ? 'text-success' : tx.type === 'EXPENSE' ? 'text-danger' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            <Highlight text={tx.description || '(Không có mô tả)'} query={query} />
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(tx.transactionDate)}
                            {tx.category && (
                              <> · <Highlight text={tx.category.nameVi ?? tx.category.name} query={query} /></>
                            )}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold shrink-0 ${
                          tx.type === 'INCOME' ? 'text-success' : 'text-danger'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </>
            )}

            {/* Categories */}
            {results.categories.length > 0 && (
              <>
                <li className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Danh mục
                  </span>
                </li>
                {results.categories.map((cat, i) => {
                  const idx = results.transactions.length + i;
                  return (
                    <li key={cat.id} role="option" aria-selected={activeIndex === idx}>
                      <button
                        data-idx={idx}
                        onClick={() => handleSelect({ kind: 'cat', item: cat })}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus-ring ${
                          activeIndex === idx ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                          <Tags className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            <Highlight text={cat.nameVi ?? cat.name} query={query} />
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cat.type === 'INCOME' ? 'Thu nhập' : cat.type === 'EXPENSE' ? 'Chi tiêu' : 'Cả hai'}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </>
            )}

            {/* Savings Goals */}
            {results.goals.length > 0 && (
              <>
                <li className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Mục tiêu tiết kiệm
                  </span>
                </li>
                {results.goals.map((goal, i) => {
                  const idx = results.transactions.length + results.categories.length + i;
                  return (
                    <li key={goal.id} role="option" aria-selected={activeIndex === idx}>
                      <button
                        data-idx={idx}
                        onClick={() => handleSelect({ kind: 'goal', item: goal })}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus-ring ${
                          activeIndex === idx ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            <Highlight text={goal.name} query={query} />
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">
                              {Math.round(goal.progressPercentage)}%
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-[11px] text-gray-400">
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-mono">↑↓</kbd> điều hướng</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-mono">Enter</kbd> chọn</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-mono">Esc</kbd> đóng</span>
        </div>
      </div>
    </div>
  );
}
