// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { type LucideIcon, Inbox } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  /** SVG / illustration node — overrides icon if provided */
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Extra className for the wrapper */
  className?: string;
}

/**
 * Reusable empty state component.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={Target}
 *   title="Chưa có mục tiêu nào"
 *   description="Tạo mục tiêu tiết kiệm đầu tiên của bạn"
 *   action={<button className="btn btn-primary">Tạo mục tiêu</button>}
 * />
 * ```
 */
export default function EmptyState({
  icon: Icon = Inbox,
  illustration,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in ${className}`}
      role="status"
      aria-label={title}
    >
      {/* Illustration or icon */}
      {illustration ?? (
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-5 shadow-inner">
          <Icon className="w-10 h-10 text-gray-300 dark:text-gray-500" aria-hidden="true" />
        </div>
      )}

      {/* Text */}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-1">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {/* CTA */}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
