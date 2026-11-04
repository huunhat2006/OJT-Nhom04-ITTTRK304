// Tác giả: Frontend Developer - Alert Detail Modal
import { SpendingAlert } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import Modal from './Modal';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: SpendingAlert | null;
}

export default function AlertModal({ isOpen, onClose, alert }: AlertModalProps) {
  if (!alert) return null;

  const getRecommendations = (alert: SpendingAlert): string[] => {
    switch (alert.alertType) {
      case 'BUDGET_EXCEEDED':
        return [
          'Xem lại các khoản chi tiêu không cần thiết trong danh mục này',
          'Xem xét tăng ngân sách nếu đây là chi phí cần thiết',
          'Chuyển một số giao dịch sang danh mục khác nếu phân loại sai',
          'Lập kế hoạch giảm chi tiêu cho tháng tiếp theo',
        ];
      case 'SPENDING_SPIKE':
        return [
          'Kiểm tra các giao dịch bất thường hoặc không dự kiến',
          'Đánh giá xem đây có phải chi phí một lần hay xu hướng mới',
          'Điều chỉnh ngân sách cho tháng tới nếu cần',
          'Tìm cách tối ưu hóa chi phí trong danh mục này',
        ];
      case 'RAPID_SPENDING':
        return [
          'Hạn chế chi tiêu trong những ngày còn lại của tháng',
          'Ưu tiên các khoản chi thiết yếu',
          'Xem xét sử dụng ngân sách dự phòng nếu có',
          'Lên kế hoạch chi tiết cho từng ngày còn lại',
        ];
      case 'RECURRING_PAYMENT_DUE':
        return [
          'Đảm bảo số dư tài khoản đủ để thanh toán',
          'Thiết lập nhắc nhở hoặc tự động thanh toán',
          'Kiểm tra lại số tiền và ngày đến hạn',
          'Chuẩn bị nguồn tiền trước thời hạn',
        ];
      default:
        return [
          'Xem lại chi tiêu của bạn',
          'Lập kế hoạch tài chính rõ ràng hơn',
          'Theo dõi ngân sách thường xuyên',
        ];
    }
  };

  const recommendations = getRecommendations(alert);

  return (
    <Modal open={isOpen} onClose={onClose} title="Chi tiết cảnh báo">
      <div className="space-y-6">
        {/* Alert Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{alert.title}</h3>
          <p className="text-gray-700 leading-relaxed">{alert.message}</p>
        </div>

        {/* Alert Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 mb-3">Thông tin chi tiết</h4>
          
          {alert.amount !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Số tiền:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(alert.amount)}
              </span>
            </div>
          )}

          {alert.threshold !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ngưỡng cảnh báo:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(alert.threshold)}
              </span>
            </div>
          )}

          {alert.categoryName && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Danh mục:</span>
              <span className="font-semibold text-gray-900">{alert.categoryName}</span>
            </div>
          )}

          {alert.detectedAt && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phát hiện lúc:</span>
              <span className="font-semibold text-gray-900">
                {formatDate(alert.detectedAt)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Mức độ:</span>
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : ''}
              ${alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : ''}
              ${alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${alert.severity === 'LOW' ? 'bg-blue-100 text-blue-800' : ''}
            `}>
              {alert.severity === 'CRITICAL' && 'Nghiêm trọng'}
              {alert.severity === 'HIGH' && 'Cao'}
              {alert.severity === 'MEDIUM' && 'Trung bình'}
              {alert.severity === 'LOW' && 'Thấp'}
            </span>
          </div>
        </div>

        {/* Additional Metadata */}
        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Phân tích</h4>
            
            {alert.metadata.currentAmount !== undefined && (
              <div className="text-sm text-blue-900">
                Số tiền hiện tại: <span className="font-semibold">
                  {formatCurrency(alert.metadata.currentAmount)}
                </span>
              </div>
            )}

            {alert.metadata.previousAmount !== undefined && (
              <div className="text-sm text-blue-900">
                Số tiền trước đó: <span className="font-semibold">
                  {formatCurrency(alert.metadata.previousAmount)}
                </span>
              </div>
            )}

            {alert.metadata.increasePercent !== undefined && (
              <div className="text-sm text-blue-900">
                Tăng trưởng: <span className="font-semibold text-red-600">
                  +{alert.metadata.increasePercent.toFixed(1)}%
                </span>
              </div>
            )}

            {alert.metadata.daysPassed !== undefined && (
              <div className="text-sm text-blue-900">
                Ngày đã qua: <span className="font-semibold">
                  {alert.metadata.daysPassed} ngày
                </span>
              </div>
            )}

            {alert.metadata.daysRemaining !== undefined && (
              <div className="text-sm text-blue-900">
                Ngày còn lại: <span className="font-semibold">
                  {alert.metadata.daysRemaining} ngày
                </span>
              </div>
            )}

            {alert.metadata.spentPercent !== undefined && (
              <div className="text-sm text-blue-900">
                Đã chi: <span className="font-semibold">
                  {alert.metadata.spentPercent.toFixed(1)}%
                </span>
              </div>
            )}

            {alert.metadata.dayProgressPercent !== undefined && (
              <div className="text-sm text-blue-900">
                Tiến độ thời gian: <span className="font-semibold">
                  {alert.metadata.dayProgressPercent.toFixed(1)}%
                </span>
              </div>
            )}

            {alert.metadata.estimatedRunOutDay !== undefined && (
              <div className="text-sm text-orange-900 font-semibold">
                ⚠️ Dự kiến hết ngân sách vào ngày {alert.metadata.estimatedRunOutDay}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-3">💡 Đề xuất hành động</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-green-900">
                <span className="text-green-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              // Navigate to related page based on alert type
              if (alert.alertType.includes('BUDGET')) {
                window.location.href = '/budget';
              } else if (alert.alertType === 'RECURRING_PAYMENT_DUE') {
                window.location.href = '/transactions';
              } else {
                window.location.href = '/transactions';
              }
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </Modal>
  );
}
