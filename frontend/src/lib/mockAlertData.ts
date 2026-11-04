// Tác giả: Frontend Developer - Mock Alert Data for Testing
import { SpendingAlert, SpendingAnalysisResponse } from '../types';

/**
 * Mock data để test Alert components khi chưa có backend API
 * Uncomment phần này trong alertService.ts để sử dụng
 */

export const mockAlerts: SpendingAlert[] = [
  // CRITICAL - Budget Exceeded
  {
    alertType: 'BUDGET_EXCEEDED',
    severity: 'CRITICAL',
    title: 'Vượt ngân sách Ăn uống',
    message: 'Bạn đã chi 5,200,000 VNĐ cho Ăn uống, vượt 104% ngân sách đã đặt (5,000,000 VNĐ).',
    amount: 5200000,
    threshold: 5000000,
    categoryName: 'Ăn uống',
    categoryId: 5,
    detectedAt: new Date().toISOString(),
    metadata: {
      currentAmount: 5200000,
      budgetAmount: 5000000,
      spentPercent: 104,
      budgetId: 123,
    },
  },

  // HIGH - Spending Spike
  {
    alertType: 'SPENDING_SPIKE',
    severity: 'HIGH',
    title: 'Chi tiêu Mua sắm tăng đột biến',
    message: 'Chi tiêu cho Mua sắm tháng này tăng 75% so với trung bình 3 tháng trước (từ 2,000,000 VNĐ lên 3,500,000 VNĐ).',
    amount: 3500000,
    threshold: 2000000,
    categoryName: 'Mua sắm',
    categoryId: 8,
    detectedAt: new Date().toISOString(),
    metadata: {
      currentAmount: 3500000,
      previousAmount: 2000000,
      increasePercent: 75,
    },
  },

  // HIGH - Rapid Spending
  {
    alertType: 'RAPID_SPENDING',
    severity: 'HIGH',
    title: 'Chi tiêu quá nhanh trong danh mục Giải trí',
    message: 'Bạn đã chi 70% ngân sách Giải trí nhưng mới qua 33% thời gian trong tháng. Dự kiến sẽ hết ngân sách vào ngày 18.',
    amount: 2100000,
    threshold: 3000000,
    categoryName: 'Giải trí',
    categoryId: 10,
    detectedAt: new Date().toISOString(),
    metadata: {
      spentPercent: 70,
      dayProgressPercent: 33,
      daysPassed: 10,
      daysRemaining: 20,
      estimatedRunOutDay: 18,
      budgetId: 124,
    },
  },

  // MEDIUM - Recurring Payment Due
  {
    alertType: 'RECURRING_PAYMENT_DUE',
    severity: 'MEDIUM',
    title: 'Tiền nhà sắp đến hạn',
    message: 'Khoản thanh toán định kỳ "Tiền nhà" với số tiền 5,000,000 VNĐ sẽ đến hạn trong 3 ngày nữa.',
    amount: 5000000,
    categoryName: 'Nhà ở',
    categoryId: 15,
    detectedAt: new Date().toISOString(),
    metadata: {
      daysRemaining: 3,
      recurringTransactionId: 45,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },

  // MEDIUM - Budget Warning
  {
    alertType: 'BUDGET_WARNING',
    severity: 'MEDIUM',
    title: 'Sắp vượt ngân sách Đi lại',
    message: 'Bạn đã chi 85% ngân sách Đi lại (2,550,000 / 3,000,000 VNĐ). Hãy cân nhắc chi tiêu thận trọng.',
    amount: 2550000,
    threshold: 3000000,
    categoryName: 'Đi lại',
    categoryId: 12,
    detectedAt: new Date().toISOString(),
    metadata: {
      spentPercent: 85,
      budgetId: 125,
      warningThreshold: 80,
    },
  },

  // LOW - Budget Pace Warning
  {
    alertType: 'BUDGET_PACE_WARNING',
    severity: 'LOW',
    title: 'Tốc độ chi tiêu Café hơi cao',
    message: 'Chi tiêu cho Café đang cao hơn 15% so với tốc độ bình thường. Theo dõi để tránh vượt ngân sách.',
    amount: 920000,
    threshold: 1000000,
    categoryName: 'Café',
    categoryId: 6,
    detectedAt: new Date().toISOString(),
    metadata: {
      spentPercent: 60,
      dayProgressPercent: 45,
      budgetId: 126,
    },
  },

  // LOW - Recurring Payment Reminder
  {
    alertType: 'RECURRING_PAYMENT_DUE',
    severity: 'LOW',
    title: 'Nhắc nhở: Internet sắp đến hạn',
    message: 'Khoản thanh toán "Internet" với số tiền 300,000 VNĐ sẽ đến hạn trong 7 ngày.',
    amount: 300000,
    categoryName: 'Tiện ích',
    categoryId: 18,
    detectedAt: new Date().toISOString(),
    metadata: {
      daysRemaining: 7,
      recurringTransactionId: 46,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export const mockAnalysisResponse: SpendingAnalysisResponse = {
  alerts: mockAlerts,
  healthScore: {
    score: 65,
    level: 'FAIR',
    message: 'Chi tiêu của bạn cần được chú ý. Có một số vấn đề cần xử lý.',
  },
  recommendations: [
    {
      type: 'REDUCE_SPENDING',
      title: 'Giảm chi tiêu Ăn uống',
      description: 'Bạn đã vượt ngân sách Ăn uống. Hãy cân nhắc nấu ăn tại nhà nhiều hơn.',
      priority: 'HIGH',
      categoryId: 5,
      categoryName: 'Ăn uống',
    },
    {
      type: 'ADJUST_BUDGET',
      title: 'Điều chỉnh ngân sách Mua sắm',
      description: 'Chi tiêu Mua sắm tăng cao. Xem xét tăng ngân sách hoặc giảm chi tiêu.',
      priority: 'MEDIUM',
      categoryId: 8,
      categoryName: 'Mua sắm',
    },
    {
      type: 'REVIEW_RECURRING',
      title: 'Kiểm tra các khoản thanh toán định kỳ',
      description: 'Đảm bảo có đủ tiền cho các khoản thanh toán sắp tới.',
      priority: 'LOW',
    },
  ],
  analysisDate: new Date().toISOString(),
  spaceId: 1,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

/**
 * Helper function để mock API call với delay
 */
export const mockApiCall = <T,>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Cách sử dụng trong alertService.ts:
 * 
 * // Thay vì gọi API thật:
 * const { data } = await api.get<SpendingAnalysisResponse>('/alerts/analysis', { params });
 * 
 * // Dùng mock data:
 * const data = await mockApiCall(mockAnalysisResponse);
 * 
 * // Hoặc với random delay:
 * const data = await mockApiCall(mockAnalysisResponse, Math.random() * 1000);
 */

/**
 * Generate random alerts for testing
 */
export const generateRandomAlerts = (count: number = 5): SpendingAlert[] => {
  const types: Array<SpendingAlert['alertType']> = [
    'BUDGET_EXCEEDED',
    'SPENDING_SPIKE',
    'RAPID_SPENDING',
    'RECURRING_PAYMENT_DUE',
    'BUDGET_WARNING',
  ];
  
  const severities: Array<SpendingAlert['severity']> = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
  ];
  
  const categories = [
    'Ăn uống',
    'Mua sắm',
    'Giải trí',
    'Đi lại',
    'Nhà ở',
    'Tiện ích',
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 5000000) + 500000;

    return {
      alertType: type,
      severity,
      title: `Cảnh báo ${type} - ${category}`,
      message: `Đây là cảnh báo test số ${i + 1} cho danh mục ${category}`,
      amount,
      threshold: amount * 0.8,
      categoryName: category,
      categoryId: i + 1,
      detectedAt: new Date().toISOString(),
      metadata: {
        spentPercent: Math.random() * 50 + 50,
        budgetId: i + 100,
      },
    };
  });
};
