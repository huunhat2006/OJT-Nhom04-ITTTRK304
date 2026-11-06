// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { cn } from '../lib/utils';

// ── Base skeleton block ──────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// ── Metric / stat card skeleton ──────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="card animate-fade-in" aria-hidden="true" role="presentation">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-36 mb-4" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────────────────────────
interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="animate-fade-in" aria-hidden="true" role="presentation">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn('h-4 rounded', c === 0 ? 'w-8' : c === cols - 1 ? 'w-16' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── List item skeleton (e.g. wallets, goals, budgets) ────────────────────────
interface ListSkeletonProps {
  rows?: number;
  /** Show avatar circle on the left */
  avatar?: boolean;
}

export function ListSkeleton({ rows = 4, avatar = false }: ListSkeletonProps) {
  return (
    <div className="space-y-3 animate-fade-in" aria-hidden="true" role="presentation">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
          {avatar && <Skeleton className="w-10 h-10 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Chart / graph area skeleton ──────────────────────────────────────────────
export function ChartSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={cn('w-full rounded-xl skeleton', height)} aria-hidden="true" role="presentation" />
  );
}

// ── Page-level skeleton (grid of cards + table) ──────────────────────────────
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-hidden="true" role="presentation">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      {/* Content card */}
      <div className="card">
        <Skeleton className="h-5 w-32 mb-4" />
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}

export default Skeleton;
