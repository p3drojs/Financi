export type TransactionType = 'INCOME' | 'EXPENSE';

export type Money = string;
export type IsoDate = string;

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  createdAt: IsoDate;
}

export interface TransactionTag {
  transactionId: string;
  tagId: string;
  tag: Tag;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: Money;
  description: string | null;
  date: IsoDate;
  recurrenceId: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  category: Category;
  tags: TransactionTag[];
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Recurrence {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: Money;
  description: string | null;
  intervalMonths: number;
  startDate: IsoDate;
  endDate: IsoDate | null;
  occurrences: number | null;
  active: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface RecurrenceListItem extends Recurrence {
  category: Category;
  generatedCount: number;
  lastOccurrenceDate: IsoDate | null;
  upcomingCount: number;
  nextOccurrenceDate: IsoDate | null;
}

export interface InstallmentGroup {
  installmentGroupId: string;
  categoryId: string;
  category: Category;
  type: TransactionType;
  description: string | null;
  installmentTotal: number;
  installmentsGenerated: number;
  paidCount: number;
  remainingCount: number;
  totalAmount: Money;
  paidAmount: Money;
  remainingAmount: Money;
  transactions: Transaction[];
}

export interface DashboardSummary {
  totalIncome: Money;
  totalExpense: Money;
  balance: Money;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  type: TransactionType | undefined;
  total: Money;
}

export interface BalancePoint {
  month: string;
  income: Money;
  expense: Money;
  balance: Money;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface TransactionInputBase {
  categoryId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  tagNames?: string[];
}

export interface CreateTransactionInput extends TransactionInputBase {
  date: IsoDate;
}

export interface CreateRecurringInput extends TransactionInputBase {
  startDate: IsoDate;
  intervalMonths: number;
  endDate?: IsoDate;
  occurrences?: number;
}

export interface CreateInstallmentInput extends TransactionInputBase {
  startDate: IsoDate;
  installmentTotal: number;
}

export interface UpdateTransactionInput {
  categoryId?: string;
  amount?: number;
  description?: string;
  date?: IsoDate;
  tagNames?: string[];
}

export interface UpdateRecurrenceInput {
  categoryId?: string;
  amount?: number;
  description?: string;
  intervalMonths?: number;
  endDate?: IsoDate | null;
  occurrences?: number | null;
}

export interface RecurrenceWithOccurrences {
  recurrence: Recurrence;
  transactions: Transaction[];
}

export interface CreateCategoryInput {
  name: string;
  type: TransactionType;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name?: string;
}

export interface TransactionFilters {
  dateFrom?: IsoDate;
  dateTo?: IsoDate;
  categoryId?: string;
  type?: TransactionType;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardRange {
  dateFrom?: IsoDate;
  dateTo?: IsoDate;
}
