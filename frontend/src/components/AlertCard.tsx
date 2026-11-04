// Tác giả: Frontend Developer - Alert Card Component
import { AlertTriangle, TrendingUp, Zap, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { SpendingAlert } from '../types';
import { formatCurrency } from '../lib/utils';

interface AlertCardProps {
  alert: SpendingAlert;
  onClick?: () => void;
}

export default function AlertCard({ alert, onClick }: AlertCardProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'BUDGET_EXCEEDED':
        return <AlertTriangle className="w-5 h-5" />;
      case 'BUDGET_WARNING':
        return <AlertCircle className="w-5 h-5" />;
      case 'SPENDING_SPIKE':
        return <TrendingUp className="w-5 h-5" />;
      case 'RAPID_SPENDING':
        return <Zap className="w-5 h-5" />;
      case 'RECURRING_PAYMENT_DUE':
        return <Clock className="w-5 h-5" />;
      case 'BUDGET_PACE_WARNING':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          container: 'bg-red-50 border-l-4 border-red-500',
          icon: 'text-red-600',
          title: 'text-red-900',
          badge: 'bg-red-100 text-red-800',
        };
      case 'HIGH':
        return {
          container: 'bg-orange-50 border-l-4 border-orange-500',
          icon: 'text-orange-600',
          title: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'MEDIUM':
        return {
          container: 'bg-yellow-50 border-l-4 border-yellow-500',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      case 'LOW':
        return {
          container: 'bg-blue-50 border-l-4 border-blue-500',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800',
        };
      default:
        return {
          container: 'bg-gray-50 border-l-4 border-gray-500',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'BUDGET_EXCEEDED':
        return 'Vượt ngân sách';
      case 'BUDGET_WARNING':
        return 'Cảnh báo ngân sách';
      case 'SPENDING_SPIKE':
        return 'Chi tăng đột biến';
      case 'RAPID_SPENDING':
        return 'Chi quá nhanh';
      case 'RECURRING_PAYMENT_DUE':
        return 'Thanh toán định kỳ';
      case 'BUDGET_PACE_WARNING':
        return 'Tốc độ chi tiêu';
      default:
        return 'Cảnh báo';
    }
  };

  const styles = getSeverityStyles(alert.severity);
  const icon = getAlertIcon(alert.alertType);

  return (
    <div
      className={`${styles.container} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && onClick) onClick();
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${styles.icon}`}>{icon}</div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-semibold ${styles.title} text-sm sm:text-base`}>
              {alert.title}
            </h3>
            <span className={`${styles.badge} text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap`}>
              {getAlertTypeLabel(alert.alertType)}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
            {alert.message}
          </p>

          {/* Amount Display */}
          {alert.amount !== undefined && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-600">Số tiền:</span>
              <span className={`text-lg font-bold ${styles.title}`}>
                {formatCurrency(alert.amount)}
              </span>
            </div>
          )}

          {/* Category Badge */}
          {alert.categoryName && (
            <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 text-xs">
              <span className="text-gray-600">Danh mục:</span>
              <span className="font-medium text-gray-900">{alert.categoryName}</span>
            </div>
          )}

          {/* Metadata Details */}
          {alert.metadata && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
              {alert.metadata.increasePercent !== undefined && (
                <div className="text-xs text-gray-600">
                  📈 Tăng: <span className="font-semibold text-red-600">
                    {alert.metadata.increasePercent.toFixed(1)}%
                  </span>
                </div>
              )}
              {alert.metadata.estimatedRunOutDay !== undefined && (
                <div className="text-xs text-gray-600">
                  📅 Dự kiến hết ngân sách: <span className="font-semibold text-orange-600">
                    Ngày {alert.metadata.estimatedRunOutDay}
                  </span>
                </div>
              )}
              {alert.metadata.daysRemaining !== undefined && (
                <div className="text-xs text-gray-600">
                  ⏰ Còn: <span className="font-semibold text-blue-600">
                    {alert.metadata.daysRemaining} ngày
                  </span>
                </div>
              )}
              {alert.metadata.spentPercent !== undefined && (
                <div className="text-xs text-gray-600">
                  💸 Đã chi: <span className="font-semibold">
                    {alert.metadata.spentPercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Link */}
          <button
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
          >
            Xem chi tiết →
          </button>
        </div>
      </div>
    </div>
  );
}
