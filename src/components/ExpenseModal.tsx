import React, { useState, useEffect } from 'react';
import {
  Expense,
  ExpenseCategory,
  SplitType,
  ExpenseSplit,
  Roommate
} from '../types';
import {
  CATEGORIES,
  formatCurrency
} from '../utils/finance';
import {
  X,
  Upload,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>, existingId?: string) => void;
  roommates: Roommate[];
  currencySymbol: string;
  activeMonth: string;
  initialExpense?: Expense | null;
}

const QUICK_SUGGESTIONS = [
  { title: 'Room Rent', category: 'rent' as ExpenseCategory },
  { title: 'Vegetables & Kirana', category: 'mess_food' as ExpenseCategory },
  { title: 'Bescom EB Bill', category: 'electricity' as ExpenseCategory },
  { title: 'Cook Auntie Salary', category: 'cook_maid' as ExpenseCategory },
  { title: 'Wi-Fi Recharge', category: 'wifi' as ExpenseCategory },
  { title: '20L Water Cans', category: 'water_can' as ExpenseCategory },
  { title: 'Gas Cylinder Refill', category: 'lpg_gas' as ExpenseCategory },
  { title: 'Swiggy Dinner', category: 'snacks_dining' as ExpenseCategory }
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  roommates,
  currencySymbol,
  activeMonth,
  initialExpense
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('mess_food');
  const [paidById, setPaidById] = useState<string>(roommates[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [billPhotoUrl, setBillPhotoUrl] = useState<string | undefined>(undefined);
  const [splitType, setSplitType] = useState<SplitType>('equal');

  // Selected participant roommates (defaults to all active)
  const [selectedRoommates, setSelectedRoommates] = useState<string[]>(
    roommates.filter((r) => r.isActive).map((r) => r.id)
  );

  // Custom amounts or percentages or shares per roommate
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});
  const [customShares, setCustomShares] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialExpense) {
      setTitle(initialExpense.title);
      setAmount(String(initialExpense.amount));
      setCategory(initialExpense.category);
      setPaidById(initialExpense.paidById);
      setDate(initialExpense.date);
      setNotes(initialExpense.notes || '');
      setBillPhotoUrl(initialExpense.billPhotoUrl);
      setSplitType(initialExpense.splitType);

      const participantIds = initialExpense.splits.map((s) => s.roommateId);
      setSelectedRoommates(participantIds);

      const amtMap: Record<string, number> = {};
      const pctMap: Record<string, number> = {};
      const shMap: Record<string, number> = {};

      initialExpense.splits.forEach((s) => {
        amtMap[s.roommateId] = s.amount;
        if (s.percentage !== undefined) pctMap[s.roommateId] = s.percentage;
        if (s.shares !== undefined) shMap[s.roommateId] = s.shares;
      });

      setCustomAmounts(amtMap);
      setCustomPercentages(pctMap);
      setCustomShares(shMap);
    } else {
      // Reset defaults
      setTitle('');
      setAmount('');
      setCategory('mess_food');
      setPaidById(roommates[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setBillPhotoUrl(undefined);
      setSplitType('equal');
      setSelectedRoommates(roommates.filter((r) => r.isActive).map((r) => r.id));
      setCustomAmounts({});
      setCustomPercentages({});
      setCustomShares({});
    }
  }, [initialExpense, isOpen, roommates]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  // Toggle roommate inclusion in split
  const handleToggleRoommate = (rId: string) => {
    setSelectedRoommates((prev) => {
      if (prev.includes(rId)) {
        if (prev.length <= 1) return prev; // At least one person must split
        return prev.filter((id) => id !== rId);
      } else {
        return [...prev, rId];
      }
    });
  };

  // Image upload handler (converts file to data URL for persistent offline display)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setBillPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute splits based on selected type
  const calculateFinalSplits = (): { splits: ExpenseSplit[]; isValid: boolean; errorMsg?: string } => {
    if (numAmount <= 0) {
      return { splits: [], isValid: false, errorMsg: 'Please enter a valid bill amount.' };
    }
    if (selectedRoommates.length === 0) {
      return { splits: [], isValid: false, errorMsg: 'Select at least one roommate to split with.' };
    }

    if (splitType === 'equal') {
      const share = numAmount / selectedRoommates.length;
      const splits: ExpenseSplit[] = selectedRoommates.map((rId) => ({
        roommateId: rId,
        amount: Math.round(share * 100) / 100
      }));
      return { splits, isValid: true };
    }

    if (splitType === 'custom_amount') {
      let sum = 0;
      const splits: ExpenseSplit[] = selectedRoommates.map((rId) => {
        const val = customAmounts[rId] || 0;
        sum += val;
        return {
          roommateId: rId,
          amount: Math.round(val * 100) / 100
        };
      });

      const diff = Math.abs(sum - numAmount);
      if (diff > 0.5) {
        return {
          splits,
          isValid: false,
          errorMsg: `Sum of shares (${formatCurrency(sum, currencySymbol)}) does not match bill total (${formatCurrency(numAmount, currencySymbol)}).`
        };
      }
      return { splits, isValid: true };
    }

    if (splitType === 'percentage') {
      let totalPct = 0;
      selectedRoommates.forEach((rId) => {
        totalPct += customPercentages[rId] || 0;
      });

      if (Math.abs(totalPct - 100) > 0.5) {
        return {
          splits: [],
          isValid: false,
          errorMsg: `Total percentage must equal 100% (currently ${totalPct.toFixed(1)}%).`
        };
      }

      const splits: ExpenseSplit[] = selectedRoommates.map((rId) => {
        const pct = customPercentages[rId] || 0;
        const val = (pct / 100) * numAmount;
        return {
          roommateId: rId,
          amount: Math.round(val * 100) / 100,
          percentage: pct
        };
      });
      return { splits, isValid: true };
    }

    if (splitType === 'shares') {
      let totalShares = 0;
      selectedRoommates.forEach((rId) => {
        totalShares += customShares[rId] || 1;
      });

      if (totalShares <= 0) {
        return { splits: [], isValid: false, errorMsg: 'Total shares must be greater than zero.' };
      }

      const splits: ExpenseSplit[] = selectedRoommates.map((rId) => {
        const sh = customShares[rId] || 1;
        const val = (sh / totalShares) * numAmount;
        return {
          roommateId: rId,
          amount: Math.round(val * 100) / 100,
          shares: sh
        };
      });
      return { splits, isValid: true };
    }

    return { splits: [], isValid: false };
  };

  const { splits, isValid, errorMsg } = calculateFinalSplits();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a bill title.');
      return;
    }
    if (!isValid) {
      alert(errorMsg || 'Please verify the split numbers.');
      return;
    }

    onSaveExpense(
      {
        title: title.trim(),
        amount: numAmount,
        category,
        paidById,
        date,
        notes: notes.trim(),
        billPhotoUrl,
        splitType,
        splits,
        monthKey: date.slice(0, 7) || activeMonth
      },
      initialExpense?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialExpense ? 'Edit Shared Expense' : 'Log New Shared Bill'}
            </h3>
            <span className="text-xs text-slate-500">
              Track room rent, groceries, electricity, cook wages & more
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        {!initialExpense && (
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTitle(sug.title);
                    setCategory(sug.category);
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md transition-colors"
                >
                  {sug.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bill Description / Title *
              </label>
              <input
                type="text"
                placeholder="e.g. D-Mart Groceries, Flat Rent, Bescom EB"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount ({currencySymbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full text-xs font-mono font-bold pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Category & Paid By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.values(CATEGORIES).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paid by Roommate
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {roommates.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} {rm.upiId ? `(${rm.upiId})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Bill Receipt Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Bill
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Bill Receipt (Optional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors border border-dashed border-slate-300">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{billPhotoUrl ? 'Replace Photo' : 'Upload Receipt Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {billPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setBillPhotoUrl(undefined)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Photo Preview Thumbnail */}
          {billPhotoUrl && (
            <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 max-h-32 flex items-center justify-center overflow-hidden">
              <img
                src={billPhotoUrl}
                alt="Receipt Preview"
                className="max-h-28 object-contain rounded"
              />
            </div>
          )}

          {/* Split Mode Segmented Control */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Split Distribution Method
              </label>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    splitType === 'equal'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('custom_amount')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    splitType === 'custom_amount'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Custom Exact ₹
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('percentage')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    splitType === 'percentage'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('shares')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    splitType === 'shares'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Shares / Ratios
                </button>
              </div>
            </div>

            {/* Roommates Included Checklist & Custom Split Values */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
              <span className="text-[11px] text-slate-500 block">
                Select who is splitting this bill and verify shares:
              </span>

              <div className="space-y-2">
                {roommates.map((rm) => {
                  const isIncluded = selectedRoommates.includes(rm.id);

                  // Calculate display share
                  let calculatedShare = 0;
                  if (isIncluded) {
                    if (splitType === 'equal') {
                      calculatedShare =
                        selectedRoommates.length > 0 ? numAmount / selectedRoommates.length : 0;
                    } else if (splitType === 'custom_amount') {
                      calculatedShare = customAmounts[rm.id] || 0;
                    } else if (splitType === 'percentage') {
                      const pct = customPercentages[rm.id] || 0;
                      calculatedShare = (pct / 100) * numAmount;
                    } else if (splitType === 'shares') {
                      const sh = customShares[rm.id] || 1;
                      const totalSh = selectedRoommates.reduce(
                        (sum, id) => sum + (customShares[id] || 1),
                        0
                      );
                      calculatedShare = totalSh > 0 ? (sh / totalSh) * numAmount : 0;
                    }
                  }

                  return (
                    <div
                      key={rm.id}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        isIncluded
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-slate-100/60 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          onChange={() => handleToggleRoommate(rm.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]"
                          style={{
                            backgroundColor: rm.avatarBg,
                            color: rm.avatarColor
                          }}
                        >
                          {rm.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-slate-800">
                          {rm.name}
                        </span>
                      </label>

                      {isIncluded && (
                        <div className="flex items-center gap-2">
                          {/* Inputs for custom mode */}
                          {splitType === 'custom_amount' && (
                            <input
                              type="number"
                              step="0.01"
                              value={customAmounts[rm.id] || ''}
                              placeholder="0.00"
                              onChange={(e) =>
                                setCustomAmounts({
                                  ...customAmounts,
                                  [rm.id]: parseFloat(e.target.value) || 0
                                })
                              }
                              className="w-20 text-xs font-mono px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          )}

                          {splitType === 'percentage' && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={customPercentages[rm.id] || ''}
                                placeholder="%"
                                onChange={(e) =>
                                  setCustomPercentages({
                                    ...customPercentages,
                                    [rm.id]: parseFloat(e.target.value) || 0
                                  })
                                }
                                className="w-14 text-xs font-mono px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-slate-500">%</span>
                            </div>
                          )}

                          {splitType === 'shares' && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={customShares[rm.id] || 1}
                                onChange={(e) =>
                                  setCustomShares({
                                    ...customShares,
                                    [rm.id]: parseInt(e.target.value, 10) || 1
                                  })
                                }
                                className="w-12 text-xs font-mono px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-slate-500">parts</span>
                            </div>
                          )}

                          {/* Computed value */}
                          <span className="font-mono text-xs font-bold text-slate-900 min-w-[70px] text-right tabular-nums">
                            {formatCurrency(calculatedShare, currencySymbol)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Validation Warning if mismatch */}
              {!isValid && errorMsg && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy order id, who ordered what, landlord payment receipt"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || numAmount <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
            >
              {initialExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
