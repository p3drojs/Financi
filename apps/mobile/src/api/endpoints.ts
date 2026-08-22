import { request } from './client';
import {
  AuthResult,
  BalancePoint,
  Category,
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
    request<RecurrenceWithOccurrences>('/transactions/recurring', { method: 'POST', body: input }),
  createInstallments: (input: CreateInstallmentInput) =>
    request<Transaction[]>('/transactions/installments', { method: 'POST', body: input }),
  update: (id: string, input: UpdateTransactionInput) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
  installmentGroup: (groupId: string) =>
    request<InstallmentGroup>(`/transactions/installments/${groupId}`),
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
    request<void>(`/transactions/recurring/${recurrenceId}`, { method: 'DELETE' }),
};

export const dashboard = {
  summary: (range: DashboardRange = {}) =>
    request<DashboardSummary>('/dashboard/summary', { query: { ...range } }),
  byCategory: (range: DashboardRange & { type?: TransactionType } = {}) =>
    request<CategoryTotal[]>('/dashboard/by-category', { query: { ...range } }),
  balanceEvolution: (months: number) =>
    request<BalancePoint[]>('/dashboard/balance-evolution', { query: { months } }),
};
