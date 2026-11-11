import React, { useState, useMemo } from 'react';
import {
  Expense,
  ExpenseCategory,
  Roommate
} from '../types';
import {
  CATEGORIES,
  formatCurrency
} from '../utils/finance';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Image as ImageIcon,
  Users,
  Eye,
  X,
  Zap
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  roommates: Roommate[];
  currencySymbol: string;
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  roommates,
  currencySymbol,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayer, setSelectedPayer] = useState<string>('all');
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<Expense | null>(null);

  const rmMap = useMemo(() => new Map(roommates.map((r) => [r.id, r])), [roommates]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }
      // Payer filter
      if (selectedPayer !== 'all' && e.paidById !== selectedPayer) {
        return false;
      }
      // Search query (title, notes, payer name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const payerName = rmMap.get(e.paidById)?.name.toLowerCase() || '';
        const titleMatch = e.title.toLowerCase().includes(q);
        const notesMatch = (e.notes || '').toLowerCase().includes(q);
        const payerMatch = payerName.includes(q);
        if (!titleMatch && !notesMatch && !payerMatch) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedCategory, selectedPayer, searchQuery, rmMap]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Expenses Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and manage every bill logged for room rent, utilities, food, and supplies.
            </p>
          </div>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search expenses, notes, payers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-700"
            >
              <option value="all">All Categories ({expenses.length})</option>
              {Object.values(CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Paid By Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedPayer}
              onChange={(e) => setSelectedPayer(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-700"
            >
              <option value="all">Paid by: Anyone</option>
              {roommates.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredExpenses.length}</strong> of {expenses.length} bills
          </span>
          <span className="font-mono font-medium text-slate-900">
            Total Filtered: <strong className="text-emerald-700">{formatCurrency(totalFilteredAmount, currencySymbol)}</strong>
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              No matching expenses found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query or category filters, or log a new shared expense for your flat.
            </p>
            <button
              onClick={onOpenAddExpense}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Expense</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title & Category</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Split Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.map((expense) => {
                  const cat = CATEGORIES[expense.category];
                  const payer = rmMap.get(expense.paidById);
                  const isEb = expense.category === 'electricity' && expense.electricityData;

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedExpenseForDetails(expense)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {expense.date}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: cat?.bgLight || '#F3F4F6',
                              color: cat?.color || '#4B5563'
                            }}
                          >
                            {isEb ? <Zap className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {expense.title}
                              </span>
                              {expense.billPhotoUrl && (
                                <span title="Receipt photo attached" className="text-slate-400">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span>{cat?.name || expense.category}</span>
                              {isEb && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-700 font-medium">
                                    {expense.electricityData?.unitsConsumed} units
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
                            style={{
                              backgroundColor: payer?.avatarBg || '#EFF6FF',
                              color: payer?.avatarColor || '#2563EB'
                            }}
                          >
                            {payer?.name ? payer.name.charAt(0) : '?'}
                          </div>
                          <span className="font-medium text-slate-800">
                            {payer?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {expense.splits.length === roommates.length
                              ? 'All Roommates'
                              : `${expense.splits.length} of ${roommates.length} people`}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(expense.amount, currencySymbol)}
                        </span>
                      </td>

                      <td
                        className="py-3 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedExpenseForDetails(expense)}
                            title="View details"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditExpense(expense)}
                            title="Edit expense"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${expense.title}"?`)) {
                                onDeleteExpense(expense.id);
                              }
                            }}
                            title="Delete expense"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Detail Modal */}
      {selectedExpenseForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedExpenseForDetails.title}
                </h3>
                <span className="text-xs text-slate-500">
                  {CATEGORIES[selectedExpenseForDetails.category]?.name} · {selectedExpenseForDetails.date}
                </span>
              </div>
              <button
                onClick={() => setSelectedExpenseForDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total and Payer */}
            <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Total Bill Amount</span>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {formatCurrency(selectedExpenseForDetails.amount, currencySymbol)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Paid Out by</span>
                <span className="text-sm font-semibold text-slate-900">
                  {rmMap.get(selectedExpenseForDetails.paidById)?.name || 'Unknown'}
                </span>
              </div>
            </div>

            {/* EB Meter Breakdown if applicable */}
            {selectedExpenseForDetails.electricityData && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3.5 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>EB Sub-Meter Calculation</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div>Previous: {selectedExpenseForDetails.electricityData.previousReading} kWh</div>
                  <div>Current: {selectedExpenseForDetails.electricityData.currentReading} kWh</div>
                  <div>Units: {selectedExpenseForDetails.electricityData.unitsConsumed} kWh</div>
                  <div>Rate: {formatCurrency(selectedExpenseForDetails.electricityData.ratePerUnit, currencySymbol)} / unit</div>
                </div>
              </div>
            )}

            {/* Notes if any */}
            {selectedExpenseForDetails.notes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong className="text-slate-700 block mb-0.5">Notes:</strong>
                {selectedExpenseForDetails.notes}
              </div>
            )}

            {/* Attached receipt photo if present */}
            {selectedExpenseForDetails.billPhotoUrl && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">
                  Bill Receipt Photo:
                </span>
                <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 flex items-center justify-center bg-slate-100">
                  <img
                    src={selectedExpenseForDetails.billPhotoUrl}
                    alt="Receipt"
                    className="max-h-64 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Itemized Splits Table */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Roommate Split Breakdown:
              </span>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {selectedExpenseForDetails.splits.map((split) => {
                  const rm = rmMap.get(split.roommateId);
                  return (
                    <div
                      key={split.roommateId}
                      className="flex items-center justify-between p-2.5 text-xs bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]"
                          style={{
                            backgroundColor: rm?.avatarBg || '#EFF6FF',
                            color: rm?.avatarColor || '#2563EB'
                          }}
                        >
                          {rm?.name.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-slate-800">
                          {rm?.name || 'Roommate'}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(split.amount, currencySymbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  const exp = selectedExpenseForDetails;
                  setSelectedExpenseForDetails(null);
                  onEditExpense(exp);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedExpenseForDetails(null)}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
