import React, { useState } from 'react';
import {
  Roommate,
  DailyMessLog,
  MealAttendance
} from '../types';
import {
  formatCurrency,
  calculateMessAttendanceStats
} from '../utils/finance';
import {
  Utensils,
  Calendar,
  Check,
  CheckCircle2,
  PieChart,
  PlusCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface MessManagerViewProps {
  roommates: Roommate[];
  messLogs: DailyMessLog[];
  currencySymbol: string;
  onSaveDailyLog: (log: DailyMessLog) => void;
  onCreateMessExpense: (
    title: string,
    amount: number,
    splits: { roommateId: string; amount: number }[]
  ) => void;
}

export const MessManagerView: React.FC<MessManagerViewProps> = ({
  roommates,
  messLogs,
  currencySymbol,
  onSaveDailyLog,
  onCreateMessExpense
}) => {
  // Current selected date for logging attendance (default to today YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dailyNote, setDailyNote] = useState<string>('');

  // Find existing log for selected date or initialize default
  const existingLog = messLogs.find((l) => l.date === selectedDate);

  const [currentAttendance, setCurrentAttendance] = useState<MealAttendance[]>(() => {
    if (existingLog) {
      return existingLog.attendance;
    }
    return roommates.map((rm) => ({
      roommateId: rm.id,
      breakfast: true,
      lunch: true,
      dinner: true
    }));
  });

  // When date changes, load attendance
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const found = messLogs.find((l) => l.date === newDate);
    if (found) {
      setCurrentAttendance(found.attendance);
      setDailyNote(found.notes || '');
    } else {
      // Default all present
      setCurrentAttendance(
        roommates.map((rm) => ({
          roommateId: rm.id,
          breakfast: true,
          lunch: true,
          dinner: true
        }))
      );
      setDailyNote('');
    }
  };

  const handleToggleMeal = (
    roommateId: string,
    meal: 'breakfast' | 'lunch' | 'dinner'
  ) => {
    setCurrentAttendance((prev) =>
      prev.map((item) => {
        if (item.roommateId === roommateId) {
          return { ...item, [meal]: !item[meal] };
        }
        return item;
      })
    );
  };

  const handleMarkAll = (status: boolean) => {
    setCurrentAttendance((prev) =>
      prev.map((item) => ({
        ...item,
        breakfast: status,
        lunch: status,
        dinner: status
      }))
    );
  };

  const handleSaveAttendance = () => {
    onSaveDailyLog({
      date: selectedDate,
      attendance: currentAttendance,
      notes: dailyNote
    });
  };

  // Monthly stats
  const { stats, grandTotalMeals } = calculateMessAttendanceStats(messLogs, roommates);

  // Auto Split Calculator State
  const [messBillTitle, setMessBillTitle] = useState('Monthly Mess Groceries & Ration');
  const [messBillAmount, setMessBillAmount] = useState<number>(4500);
  const [showAutoSplitModal, setShowAutoSplitModal] = useState(false);

  const handleGenerateMessBill = () => {
    if (grandTotalMeals <= 0 || messBillAmount <= 0) return;

    // Calculate split for each roommate proportional to percentage of meals
    const splits = roommates.map((rm) => {
      const rmStat = stats[rm.id];
      const share = grandTotalMeals > 0 ? (rmStat.totalMeals / grandTotalMeals) * messBillAmount : 0;
      return {
        roommateId: rm.id,
        amount: Math.round(share * 100) / 100
      };
    });

    onCreateMessExpense(messBillTitle, messBillAmount, splits);
    setShowAutoSplitModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Daily Mess & Meal Attendance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Track who ate breakfast, lunch, and dinner. Eliminates hostel fights over who was out of station or skipped meals.
            </p>
          </div>

          <button
            onClick={() => setShowAutoSplitModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Split Mess Bill by Meals</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Daily Attendance Logger (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Log Meal Attendance
              </h3>
              <span className="text-xs text-slate-500">
                Record who ate with the flat today
              </span>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Mark All Buttons */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Roommate Attendance:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMarkAll(true)}
                className="text-[11px] text-emerald-700 hover:underline font-medium"
              >
                All Ate Today
              </button>
              <span>·</span>
              <button
                onClick={() => handleMarkAll(false)}
                className="text-[11px] text-slate-500 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Attendance Matrix */}
          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {roommates.map((rm) => {
              const att = currentAttendance.find((a) => a.roommateId === rm.id) || {
                roommateId: rm.id,
                breakfast: false,
                lunch: false,
                dinner: false
              };

              const dayMealCount =
                (att.breakfast ? 0.5 : 0) + (att.lunch ? 1 : 0) + (att.dinner ? 1 : 0);

              return (
                <div
                  key={rm.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-[140px]">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: rm.avatarBg,
                        color: rm.avatarColor
                      }}
                    >
                      {rm.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {rm.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {dayMealCount} meals today
                      </span>
                    </div>
                  </div>

                  {/* Meal checkboxes */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Breakfast */}
                    <button
                      type="button"
                      onClick={() => handleToggleMeal(rm.id, 'breakfast')}
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1 transition-colors ${
                        att.breakfast
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {att.breakfast && <Check className="w-3 h-3 text-emerald-600" />}
                      <span>Breakfast (0.5)</span>
                    </button>

                    {/* Lunch */}
                    <button
                      type="button"
                      onClick={() => handleToggleMeal(rm.id, 'lunch')}
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1 transition-colors ${
                        att.lunch
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {att.lunch && <Check className="w-3 h-3 text-emerald-600" />}
                      <span>Lunch (1.0)</span>
                    </button>

                    {/* Dinner */}
                    <button
                      type="button"
                      onClick={() => handleToggleMeal(rm.id, 'dinner')}
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium flex items-center gap-1 transition-colors ${
                        att.dinner
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {att.dinner && <Check className="w-3 h-3 text-emerald-600" />}
                      <span>Dinner (1.0)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Daily Menu / Meal Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sunday special chicken biryani, extra milk bought"
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveAttendance}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Attendance for {selectedDate}</span>
            </button>
          </div>
        </div>

        {/* Right: Monthly Attendance & Ratio Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Monthly Mess Participation
            </h3>
            <span className="text-xs text-slate-500">
              Total weighted meals eaten across {messLogs.length} logged days
            </span>
          </div>

          <div className="space-y-4">
            {roommates.map((rm) => {
              const s = stats[rm.id];
              return (
                <div key={rm.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{rm.name}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {s.totalMeals} meals ({s.percentage.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${s.percentage}%`,
                        backgroundColor: rm.avatarColor
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>BF: {s.breakfast}</span>
                    <span>·</span>
                    <span>Lunch: {s.lunch}</span>
                    <span>·</span>
                    <span>Dinner: {s.dinner}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Grand Total Meals:</span>
              <span className="font-mono text-emerald-700">{grandTotalMeals} meals</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When someone goes home on vacation, their meal count drops automatically so they only pay for what they ate!
            </p>
          </div>
        </div>
      </div>

      {/* Auto Split Mess Bill Modal */}
      {showAutoSplitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Auto-Split Mess Bill by Meals</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates each roommate's exact share proportional to their meal attendance.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bill Title
                </label>
                <input
                  type="text"
                  value={messBillTitle}
                  onChange={(e) => setMessBillTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Mess Amount to Split ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={messBillAmount}
                  onChange={(e) => setMessBillAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Calculated Preview */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Fair Proportional Split Preview:
                </span>
                <div className="space-y-1.5 text-xs divide-y divide-slate-100">
                  {roommates.map((rm) => {
                    const s = stats[rm.id];
                    const share =
                      grandTotalMeals > 0
                        ? (s.totalMeals / grandTotalMeals) * messBillAmount
                        : 0;
                    return (
                      <div
                        key={rm.id}
                        className="flex items-center justify-between pt-1.5"
                      >
                        <span className="text-slate-800">
                          {rm.name} ({s.percentage.toFixed(1)}%)
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(share, currencySymbol)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAutoSplitModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateMessBill}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
              >
                Create Mess Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
