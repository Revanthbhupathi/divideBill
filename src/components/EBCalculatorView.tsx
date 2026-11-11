import React, { useState } from 'react';
import {
  Expense,
  Roommate,
  ElectricityMetadata
} from '../types';
import {
  formatCurrency
} from '../utils/finance';
import {
  Zap,
  CheckCircle2,
  TrendingDown,
  Calculator,
  Plus,
  History
} from 'lucide-react';

interface EBCalculatorViewProps {
  roommates: Roommate[];
  expenses: Expense[];
  currencySymbol: string;
  onAddEBExpense: (
    title: string,
    amount: number,
    paidById: string,
    date: string,
    ebData: ElectricityMetadata,
    splits: { roommateId: string; amount: number }[]
  ) => void;
}

export const EBCalculatorView: React.FC<EBCalculatorViewProps> = ({
  roommates,
  expenses,
  currencySymbol,
  onAddEBExpense
}) => {
  // Meter readings state
  const [previousReading, setPreviousReading] = useState<number>(4280);
  const [currentReading, setCurrentReading] = useState<number>(4450);
  const [ratePerUnit, setRatePerUnit] = useState<number>(8.5);
  const [fixedCharge, setFixedCharge] = useState<number>(200);
  const [billTitle, setBillTitle] = useState<string>('Bescom EB Electricity Bill');
  const [paidById, setPaidById] = useState<string>(roommates[0]?.id || '');
  const [billDate, setBillDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedRoommateIds, setSelectedRoommateIds] = useState<string[]>(
    roommates.map((r) => r.id)
  );

  // Calculations
  const unitsConsumed = Math.max(0, currentReading - previousReading);
  const energyCharges = unitsConsumed * ratePerUnit;
  const totalAmount = energyCharges + fixedCharge;
  const perPersonShare =
    selectedRoommateIds.length > 0 ? totalAmount / selectedRoommateIds.length : 0;

  // Previous EB bills
  const previousEbBills = expenses.filter(
    (e) => e.category === 'electricity' && e.electricityData
  );

  const handleToggleRoommate = (id: string) => {
    setSelectedRoommateIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const handleCreateExpense = () => {
    if (totalAmount <= 0 || selectedRoommateIds.length === 0) return;

    const splits = selectedRoommateIds.map((rId) => ({
      roommateId: rId,
      amount: Math.round(perPersonShare * 100) / 100
    }));

    const ebData: ElectricityMetadata = {
      previousReading,
      currentReading,
      unitsConsumed,
      ratePerUnit,
      fixedCharge
    };

    onAddEBExpense(
      billTitle,
      Math.round(totalAmount * 100) / 100,
      paidById,
      billDate,
      ebData,
      splits
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Electricity (EB) Sub-Meter Calculator
            </h2>
            <p className="text-xs text-slate-500">
              Compute units consumed from previous and current meter readings, apply state per-unit slabs, and split equally among active roommates.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Meter Readings & Slabs (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-amber-600" />
            <span>Enter Meter Readings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previous Meter Reading (kWh)
              </label>
              <input
                type="number"
                value={previousReading}
                onChange={(e) => setPreviousReading(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                From last month's bill
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Meter Reading (kWh)
              </label>
              <input
                type="number"
                value={currentReading}
                onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Reading displayed today on meter
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate per Unit / kWh ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.05"
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                State EB board or owner tariff (e.g. ₹8.50)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fixed Meter Charge ({currencySymbol})
              </label>
              <input
                type="number"
                value={fixedCharge}
                onChange={(e) => setFixedCharge(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Minimum charge / common area share
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Who Paid the Electricity Bill?
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {roommates.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bill Payment Date
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Split Roommates selection */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Split Among Roommates:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roommates.map((rm) => {
                const isSelected = selectedRoommateIds.includes(rm.id);
                return (
                  <button
                    key={rm.id}
                    type="button"
                    onClick={() => handleToggleRoommate(rm.id)}
                    className={`p-2 rounded-lg border text-xs text-left transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="truncate">{rm.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCreateExpense}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Electricity Bill to Group Ledger ({formatCurrency(totalAmount, currencySymbol)})</span>
            </button>
          </div>
        </div>

        {/* Right: Real-time Calculation Summary & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-time Summary Card */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Calculation Summary
              </span>
              <span className="text-xs font-mono text-amber-800 font-semibold">
                {unitsConsumed} Units
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>Units Consumed ({currentReading} - {previousReading}):</span>
                <span className="font-mono font-semibold">{unitsConsumed} kWh</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Energy Charges ({unitsConsumed} × {formatCurrency(ratePerUnit, currencySymbol)}):</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(energyCharges, currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Fixed / Meter Charges:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(fixedCharge, currencySymbol)}
                </span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between font-bold text-slate-900 text-sm">
                <span>Total EB Bill:</span>
                <span className="font-mono text-base text-amber-700 tabular-nums">
                  {formatCurrency(totalAmount, currencySymbol)}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-amber-200/50">
                <span>Each Person's Share ({selectedRoommateIds.length} roommates):</span>
                <span className="font-mono font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(perPersonShare, currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Previous EB Bills History */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Previous Electricity Bills</span>
            </h4>

            {previousEbBills.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">
                No electricity bills logged yet. Enter your current meter reading above to create the first one!
              </p>
            ) : (
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                {previousEbBills.map((bill) => (
                  <div key={bill.id} className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {bill.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {bill.date} · {bill.electricityData?.unitsConsumed} units
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(bill.amount, currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
