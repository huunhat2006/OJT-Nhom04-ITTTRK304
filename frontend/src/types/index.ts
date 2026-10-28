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
