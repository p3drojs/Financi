import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncStatus } from '@/sync/SyncStatus';
import * as api from './endpoints';
import {
  CopyBudgetInput,
  CreateAccountInput,
  CreateBudgetInput,
  CreateCategoryInput,
  CreateContributionInput,
  CreateGoalInput,
  CreateInstallmentInput,
  CreateRecurringInput,
  CreateTransactionInput,
  CreateTransferInput,
  DashboardRange,
  UpdateAccountInput,
  UpdateGoalInput,
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
  forecast: (query: { until?: string; accountId?: string }) =>
    ['dashboard', 'forecast', query] as const,
  accounts: ['accounts'] as const,
  account: (id: string) => ['account', id] as const,
  upcoming: (days: number | undefined) => ['upcoming', days] as const,
  budgets: (month: string | undefined) => ['budgets', month] as const,
  goals: ['goals'] as const,
  goal: (id: string) => ['goal', id] as const,
};

const LEDGER_ROOTS = [
  'transactions',
  'transaction',
  'recurrences',
  'installment-group',
  'dashboard',
  'tags',
  'accounts',
  'account',
  'upcoming',
  'budgets',
  'goals',
  'goal',
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
  return useQuery({
    queryKey: keys.summary(range),
    queryFn: () => api.dashboard.summary(range),
  });
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

export function useForecast(query: { until?: string; accountId?: string } = {}) {
  return useQuery({
    queryKey: keys.forecast(query),
    queryFn: () => api.dashboard.forecast(query),
  });
}

export function useAccounts(includeArchived?: boolean) {
  return useQuery({
    queryKey: includeArchived ? [...keys.accounts, 'archived'] : keys.accounts,
    queryFn: () => api.accounts.list(includeArchived),
  });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: keys.account(id ?? ''),
    queryFn: () => api.accounts.get(id as string),
    enabled: Boolean(id),
  });
}

export function useUpcoming(days?: number) {
  return useQuery({
    queryKey: keys.upcoming(days),
    queryFn: () => api.transactions.upcoming(days),
  });
}

export function useBudgets(month?: string) {
  return useQuery({
    queryKey: keys.budgets(month),
    queryFn: () => api.budgets.list(month),
  });
}

export function useGoals(includeArchived?: boolean) {
  return useQuery({
    queryKey: includeArchived ? [...keys.goals, 'archived'] : keys.goals,
    queryFn: () => api.goals.list(includeArchived),
  });
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: keys.goal(id ?? ''),
    queryFn: () => api.goals.get(id as string),
    enabled: Boolean(id),
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

export function usePayTransactions() {
  return useLedgerMutation((ids: string[]) => api.transactions.pay(ids));
}

export function useCreateAccount() {
  return useLedgerMutation((input: CreateAccountInput) => api.accounts.create(input));
}

export function useUpdateAccount(id: string) {
  return useLedgerMutation((input: UpdateAccountInput) => api.accounts.update(id, input));
}

export function useDeleteAccount() {
  return useLedgerMutation((id: string) => api.accounts.remove(id));
}

export function useCreateTransfer() {
  return useLedgerMutation((input: CreateTransferInput) => api.accounts.transfer(input));
}

export function useDeleteTransfer() {
  return useLedgerMutation((transferGroupId: string) =>
    api.accounts.removeTransfer(transferGroupId),
  );
}

export function useCreateBudget() {
  return useLedgerMutation((input: CreateBudgetInput) => api.budgets.create(input));
}

export function useUpdateBudget() {
  return useLedgerMutation((input: { id: string; amount: number }) =>
    api.budgets.update(input.id, input.amount),
  );
}

export function useDeleteBudget() {
  return useLedgerMutation((id: string) => api.budgets.remove(id));
}

export function useCopyBudgets() {
  return useLedgerMutation((input: CopyBudgetInput) => api.budgets.copy(input));
}

export function useCreateGoal() {
  return useLedgerMutation((input: CreateGoalInput) => api.goals.create(input));
}

export function useUpdateGoal(id: string) {
  return useLedgerMutation((input: UpdateGoalInput) => api.goals.update(id, input));
}

export function useDeleteGoal() {
  return useLedgerMutation((id: string) => api.goals.remove(id));
}

export function useContribute(goalId: string) {
  return useLedgerMutation((input: CreateContributionInput) => api.goals.contribute(goalId, input));
}

export function useRemoveContribution(goalId: string) {
  return useLedgerMutation((contributionId: string) =>
    api.goals.removeContribution(goalId, contributionId),
  );
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
