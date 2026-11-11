import React from 'react';
import {
  Expense,
  Roommate,
  Settlement,
  RoommateBalance,
  SimplifiedDebt,
  DailyMessLog
} from '../types';
import {
  CATEGORIES,
  formatCurrency,
  calculateMessAttendanceStats
} from '../utils/finance';
import {
  ArrowRight,
  TrendingUp,
  CreditCard,
  Utensils,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  QrCode
} from 'lucide-react';

interface DashboardViewProps {
  roomName: string;
  currencySymbol: string;
  activeMonth: string;
  roommates: Roommate[];
  expenses: Expense[];
  settlements: Settlement[];
  balances: RoommateBalance[];
  simplifiedDebts: SimplifiedDebt[];
  messLogs: DailyMessLog[];
  onOpenAddExpense: () => void;
  onOpenSettleModal: (debt?: SimplifiedDebt) => void;
  onNavigateToTab: (tab: 'dashboard' | 'expenses' | 'mess' | 'eb' | 'roommates') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currencySymbol,
  activeMonth,
  roommates,
  expenses,
  balances,
  simplifiedDebts,
  messLogs,
  onOpenAddExpense,
  onOpenSettleModal,
  onNavigateToTab
}) => {
  // Monthly calculations
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const activeRoommatesCount = roommates.filter((r) => r.isActive).length || 1;
  const avgShare = totalSpend / activeRoommatesCount;

  // Food and Mess total
  const foodSpend = expenses
    .filter((e) => ['mess_food', 'cook_maid', 'water_can'].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  // Total pending settlement volume
  const pendingDebtSum = simplifiedDebts.reduce((sum, d) => sum + d.amount, 0);

  // Recent expenses (sorted by date desc)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getRoommate = (id: string) => roommates.find((r) => r.id === id);

  return (
    <div className="space-y-6">
      {/* 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {expenses.length} bills
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(totalSpend, currencySymbol)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active month pooled costs</span>
          </div>
        </div>

        {/* Pending Settlement */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              To Settle
            </span>
            <span className="text-xs text-amber-600 font-medium">
              {simplifiedDebts.length} payments
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-amber-700 tabular-nums">
            {formatCurrency(pendingDebtSum, currencySymbol)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Auto-simplified debt volume
          </div>
        </div>

        {/* Avg per roommate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Per Roommate
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {activeRoommatesCount} people
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(avgShare, currencySymbol)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Per person equal distribution
          </div>
        </div>

        {/* Mess & Kitchen */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mess & Kitchen Total
            </span>
            <Utensils className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-emerald-700 tabular-nums">
            {formatCurrency(foodSpend, currencySymbol)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Groceries + Cook + Water
          </div>
        </div>
      </div>

      {/* Simplified Settlement Engine Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Simplified Settle-Up Plan</span>
              <span className="text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Min-Debt Algorithm
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Criss-cross debts auto-reduced to the minimum number of direct transactions.
            </p>
          </div>
          <button
            onClick={() => onOpenSettleModal()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <CreditCard className="w-4 h-4 text-slate-600" />
            <span>Record Any Settlement</span>
          </button>
        </div>

        {simplifiedDebts.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              All Roommates Are Settled Up!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              There are no pending debts in this room. Everyone has contributed their fair share.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simplifiedDebts.map((debt, idx) => (
              <div
                key={`${debt.fromId}-${debt.toId}-${idx}`}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">Payment #{idx + 1}</span>
                    {debt.toUpiId && (
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                        UPI: {debt.toUpiId}
                      </span>
                    )}
                  </div>

                  {/* Transfer Graphic */}
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 truncate">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {debt.fromName}
                      </div>
                      <div className="text-[11px] text-red-600 font-medium">Owes</div>
                    </div>

                    <div className="flex flex-col items-center px-1">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex-1 truncate text-right">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {debt.toName}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium">Receives</div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-xl font-bold font-mono text-slate-900 tabular-nums my-1">
                    {formatCurrency(debt.amount, currencySymbol)}
                  </div>
                </div>

                {/* Settle Action */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-2">
                  <button
                    onClick={() => onOpenSettleModal(debt)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Pay via UPI / Settle</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column: Roommate Balances Table & Recent Expenses Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Roommate Balances Ledger (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Roommate Balance Sheet
              </h3>
              <p className="text-xs text-slate-500">
                Calculated across all logged expenses and settlements for {activeMonth}
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('roommates')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Manage Room
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-2">Roommate</th>
                  <th className="py-2.5 px-2 text-right">Paid Out</th>
                  <th className="py-2.5 px-2 text-right">Share</th>
                  <th className="py-2.5 px-2 text-right">Net Balance</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {balances.map((bal) => {
                  const rm = getRoommate(bal.roommateId);
                  const isCreditor = bal.netBalance > 0.01;
                  const isDebtor = bal.netBalance < -0.01;

                  return (
                    <tr key={bal.roommateId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              backgroundColor: rm?.avatarBg || '#EFF6FF',
                              color: rm?.avatarColor || '#2563EB'
                            }}
                          >
                            {bal.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 block truncate">
                              {bal.name}
                            </span>
                            {rm?.upiId && (
                              <span className="text-[11px] text-slate-400 font-mono block truncate">
                                {rm.upiId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(bal.paid + bal.settledPaid, currencySymbol)}
                      </td>

                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(bal.share + bal.settledReceived, currencySymbol)}
                      </td>

                      <td className="py-3 px-2 text-right font-mono tabular-nums font-semibold">
                        {isCreditor && (
                          <span className="text-emerald-700">
                            +{formatCurrency(bal.netBalance, currencySymbol)}
                          </span>
                        )}
                        {isDebtor && (
                          <span className="text-red-600">
                            -{formatCurrency(Math.abs(bal.netBalance), currencySymbol)}
                          </span>
                        )}
                        {!isCreditor && !isDebtor && (
                          <span className="text-slate-400 font-normal">₹0.00</span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center">
                        {isCreditor && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Gets back
                          </span>
                        )}
                        {isDebtor && (
                          <span className="text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded">
                            Owes
                          </span>
                        )}
                        {!isCreditor && !isDebtor && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Expenses Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Recent Expenses
                </h3>
                <p className="text-xs text-slate-500">Latest bills logged in this flat</p>
              </div>
              <button
                onClick={() => onNavigateToTab('expenses')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No expenses logged yet this month. Click "+ Add Expense" to start!
                </div>
              ) : (
                recentExpenses.map((exp) => {
                  const cat = CATEGORIES[exp.category];
                  const payer = getRoommate(exp.paidById);

                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: cat?.bgLight || '#F3F4F6',
                            color: cat?.color || '#4B5563'
                          }}
                        >
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-900 truncate block">
                            {exp.title}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            Paid by <strong className="font-medium text-slate-700">{payer?.name || 'Someone'}</strong> · {exp.date}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-900 tabular-nums block">
                          {formatCurrency(exp.amount, currencySymbol)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {exp.splits.length} shared
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onOpenAddExpense}
              className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Shared Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
