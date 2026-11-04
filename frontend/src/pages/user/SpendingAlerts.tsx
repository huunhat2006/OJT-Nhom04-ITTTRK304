// Tác giả: Frontend Developer - Spending Alerts Page
import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  Filter,
  Download
} from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import { SpendingAlert, SpendingAnalysisResponse, AlertSeverity, AlertType } from '../../types';
import { alertService } from '../../lib/alertService';
import AlertCard from '../../components/AlertCard';
import AlertModal from '../../components/AlertModal';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';

export default function SpendingAlerts() {
  const { currentSpace } = useSpaceStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<SpendingAnalysisResponse | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SpendingAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<AlertType | 'ALL'>('ALL');

  useEffect(() => {
    loadAlerts();
  }, [currentSpace]);

  const loadAlerts = async () => {
    if (!currentSpace) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await alertService.getSpendingAnalysis(currentSpace.id);
      setAnalysis(data);
    } catch (error: any) {
      console.error('Failed to load alerts:', error);
      toast.error('Không thể tải cảnh báo chi tiêu');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentSpace) return;

    try {
      setRefreshing(true);
      toast.loading('Đang phân tích chi tiêu...', { id: 'refresh' });
      await alertService.triggerManualCheck(currentSpace.id);
      await loadAlerts();
      toast.success('Đã cập nhật cảnh báo!', { id: 'refresh' });
    } catch (error: any) {
      toast.error('Không thể làm mới cảnh báo', { id: 'refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleAlertClick = (alert: SpendingAlert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  // Filter alerts
  const filteredAlerts = analysis?.alerts.filter((alert) => {
    if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;
    if (filterType !== 'ALL' && alert.alertType !== filterType) return false;
    return true;
  }) || [];

  // Group alerts by severity
  const alertsBySeverity = {
    CRITICAL: filteredAlerts.filter(a => a.severity === 'CRITICAL'),
    HIGH: filteredAlerts.filter(a => a.severity === 'HIGH'),
    MEDIUM: filteredAlerts.filter(a => a.severity === 'MEDIUM'),
    LOW: filteredAlerts.filter(a => a.severity === 'LOW'),
  };

  const getTotalAlertAmount = () => {
    return filteredAlerts.reduce((sum, alert) => sum + (alert.amount || 0), 0);
  };

  if (!currentSpace) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
          <p className="text-gray-700">Vui lòng chọn không gian tài chính để xem cảnh báo</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            Cảnh báo chi tiêu thông minh
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
        <p className="text-gray-600">
          Hệ thống tự động phát hiện và cảnh báo các vấn đề về chi tiêu của bạn
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Nghiêm trọng</span>
            <span className="text-2xl font-bold text-red-600">
              {alertsBySeverity.CRITICAL.length}
            </span>
          </div>
          <div className="text-xs text-gray-500">Cần xử lý ngay</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Cao</span>
            <span className="text-2xl font-bold text-orange-600">
              {alertsBySeverity.HIGH.length}
            </span>
          </div>
          <div className="text-xs text-gray-500">Ưu tiên cao</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Trung bình</span>
            <span className="text-2xl font-bold text-yellow-600">
              {alertsBySeverity.MEDIUM.length}
            </span>
          </div>
          <div className="text-xs text-gray-500">Theo dõi</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Thấp</span>
            <span className="text-2xl font-bold text-blue-600">
              {alertsBySeverity.LOW.length}
            </span>
          </div>
          <div className="text-xs text-gray-500">Thông tin</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Severity Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mức độ
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as AlertSeverity | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tất cả</option>
              <option value="CRITICAL">Nghiêm trọng</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại cảnh báo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AlertType | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tất cả</option>
              <option value="BUDGET_EXCEEDED">Vượt ngân sách</option>
              <option value="BUDGET_WARNING">Cảnh báo ngân sách</option>
              <option value="SPENDING_SPIKE">Chi tăng đột biến</option>
              <option value="RAPID_SPENDING">Chi quá nhanh</option>
              <option value="RECURRING_PAYMENT_DUE">Thanh toán định kỳ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-900 mb-2">
            Tuyệt vời! Không có cảnh báo
          </h3>
          <p className="text-green-700">
            Chi tiêu của bạn đang trong tầm kiểm soát. Tiếp tục duy trì!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredAlerts.length} cảnh báo
              {getTotalAlertAmount() > 0 && (
                <span className="ml-2 text-red-600">
                  ({formatCurrency(getTotalAlertAmount())})
                </span>
              )}
            </h2>
          </div>

          {/* Critical Alerts */}
          {alertsBySeverity.CRITICAL.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                NGHIÊM TRỌNG ({alertsBySeverity.CRITICAL.length})
              </h3>
              <div className="space-y-3">
                {alertsBySeverity.CRITICAL.map((alert, index) => (
                  <AlertCard
                    key={`critical-${index}`}
                    alert={alert}
                    onClick={() => handleAlertClick(alert)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* High Alerts */}
          {alertsBySeverity.HIGH.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                CAO ({alertsBySeverity.HIGH.length})
              </h3>
              <div className="space-y-3">
                {alertsBySeverity.HIGH.map((alert, index) => (
                  <AlertCard
                    key={`high-${index}`}
                    alert={alert}
                    onClick={() => handleAlertClick(alert)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium Alerts */}
          {alertsBySeverity.MEDIUM.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                TRUNG BÌNH ({alertsBySeverity.MEDIUM.length})
              </h3>
              <div className="space-y-3">
                {alertsBySeverity.MEDIUM.map((alert, index) => (
                  <AlertCard
                    key={`medium-${index}`}
                    alert={alert}
                    onClick={() => handleAlertClick(alert)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low Alerts */}
          {alertsBySeverity.LOW.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                THẤP ({alertsBySeverity.LOW.length})
              </h3>
              <div className="space-y-3">
                {alertsBySeverity.LOW.map((alert, index) => (
                  <AlertCard
                    key={`low-${index}`}
                    alert={alert}
                    onClick={() => handleAlertClick(alert)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert Detail Modal */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alert={selectedAlert}
      />
    </div>
  );
}
