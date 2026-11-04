// Tác giả: Frontend Developer - Alert Widget for Dashboard
import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight, TrendingUp, Zap, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SpendingAlert } from '../types';
import { alertService } from '../lib/alertService';
import { formatCurrency } from '../lib/utils';

interface AlertWidgetProps {
  spaceId?: number;
  maxAlerts?: number;
}

export default function AlertWidget({ spaceId, maxAlerts = 3 }: AlertWidgetProps) {
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [spaceId]);

  const loadAlerts = async () => {
    if (!spaceId) {
      setLoading(false);
      return;
    }

    try {
      const data = await alertService.getSpendingAnalysis(spaceId);
      // Get top alerts (Critical and High priority first)
      const sortedAlerts = data.alerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      setAlerts(sortedAlerts.slice(0, maxAlerts));
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'SPENDING_SPIKE':
        return <TrendingUp className="w-4 h-4" />;
      case 'RAPID_SPENDING':
        return <Zap className="w-4 h-4" />;
      case 'RECURRING_PAYMENT_DUE':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!spaceId) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Cảnh báo chi tiêu</h3>
          </div>
          {alerts.length > 0 && (
            <span className="bg-white text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Không có cảnh báo
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Chi tiêu đang ổn!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${getSeverityColor(alert.severity)} border border-current border-opacity-20 hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.alertType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">
                      {alert.title}
                    </p>
                    <p className="text-xs mt-1 line-clamp-2 opacity-90">
                      {alert.message}
                    </p>
                    {alert.amount !== undefined && (
                      <p className="text-sm font-bold mt-2">
                        {formatCurrency(alert.amount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        <Link
          to="/alerts"
          className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors py-2"
        >
          <span>Xem tất cả cảnh báo</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
