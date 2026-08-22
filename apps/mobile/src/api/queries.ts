import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncStatus } from '@/sync/SyncStatus';
import * as api from './endpoints';
import {
  CreateCategoryInput,
  CreateInstallmentInput,
  CreateRecurringInput,
  CreateTransactionInput,
  DashboardRange,
  TransactionFilters,
  TransactionType,
  UpdateCategoryInput,
  UpdateRecurrenceInput,
  UpdateTransactionInput,
} from './types';

export const keys = {
  categories: ['categories'] as const,
  tags: ['tags'] as const,
  transactions: (filters: TransactionFilters) => ['transactions', filters] as const,
  transaction: (id: string) => ['transaction', id] as const,
  recurrences: ['recurrences'] as const,
  installmentGroup: (groupId: string) => ['installment-group', groupId] as const,
  summary: (range: DashboardRange) => ['dashboard', 'summary', range] as const,
  byCategory: (range: DashboardRange & { type?: TransactionType }) =>
    ['dashboard', 'by-category', range] as const,
  balanceEvolution: (months: number) => ['dashboard', 'balance-evolution', months] as const,
};

const LEDGER_ROOTS = [
  'transactions',
  'transaction',
  'recurrences',
  'installment-group',
  'dashboard',
  'tags',
];

function invalidateLedger(client: QueryClient): Promise<void> {
  return Promise.all(
    LEDGER_ROOTS.map((root) => client.invalidateQueries({ queryKey: [root] })),
  ).then(() => undefined);
}

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: type ? [...keys.categories, type] : keys.categories,
    queryFn: () => api.categories.list(type),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTags() {
  return useQuery({ queryKey: keys.tags, queryFn: api.tags.list });
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: keys.transactions(filters),
    queryFn: () => api.transactions.list(filters),
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: keys.transaction(id ?? ''),
    queryFn: () => api.transactions.get(id as string),
    enabled: Boolean(id),
  });
}

export function useRecurrences(active?: boolean) {
  return useQuery({
    queryKey: active === undefined ? keys.recurrences : [...keys.recurrences, active],
    queryFn: () => api.recurrences.list(active),
  });
}

export function useInstallmentGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: keys.installmentGroup(groupId ?? ''),
    queryFn: () => api.transactions.installmentGroup(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useSummary(range: DashboardRange) {
  return useQuery({ queryKey: keys.summary(range), queryFn: () => api.dashboard.summary(range) });
}

export function useByCategory(range: DashboardRange & { type?: TransactionType }) {
  return useQuery({
    queryKey: keys.byCategory(range),
    queryFn: () => api.dashboard.byCategory(range),
  });
}

export function useBalanceEvolution(months: number) {
  return useQuery({
    queryKey: keys.balanceEvolution(months),
    queryFn: () => api.dashboard.balanceEvolution(months),
  });
}

function useLedgerMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const client = useQueryClient();
  const { assertCanEdit } = useSyncStatus();

  return useMutation({
    mutationFn: (input: TInput) => {
      assertCanEdit();
      return mutationFn(input);
    },
    onSuccess: () => invalidateLedger(client),
  });
}

export function useCreateTransaction() {
  return useLedgerMutation((input: CreateTransactionInput) => api.transactions.create(input));
}

export function useCreateRecurring() {
  return useLedgerMutation((input: CreateRecurringInput) =>
    api.transactions.createRecurring(input),
  );
}

export function useCreateInstallments() {
  return useLedgerMutation((input: CreateInstallmentInput) =>
    api.transactions.createInstallments(input),
  );
}

export function useUpdateTransaction(id: string) {
  return useLedgerMutation((input: UpdateTransactionInput) => api.transactions.update(id, input));
}

export function useDeleteTransaction(id: string) {
  return useLedgerMutation(() => api.transactions.remove(id));
}

export function useUpdateRecurrence(recurrenceId: string) {
  return useLedgerMutation((input: UpdateRecurrenceInput) =>
    api.recurrences.update(recurrenceId, input),
  );
}

export function useCancelRecurrence() {
  return useLedgerMutation((recurrenceId: string) => api.recurrences.cancel(recurrenceId));
}

function useCategoryMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const client = useQueryClient();
  const { assertCanEdit } = useSyncStatus();

  return useMutation({
    mutationFn: (input: TInput) => {
      assertCanEdit();
      return mutationFn(input);
    },
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: keys.categories }),
        invalidateLedger(client),
      ]).then(() => undefined),
  });
}

export function useCreateCategory() {
  return useCategoryMutation((input: CreateCategoryInput) => api.categories.create(input));
}

export function useUpdateCategory(id: string) {
  return useCategoryMutation((input: UpdateCategoryInput) => api.categories.update(id, input));
}

export function useDeleteCategory() {
  return useCategoryMutation((id: string) => api.categories.remove(id));
}

export function useDeleteTag() {
  const client = useQueryClient();
  const { assertCanEdit } = useSyncStatus();

  return useMutation({
    mutationFn: (id: string) => {
      assertCanEdit();
      return api.tags.remove(id);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: keys.tags }),
  });
}
