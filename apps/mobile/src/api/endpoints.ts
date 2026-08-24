import { request } from './client';
import {
  Account,
  AccountDetail,
  AuthResult,
  BalancePoint,
  BudgetEnvelope,
  BudgetItem,
  Category,
  CopyBudgetInput,
  CreateAccountInput,
  CreateBudgetInput,
  CreateContributionInput,
  CreateGoalInput,
  CreateTransferInput,
  Forecast,
  Goal,
  Transfer,
  UpcomingResponse,
  UpdateAccountInput,
  UpdateGoalInput,
  CategoryTotal,
  CreateCategoryInput,
  CreateInstallmentInput,
  CreateRecurringInput,
  CreateTransactionInput,
  DashboardRange,
  DashboardSummary,
  InstallmentGroup,
  LoginInput,
  RecurrenceListItem,
  RecurrenceWithOccurrences,
  RegisterInput,
  Tag,
  Transaction,
  TransactionFilters,
  TransactionPage,
  TransactionType,
  UpdateCategoryInput,
  UpdateRecurrenceInput,
  UpdateTransactionInput,
} from './types';

export const auth = {
  login: (input: LoginInput) => request<AuthResult>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: input }),
  refresh: (refreshToken: string) =>
    request<AuthResult>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),
  logout: (refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
};

export const categories = {
  list: (type?: TransactionType) => request<Category[]>('/categories', { query: { type } }),
  get: (id: string) => request<Category>(`/categories/${id}`),
  create: (input: CreateCategoryInput) =>
    request<Category>('/categories', { method: 'POST', body: input }),
  update: (id: string, input: UpdateCategoryInput) =>
    request<Category>(`/categories/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};

export const tags = {
  list: () => request<Tag[]>('/tags'),
  remove: (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
};

export const transactions = {
  list: (filters: TransactionFilters = {}) =>
    request<TransactionPage>('/transactions', { query: { ...filters } }),
  get: (id: string) => request<Transaction>(`/transactions/${id}`),
  create: (input: CreateTransactionInput) =>
    request<Transaction>('/transactions', { method: 'POST', body: input }),
  createRecurring: (input: CreateRecurringInput) =>
    request<RecurrenceWithOccurrences>('/transactions/recurring', {
      method: 'POST',
      body: input,
    }),
  createInstallments: (input: CreateInstallmentInput) =>
    request<Transaction[]>('/transactions/installments', {
      method: 'POST',
      body: input,
    }),
  update: (id: string, input: UpdateTransactionInput) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: input,
    }),
  remove: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
  installmentGroup: (groupId: string) =>
    request<InstallmentGroup>(`/transactions/installments/${groupId}`),
  pay: (ids: string[]) =>
    request<{ updated: number }>('/transactions/pay', {
      method: 'POST',
      body: { ids },
    }),
  upcoming: (days?: number) =>
    request<UpcomingResponse>('/transactions/upcoming', { query: { days } }),
};

export const recurrences = {
  list: (active?: boolean) =>
    request<RecurrenceListItem[]>('/transactions/recurring', {
      query: { active: active === undefined ? undefined : String(active) },
    }),
  update: (recurrenceId: string, input: UpdateRecurrenceInput) =>
    request<RecurrenceWithOccurrences>(`/transactions/recurring/${recurrenceId}`, {
      method: 'PATCH',
      body: input,
    }),
  cancel: (recurrenceId: string) =>
    request<void>(`/transactions/recurring/${recurrenceId}`, {
      method: 'DELETE',
    }),
};

export const dashboard = {
  summary: (range: DashboardRange = {}) =>
    request<DashboardSummary>('/dashboard/summary', { query: { ...range } }),
  byCategory: (range: DashboardRange & { type?: TransactionType } = {}) =>
    request<CategoryTotal[]>('/dashboard/by-category', { query: { ...range } }),
  balanceEvolution: (months: number, accountId?: string) =>
    request<BalancePoint[]>('/dashboard/balance-evolution', {
      query: { months, accountId },
    }),
  forecast: (query: { until?: string; accountId?: string } = {}) =>
    request<Forecast>('/dashboard/forecast', { query: { ...query } }),
};

export const accounts = {
  list: (includeArchived?: boolean) =>
    request<Account[]>('/accounts', {
      query: { includeArchived: includeArchived ? 'true' : undefined },
    }),
  get: (id: string) => request<AccountDetail>(`/accounts/${id}`),
  create: (input: CreateAccountInput) =>
    request<Account>('/accounts', { method: 'POST', body: input }),
  update: (id: string, input: UpdateAccountInput) =>
    request<Account>(`/accounts/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
  transfer: (input: CreateTransferInput) =>
    request<Transfer>('/accounts/transfers', { method: 'POST', body: input }),
  removeTransfer: (transferGroupId: string) =>
    request<void>(`/accounts/transfers/${transferGroupId}`, {
      method: 'DELETE',
    }),
};

export const budgets = {
  list: (month?: string) => request<BudgetEnvelope>('/budgets', { query: { month } }),
  create: (input: CreateBudgetInput) =>
    request<BudgetItem>('/budgets', { method: 'POST', body: input }),
  update: (id: string, amount: number) =>
    request<BudgetItem>(`/budgets/${id}`, {
      method: 'PATCH',
      body: { amount },
    }),
  remove: (id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
  copy: (input: CopyBudgetInput) =>
    request<{ created: number; skipped: number }>('/budgets/copy', {
      method: 'POST',
      body: input,
    }),
};

export const goals = {
  list: (includeArchived?: boolean) =>
    request<Goal[]>('/goals', {
      query: { includeArchived: includeArchived ? 'true' : undefined },
    }),
  get: (id: string) => request<Goal>(`/goals/${id}`),
  create: (input: CreateGoalInput) => request<Goal>('/goals', { method: 'POST', body: input }),
  update: (id: string, input: UpdateGoalInput) =>
    request<Goal>(`/goals/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),
  contribute: (id: string, input: CreateContributionInput) =>
    request<Goal>(`/goals/${id}/contributions`, {
      method: 'POST',
      body: input,
    }),
  removeContribution: (id: string, contributionId: string) =>
    request<Goal>(`/goals/${id}/contributions/${contributionId}`, {
      method: 'DELETE',
    }),
};
