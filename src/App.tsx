import React, { useState, useEffect, useMemo } from 'react';
import {
  RoomGroup,
  Expense,
  Settlement,
  DailyMessLog,
  SimplifiedDebt,
  Roommate,
  ElectricityMetadata
} from './types';
import {
  loadRoomData,
  saveRoomData,
  calculateBalances,
  simplifyDebts,
  getDefaultRoomGroup,
  formatCurrency,
  CATEGORIES
} from './utils/finance';
import { Header } from './components/Header';
import { RoomSelectorStrip } from './components/RoomSelectorStrip';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { MessManagerView } from './components/MessManagerView';
import { EBCalculatorView } from './components/EBCalculatorView';
import { RoommatesView } from './components/RoommatesView';
import { ExpenseModal } from './components/ExpenseModal';
import { SettlementModal } from './components/SettlementModal';
import { WhatsAppSummaryModal } from './components/WhatsAppSummaryModal';

export default function App() {
  const [roomGroup, setRoomGroup] = useState<RoomGroup>(() => loadRoomData());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'mess' | 'eb' | 'roommates'>('dashboard');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState<SimplifiedDebt | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Sync to localStorage whenever roomGroup updates
  useEffect(() => {
    saveRoomData(roomGroup);
  }, [roomGroup]);

  // Expenses for the currently active month
  const monthlyExpenses = useMemo(() => {
    return roomGroup.expenses.filter((e) => e.monthKey === roomGroup.activeMonth);
  }, [roomGroup.expenses, roomGroup.activeMonth]);

  // Settlements for the currently active month
  const monthlySettlements = useMemo(() => {
    return roomGroup.settlements.filter((s) => s.date.startsWith(roomGroup.activeMonth));
  }, [roomGroup.settlements, roomGroup.activeMonth]);

  // Mess logs for the active month
  const monthlyMessLogs = useMemo(() => {
    return roomGroup.messLogs.filter((m) => m.date.startsWith(roomGroup.activeMonth));
  }, [roomGroup.messLogs, roomGroup.activeMonth]);

  // Roommate balances
  const balances = useMemo(() => {
    return calculateBalances(roomGroup.roommates, monthlyExpenses, monthlySettlements);
  }, [roomGroup.roommates, monthlyExpenses, monthlySettlements]);

  // Debt minimization algorithm
  const simplifiedDebts = useMemo(() => {
    return simplifyDebts(balances, roomGroup.roommates);
  }, [balances, roomGroup.roommates]);

  // Handlers for month switching
  const handleMonthChange = (newMonth: string) => {
    setRoomGroup((prev) => ({
      ...prev,
      activeMonth: newMonth
    }));
  };

  // Expense operations
  const handleSaveExpense = (
    expenseData: Omit<Expense, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    setRoomGroup((prev) => {
      let updatedExpenses: Expense[];
      if (existingId) {
        updatedExpenses = prev.expenses.map((e) =>
          e.id === existingId
            ? { ...expenseData, id: existingId, createdAt: e.createdAt }
            : e
        );
      } else {
        const newExpense: Expense = {
          ...expenseData,
          id: `exp-${Date.now()}`,
          createdAt: Date.now()
        };
        updatedExpenses = [newExpense, ...prev.expenses];
      }
      return {
        ...prev,
        expenses: updatedExpenses
      };
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setRoomGroup((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId)
    }));
  };

  // Settlement operations
  const handleRecordSettlement = (
    settlementData: Omit<Settlement, 'id' | 'settledAt'>
  ) => {
    const newSettlement: Settlement = {
      ...settlementData,
      id: `stl-${Date.now()}`,
      settledAt: Date.now()
    };
    setRoomGroup((prev) => ({
      ...prev,
      settlements: [newSettlement, ...prev.settlements]
    }));
  };

  // Mess Attendance operations
  const handleSaveDailyMessLog = (log: DailyMessLog) => {
    setRoomGroup((prev) => {
      const existingIdx = prev.messLogs.findIndex((l) => l.date === log.date);
      let updatedLogs: DailyMessLog[];
      if (existingIdx !== -1) {
        updatedLogs = prev.messLogs.map((l, i) => (i === existingIdx ? log : l));
      } else {
        updatedLogs = [log, ...prev.messLogs];
      }
      return {
        ...prev,
        messLogs: updatedLogs
      };
    });
    alert(`Mess attendance for ${log.date} saved successfully!`);
  };

  const handleCreateMessExpense = (
    title: string,
    amount: number,
    splits: { roommateId: string; amount: number }[]
  ) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title,
      amount,
      category: 'mess_food',
      paidById: roomGroup.roommates[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      notes: 'Generated from daily meal attendance tracker',
      splitType: 'custom_amount',
      splits,
      monthKey: roomGroup.activeMonth,
      createdAt: Date.now()
    };

    setRoomGroup((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses]
    }));
    setActiveTab('expenses');
    alert('Mess expense generated and logged to ledger!');
  };

  // EB Bill operations
  const handleAddEBExpense = (
    title: string,
    amount: number,
    paidById: string,
    date: string,
    ebData: ElectricityMetadata,
    splits: { roommateId: string; amount: number }[]
  ) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title,
      amount,
      category: 'electricity',
      paidById,
      date,
      notes: `Meter reading: ${ebData.unitsConsumed} units consumed (@ ${formatCurrency(ebData.ratePerUnit, roomGroup.currencySymbol)}/unit)`,
      splitType: 'equal',
      splits,
      monthKey: date.slice(0, 7) || roomGroup.activeMonth,
      electricityData: ebData,
      createdAt: Date.now()
    };

    setRoomGroup((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses]
    }));
    setActiveTab('expenses');
    alert('Electricity bill logged to group ledger!');
  };

  // Roommate management
  const handleUpdateRoommates = (roommates: Roommate[]) => {
    setRoomGroup((prev) => ({
      ...prev,
      roommates
    }));
  };

  const handleUpdateGroupDetails = (
    name: string,
    roomNumber?: string,
    address?: string,
    currency?: string
  ) => {
    setRoomGroup((prev) => ({
      ...prev,
      name,
      roomNumber,
      address,
      currencySymbol: currency || prev.currencySymbol
    }));
  };

  const handleResetToSampleData = () => {
    const sample = getDefaultRoomGroup();
    setRoomGroup(sample);
    saveRoomData(sample);
  };

  const handleImportData = (data: RoomGroup) => {
    setRoomGroup(data);
    saveRoomData(data);
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Date', 'Title', 'Category', 'Amount', 'Paid By', 'Splits Count', 'Notes'];
    const rmMap = new Map(roomGroup.roommates.map((r) => [r.id, r.name]));

    const rows = monthlyExpenses.map((e) => [
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      CATEGORIES[e.category]?.name || e.category,
      e.amount,
      `"${rmMap.get(e.paidById) || 'Unknown'}"`,
      e.splits.length,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BillSplit_${roomGroup.activeMonth}_expenses.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar Contract (Wordmark - 5 Links - Add Expense CTA) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
      />

      {/* Flat & Month Selector Strip */}
      <RoomSelectorStrip
        roomName={roomGroup.name}
        roomNumber={roomGroup.roomNumber}
        activeMonth={roomGroup.activeMonth}
        onMonthChange={handleMonthChange}
        onOpenWhatsAppSummary={() => setIsWhatsAppModalOpen(true)}
        onOpenSettleUp={() => {
          setSelectedDebtForSettle(null);
          setIsSettleModalOpen(true);
        }}
        onExportCsv={handleExportCsv}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            roomName={roomGroup.name}
            currencySymbol={roomGroup.currencySymbol}
            activeMonth={roomGroup.activeMonth}
            roommates={roomGroup.roommates}
            expenses={monthlyExpenses}
            settlements={monthlySettlements}
            balances={balances}
            simplifiedDebts={simplifiedDebts}
            messLogs={monthlyMessLogs}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenSettleModal={(debt) => {
              setSelectedDebtForSettle(debt || null);
              setIsSettleModalOpen(true);
            }}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={roomGroup.expenses}
            roommates={roomGroup.roommates}
            currencySymbol={roomGroup.currencySymbol}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'mess' && (
          <MessManagerView
            roommates={roomGroup.roommates}
            messLogs={monthlyMessLogs}
            currencySymbol={roomGroup.currencySymbol}
            onSaveDailyLog={handleSaveDailyMessLog}
            onCreateMessExpense={handleCreateMessExpense}
          />
        )}

        {activeTab === 'eb' && (
          <EBCalculatorView
            roommates={roomGroup.roommates}
            expenses={roomGroup.expenses}
            currencySymbol={roomGroup.currencySymbol}
            onAddEBExpense={handleAddEBExpense}
          />
        )}

        {activeTab === 'roommates' && (
          <RoommatesView
            roomGroup={roomGroup}
            currencySymbol={roomGroup.currencySymbol}
            onUpdateRoommates={handleUpdateRoommates}
            onUpdateGroupDetails={handleUpdateGroupDetails}
            onResetToSampleData={handleResetToSampleData}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BillSplit · Smart Group Expense & Mess Bill Manager for Roommates</span>
          <span className="font-mono text-slate-400">
            {roomGroup.roommates.length} Roommates · {monthlyExpenses.length} Monthly Bills
          </span>
        </div>
      </footer>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSaveExpense={handleSaveExpense}
        roommates={roomGroup.roommates}
        currencySymbol={roomGroup.currencySymbol}
        activeMonth={roomGroup.activeMonth}
        initialExpense={editingExpense}
      />

      {/* Settle Up / Record Payment Modal */}
      <SettlementModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSelectedDebtForSettle(null);
        }}
        debt={selectedDebtForSettle}
        roommates={roomGroup.roommates}
        currencySymbol={roomGroup.currencySymbol}
        onRecordSettlement={handleRecordSettlement}
      />

      {/* WhatsApp Summary Modal */}
      <WhatsAppSummaryModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        roomName={roomGroup.name}
        activeMonth={roomGroup.activeMonth}
        currencySymbol={roomGroup.currencySymbol}
        expenses={monthlyExpenses}
        balances={balances}
        simplifiedDebts={simplifiedDebts}
        roommates={roomGroup.roommates}
      />
    </div>
  );
}
