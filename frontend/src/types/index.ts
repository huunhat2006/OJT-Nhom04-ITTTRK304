// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  hasPassword?: boolean; // false nếu đăng nhập bằng Google và chưa thiết lập mật khẩu
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface FamilyMember {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt?: string;
  isActive: boolean;
}

export interface FinancialSpace {
  id: number;
  name: string;
  description?: string;
  type: 'PERSONAL' | 'FAMILY';
  currency?: string;
  ownerId: number;
  ownerName?: string;
  inviteCode?: string;
  isActive: boolean;
  createdAt?: string;
  members?: FamilyMember[];
}

export interface Category {
  id: number;
  name: string;
  nameVi?: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  icon?: string;
  color?: string;
  isSystem: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface Wallet {
  id: number;
  userId: number;
  spaceId?: number;
  name: string;
  walletType: 'CASH' | 'BANK' | 'E_WALLET';
  currency: string;
  balance: number;
  isShared: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: number;
  spaceId: number;
  spaceName?: string;
  userId: number;
  userName?: string;
  category?: Category | null;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description?: string;
  transactionDate: string;
  note?: string;
  receiptUrl?: string;
  walletName?: string;
  walletType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: number;
  spaceId: number;
  category?: Category | null;
  amount: number;
  month: number;
  year: number;
  warningThreshold: number;
  spent: number;
  remaining: number;
  usagePercentage: number;
  status: 'NORMAL' | 'WARNING' | 'EXCEEDED';
}

export interface SavingsGoal {
  id: number;
  spaceId: number;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate?: string;
  deadline?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  icon?: string;
  color?: string;
  progressPercentage: number;
  remainingAmount: number;
}

export interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  categoryNameVi?: string;
  color?: string;
  icon?: string;
  amount: number;
  percentage: number;
}

export interface DashboardResponse {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expenseByCategory: CategoryExpense[];
  budgets: Budget[];
  budgetWarnings: Budget[];
  savingsGoals: SavingsGoal[];
  recentTransactions: Transaction[];
}

export interface ReportData {
  monthlySummaries: Array<{
    year: number;
    month: number;
    income: number;
    expense: number;
    balance: number;
  }>;
  trends: Array<{
    label: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  expenseByCategory: CategoryExpense[];
  incomeByCategory: CategoryExpense[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  totalSpaces: number;
  familySpaces: number;
  totalTransactionsThisMonth: number;
  newUsersThisMonth: number;
  userRegistrationTrend: Array<{
    year: number;
    month: number;
    label: string;
    count: number;
  }>;
  transactionTrend: Array<{
    year: number;
    month: number;
    label: string;
    count: number;
  }>;
}

export interface AuditLog {
  id: number;
  adminId: number;
  adminUsername: string;
  adminFullName: string;
  action: string;
  targetType?: string;
  targetId?: number;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// SPENDING ALERTS - Smart Spending Warnings
// ============================================

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertType = 
  | 'BUDGET_EXCEEDED'           // Chi tiêu vượt ngân sách
  | 'BUDGET_WARNING'            // Cảnh báo sắp vượt ngân sách
  | 'SPENDING_SPIKE'            // Chi tăng đột biến
  | 'RAPID_SPENDING'            // Chi quá nhanh
  | 'RECURRING_PAYMENT_DUE'     // Thanh toán định kỳ sắp đến hạn
  | 'BUDGET_PACE_WARNING';      // Tốc độ chi tiêu không hợp lý

export interface SpendingAlert {
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  amount?: number;
  threshold?: number;
  categoryName?: string;
  categoryId?: number;
  detectedAt: string;
  metadata?: {
    currentAmount?: number;
    previousAmount?: number;
    increasePercent?: number;
    daysRemaining?: number;
    estimatedRunOutDay?: number;
    daysPassed?: number;
    spentPercent?: number;
    dayProgressPercent?: number;
    budgetId?: number;
    recurringTransactionId?: number;
    dueDate?: string;
    [key: string]: any;
  };
}

export interface SpendingHealthScore {
  score: number; // 0-100
  level: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  message: string;
}

export interface SpendingRecommendation {
  type: 'REDUCE_SPENDING' | 'ADJUST_BUDGET' | 'CHANGE_CATEGORY' | 'REVIEW_RECURRING';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  categoryId?: number;
  categoryName?: string;
}

export interface SpendingAnalysisResponse {
  alerts: SpendingAlert[];
  healthScore?: SpendingHealthScore;
  recommendations?: SpendingRecommendation[];
  analysisDate: string;
  spaceId: number;
  month: number;
  year: number;
}

// ============================================
// RECURRING TRANSACTIONS - Giao dịch định kỳ
// ============================================

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';

export interface RecurringTransaction {
  id: number;
  spaceId: number;
  walletId?: number;
  walletName?: string;
  category?: Category | null;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  nextRunDate: string;
  lastRunDate?: string | null;
  status: RecurringStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringTransactionLog {
  id: number;
  recurringTransactionId: number;
  executedAt: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  transactionId?: number;
  note?: string;
}
