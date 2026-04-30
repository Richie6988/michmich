'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { formatDateShort } from '@/lib/utils/format-date';
import { computeBalances, computeSettlements } from '@/lib/utils/expenses';
import type { Expense, ExpenseCategory, ExpenseSplitMode, User } from '@barry/shared-types';

const CATEGORIES: { value: ExpenseCategory; label: string; color: string; icon: JSX.Element }[] = [
  { value: 'food', label: 'Food', color: '#F97316', icon: <><path d="M7 2v20M17 2v6c0 2 1 3 3 3v11M3 11h8M3 7h8" /></> },
  { value: 'drinks', label: 'Drinks', color: '#EC4899', icon: <><path d="M3 5h18l-9 9-9-9zm9 9v6m-4 0h8" /></> },
  { value: 'transport', label: 'Transport', color: '#2563EB', icon: <><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h3l2 4M5 17l5-9 4 9M9 5h4l2 12" /></> },
  { value: 'accommodation', label: 'Stay', color: '#8B5CF6', icon: <><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" /></> },
  { value: 'activity', label: 'Activity', color: '#10B981', icon: <><path d="M12 2l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z" /></> },
  { value: 'shopping', label: 'Shopping', color: '#F59E0B', icon: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></> },
  { value: 'other', label: 'Other', color: '#64748B', icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></> },
];

export default function ExpensesPage() {
  const { id } = useParams<{ id: string }>();
  const {
    expenses, addExpense, removeExpense, currentUser, activeTrip, trips,
    closeExpenseLedger,
  } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<'list' | 'balances'>('list');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closedSettlements, setClosedSettlements] = useState<any[] | null>(null);

  const tripExpenses = expenses[id as string] || [];

  const balances = useMemo(() => {
    if (!trip) return [];
    const users = trip.participants.map(p => p.user!).filter(Boolean);
    return computeBalances(tripExpenses, users);
  }, [tripExpenses, trip]);

  const settlements = useMemo(() => computeSettlements(balances), [balances]);

  if (!trip) {
    return (
      <div className="px-4 py-12 text-center">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-slate-500 mt-4">Trip not found</p>
      </div>
    );
  }

  if (tripExpenses.length === 0 && !showAdd) {
    return (
      <div className="px-4 py-8">
        <div className="text-center mb-6">
          <BarryMascot mood="default" size={84} />
          <h2 className="font-display font-bold text-xl text-slate-900 mt-3">Track who paid what</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
            Drop expenses as they happen. Barry settles everyone fairly at the end.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          + Add first expense
        </button>
      </div>
    );
  }

  const totalSpent = tripExpenses.reduce((s, e) => s + e.amount, 0);
  const myBalance = balances.find(b => b.userId === currentUser?.id);
  const isAdmin = trip.organizerId === currentUser?.id;

  return (
    <div className="px-4 py-4 pb-32">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 mb-4 text-white shadow-lg shadow-slate-900/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total spent</p>
            <p className="font-display font-extrabold text-3xl tracking-tight">{totalSpent.toFixed(2)} EUR</p>
            <p className="text-xs text-slate-400 mt-1">{tripExpenses.length} {tripExpenses.length === 1 ? 'expense' : 'expenses'}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
        </div>

        {myBalance && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-slate-200">Your balance</span>
            <span className={`font-bold text-lg ${myBalance.net > 0 ? 'text-emerald-300' : myBalance.net < 0 ? 'text-rose-300' : 'text-slate-200'}`}>
              {myBalance.net > 0 ? '+' : ''}{myBalance.net.toFixed(2)} EUR
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-100 rounded-xl p-1 flex gap-1 mb-4">
        <button
          onClick={() => setView('list')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setView('balances')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === 'balances' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Balances
        </button>
      </div>

      {view === 'list' ? (
        <div className="space-y-2">
          {tripExpenses.map(exp => (
            <ExpenseRow key={exp.id} expense={exp} currentUserId={currentUser?.id}
              participants={trip.participants.map(p => p.user!).filter(Boolean)}
              onRemove={() => removeExpense(id as string, exp.id)} />
          ))}
        </div>
      ) : (
        <BalancesView balances={balances} settlements={settlements} />
      )}

      {/* Close ledger button - admin only when there are balances */}
      {view === 'balances' && isAdmin && balances.some(b => b.net !== 0) && !closedSettlements && (
        <button
          onClick={() => setShowCloseConfirm(true)}
          className="w-full mt-4 bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          Close ledger and notify everyone
        </button>
      )}

      {closedSettlements && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-semibold text-emerald-900 text-sm">Ledger closed</p>
          </div>
          <p className="text-xs text-emerald-800 leading-snug">
            Email notifications sent to {trip.participants.length} participants with their settlements.
            Reimbursements credited as in-app balance for future trips.
          </p>
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-4 z-40 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-all"
        aria-label="Add expense"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {showAdd && (
        <AddExpenseSheet
          tripId={id as string}
          participants={trip.participants.map(p => p.user!).filter(Boolean)}
          currentUserId={currentUser!.id}
          onClose={() => setShowAdd(false)}
          onAdd={(input) => { addExpense(id as string, input); setShowAdd(false); }}
        />
      )}

      {showCloseConfirm && (
        <CloseLedgerSheet
          settlementCount={settlements.length}
          totalAmount={settlements.reduce((s, x) => s + x.amount, 0)}
          onConfirm={() => {
            const result = closeExpenseLedger(id as string);
            setClosedSettlements(result);
            setShowCloseConfirm(false);
          }}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
    </div>
  );
}

function ExpenseRow({ expense, currentUserId, participants, onRemove }: {
  expense: Expense;
  currentUserId?: string;
  participants: User[];
  onRemove: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const cat = CATEGORIES.find(c => c.value === expense.category) || CATEGORIES[CATEGORIES.length - 1];
  const myShare = expense.shares.find(s => s.userId === currentUserId);
  const iPaid = expense.paidBy === currentUserId;

  const userName = (uid: string) => {
    const u = participants.find(p => p.id === uid);
    return u ? `${u.firstName} ${u.lastName?.[0] || ''}`.trim() : uid;
  };

  return (
    <div
      onClick={() => setShowActions(s => !s)}
      className="bg-white rounded-2xl border border-slate-100 p-3.5 cursor-pointer hover:border-slate-200 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {cat.icon}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-[15px] truncate">{expense.description}</h4>
          <p className="text-xs text-slate-500">
            <span className="font-medium">{expense.payer?.firstName}</span> paid · {formatDateShort(expense.date)}
            {expense.splitMode === 'percent' && <span> · % split</span>}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-slate-900">{expense.amount.toFixed(2)} EUR</p>
          {myShare && (
            <p className={`text-[11px] font-medium ${iPaid ? 'text-emerald-600' : 'text-slate-500'}`}>
              {iPaid ? `+${(expense.amount - myShare.amount).toFixed(2)}` : `-${myShare.amount.toFixed(2)}`}
            </p>
          )}
        </div>
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">Per-person share</p>
          <div className="space-y-1 mb-3">
            {expense.shares.map(s => (
              <div key={s.userId} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-700">{userName(s.userId)}</span>
                <span className="font-semibold text-slate-900">
                  {s.amount.toFixed(2)} EUR
                  {expense.splitMode === 'percent' && s.shares !== undefined && (
                    <span className="ml-1 text-slate-400">({s.shares}%)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-xs text-rose-600 font-medium hover:underline"
          >
            Delete this expense
          </button>
        </div>
      )}
    </div>
  );
}

function BalancesView({ balances, settlements }: { balances: any[]; settlements: any[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-3.5">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Who's where</h3>
        <div className="space-y-2.5">
          {balances.map((b, i) => (
            <div key={b.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs"
                  style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}
                >
                  {b.user?.firstName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{b.user?.firstName}</p>
                  <p className="text-[10px] text-slate-500">
                    Paid {b.totalPaid.toFixed(2)} EUR · Owes {b.totalOwed.toFixed(2)} EUR
                  </p>
                </div>
              </div>
              <span className={`text-sm font-bold ${b.net > 0 ? 'text-emerald-600' : b.net < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {b.net > 0 ? '+' : ''}{b.net.toFixed(2)} EUR
              </span>
            </div>
          ))}
        </div>
      </div>

      {settlements.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 text-sm">Settle up</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {settlements.length} {settlements.length === 1 ? 'transfer' : 'transfers'}
            </span>
          </div>
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: '#EF4444' }}>
                  {s.fromUser?.firstName?.[0]}
                </div>
                <span className="text-xs text-slate-600">pays</span>
                <span className="font-bold text-slate-900 text-sm">{s.amount.toFixed(2)} EUR</span>
                <span className="text-xs text-slate-600">to</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: '#10B981' }}>
                  {s.toUser?.firstName?.[0]}
                </div>
                <span className="text-sm font-medium text-slate-700 flex-1">{s.toUser?.firstName}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-emerald-900">Everyone's settled up.</p>
        </div>
      )}
    </div>
  );
}

function CloseLedgerSheet({ settlementCount, totalAmount, onConfirm, onCancel }: {
  settlementCount: number; totalAmount: number;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Close ledger?</h2>
        <p className="text-sm text-slate-600 mb-4 leading-snug">
          This will lock the expenses, send email notifications to all participants with their settlement amounts,
          and credit reimbursements as in-app balance for future trips.
        </p>
        <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Settlements</span>
            <span className="font-semibold text-slate-900">{settlementCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total moved</span>
            <span className="font-semibold text-slate-900">{totalAmount.toFixed(2)} EUR</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-barry-blue text-white text-sm font-semibold">
            Close and notify
          </button>
        </div>
      </div>
    </div>
  );
}

function AddExpenseSheet({ tripId, participants, currentUserId, onClose, onAdd }: {
  tripId: string;
  participants: User[];
  currentUserId: string;
  onClose: () => void;
  onAdd: (input: any) => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [splitWith, setSplitWith] = useState<string[]>(participants.map(p => p.id));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitMode, setSplitMode] = useState<'equal' | 'percent'>('equal');
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  const totalPercent = Object.values(percentages).reduce((s, v) => s + v, 0);

  const toggleSplit = (userId: string) => {
    setSplitWith(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const updatePct = (userId: string, val: number) => {
    setPercentages(prev => ({ ...prev, [userId]: val }));
  };

  const initEqualPct = () => {
    const each = Math.floor(100 / splitWith.length);
    const remainder = 100 - each * splitWith.length;
    const map: Record<string, number> = {};
    splitWith.forEach((id, i) => { map[id] = each + (i === 0 ? remainder : 0); });
    setPercentages(map);
  };

  React.useEffect(() => {
    if (splitMode === 'percent' && Object.keys(percentages).length === 0) initEqualPct();
  }, [splitMode]);

  const canSubmit = description.trim() && parseFloat(amount) > 0 && splitWith.length > 0
    && (splitMode === 'equal' || Math.abs(totalPercent - 100) < 0.5);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900">New expense</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">What for?</label>
            <input
              type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Dinner, taxi, hotel..."
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-200"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount</label>
            <div className="bg-slate-50 rounded-xl px-3.5 py-3 flex items-center gap-2">
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" inputMode="decimal"
                className="flex-1 bg-transparent text-2xl font-display font-extrabold text-slate-900 placeholder:text-slate-300 focus:outline-none"
              />
              <span className="text-lg font-bold text-slate-400">EUR</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map(c => {
                const selected = category === c.value;
                return (
                  <button
                    key={c.value} onClick={() => setCategory(c.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${selected ? 'border-current' : 'border-slate-100'}`}
                    style={selected ? { borderColor: c.color, backgroundColor: `${c.color}10` } : {}}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selected ? c.color : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {c.icon}
                    </svg>
                    <span className="text-[10px] font-medium" style={{ color: selected ? c.color : '#64748B' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Paid by</label>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p, i) => (
                <button
                  key={p.id} onClick={() => setPaidBy(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border-2 transition-all ${
                    paidBy === p.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-600'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px]"
                    style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}>
                    {p.firstName?.[0]}
                  </div>
                  <span className="text-xs font-medium">{p.firstName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Split mode toggle */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Split</label>
            <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setSplitMode('equal')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold ${splitMode === 'equal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Equal
              </button>
              <button
                onClick={() => setSplitMode('percent')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold ${splitMode === 'percent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                By %
              </button>
            </div>
          </div>

          {/* Split with - equal mode */}
          {splitMode === 'equal' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Split with ({splitWith.length})
              </label>
              <div className="space-y-1.5">
                {participants.map((p, i) => {
                  const selected = splitWith.includes(p.id);
                  const share = selected && splitWith.length > 0 ? parseFloat(amount || '0') / splitWith.length : 0;
                  return (
                    <label key={p.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input type="checkbox" checked={selected} onChange={() => toggleSplit(p.id)} className="w-4 h-4 accent-emerald-500" />
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                        style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}>
                        {p.firstName?.[0]}
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-900">{p.firstName}</span>
                      {selected && share > 0 && <span className="text-xs font-semibold text-slate-500">{share.toFixed(2)} EUR</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Split with - percent mode */}
          {splitMode === 'percent' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">By percentage</label>
                <span className={`text-xs font-bold ${Math.abs(totalPercent - 100) < 0.5 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {totalPercent.toFixed(0)}% / 100%
                </span>
              </div>
              <div className="space-y-1.5">
                {participants.map((p, i) => {
                  const pct = percentages[p.id] || 0;
                  const computedAmount = (pct / 100) * parseFloat(amount || '0');
                  return (
                    <div key={p.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                        style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}>
                        {p.firstName?.[0]}
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-900">{p.firstName}</span>
                      <input
                        type="number" value={pct} onChange={e => updatePct(p.id, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="w-14 bg-white text-right rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                      <span className="text-xs text-slate-400">%</span>
                      <span className="text-xs font-medium text-slate-500 w-14 text-right">{computedAmount.toFixed(2)} EUR</span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={initEqualPct}
                className="text-[11px] text-barry-blue font-medium hover:underline mt-2"
              >
                Reset to equal split
              </button>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
          <button
            disabled={!canSubmit}
            onClick={() => {
              const input: any = {
                description, amount: parseFloat(amount), paidBy, category,
                date: new Date(date).toISOString(),
                splitMode: (splitMode === 'percent' ? 'percent' : 'equal') as ExpenseSplitMode,
                participantIds: splitMode === 'percent' ? participants.map(p => p.id) : splitWith,
              };
              if (splitMode === 'percent') {
                input.customShares = participants.map(p => ({ userId: p.id, value: percentages[p.id] || 0 }));
              }
              onAdd(input);
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add expense
          </button>
        </div>
      </div>
    </div>
  );
}
