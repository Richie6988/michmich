/**
 * Expense splitting and settlement algorithm.
 * Given a list of expenses, computes:
 *  - Net balance per user (paid - owed)
 *  - Optimal settlements that minimize the number of transfers
 *
 * This is the same algorithm Tricount and Splitwise use:
 * a greedy match between maximum debtor and maximum creditor,
 * which is optimal for minimizing transactions in O(n log n).
 */

import type { Expense, ExpenseBalance, Settlement, User, ExpenseShare } from '@barry/shared-types';

const EPSILON = 0.01; // 1 cent tolerance

/**
 * Build a balance per user from a list of expenses.
 */
export function computeBalances(
  expenses: Expense[],
  users: User[],
): ExpenseBalance[] {
  const balances = new Map<string, ExpenseBalance>();

  for (const u of users) {
    balances.set(u.id, { userId: u.id, user: u, totalPaid: 0, totalOwed: 0, net: 0 });
  }

  for (const exp of expenses) {
    const payer = balances.get(exp.paidBy);
    if (payer) payer.totalPaid += exp.amount;

    for (const share of exp.shares) {
      const debtor = balances.get(share.userId);
      if (debtor) debtor.totalOwed += share.amount;
    }
  }

  for (const b of balances.values()) {
    b.net = round(b.totalPaid - b.totalOwed);
    b.totalPaid = round(b.totalPaid);
    b.totalOwed = round(b.totalOwed);
  }

  return Array.from(balances.values());
}

/**
 * Compute optimal settlements (who pays whom).
 * Uses the standard greedy algorithm: at each step, the person who owes
 * the most pays the person who is owed the most. This is provably optimal
 * for minimizing the number of transactions in the general case.
 */
export function computeSettlements(balances: ExpenseBalance[]): Settlement[] {
  const settlements: Settlement[] = [];

  // Clone so we can mutate
  const debtors: { user: ExpenseBalance; amount: number }[] = [];
  const creditors: { user: ExpenseBalance; amount: number }[] = [];

  for (const b of balances) {
    if (b.net < -EPSILON) debtors.push({ user: b, amount: -b.net });
    else if (b.net > EPSILON) creditors.push({ user: b, amount: b.net });
  }

  // Sort: largest first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      fromUserId: debtor.user.userId,
      fromUser: debtor.user.user,
      toUserId: creditor.user.userId,
      toUser: creditor.user.user,
      amount: round(amount),
      currency: 'EUR',
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < EPSILON) i++;
    if (creditor.amount < EPSILON) j++;
  }

  return settlements;
}

/**
 * Build the share array for a given total + split mode.
 */
export function buildShares(
  totalAmount: number,
  participantIds: string[],
  splitMode: 'equal' | 'custom' | 'shares' | 'percent',
  customShares?: { userId: string; value: number }[],
): ExpenseShare[] {
  if (participantIds.length === 0) return [];

  if (splitMode === 'equal') {
    const each = totalAmount / participantIds.length;
    return participantIds.map(id => ({ userId: id, amount: round(each) }));
  }

  if (splitMode === 'percent' && customShares) {
    // customShares[i].value is percentage (0-100). They should sum to 100.
    return customShares.map(c => ({
      userId: c.userId,
      amount: round((c.value / 100) * totalAmount),
      shares: c.value,
    }));
  }

  if (splitMode === 'shares' && customShares) {
    const totalShares = customShares.reduce((s, c) => s + c.value, 0);
    if (totalShares === 0) return participantIds.map(id => ({ userId: id, amount: 0, shares: 0 }));
    return customShares.map(c => ({
      userId: c.userId,
      amount: round((c.value / totalShares) * totalAmount),
      shares: c.value,
    }));
  }

  if (splitMode === 'custom' && customShares) {
    return customShares.map(c => ({
      userId: c.userId,
      amount: round(c.value),
    }));
  }

  // Fallback: equal
  const each = totalAmount / participantIds.length;
  return participantIds.map(id => ({ userId: id, amount: round(each) }));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
