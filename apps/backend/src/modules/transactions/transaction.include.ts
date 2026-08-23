export const transactionInclude = {
  category: true,
  tags: { include: { tag: true } },
} as const;
