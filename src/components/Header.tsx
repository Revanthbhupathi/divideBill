import React from 'react';
import { Plus, Receipt } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'expenses' | 'mess' | 'eb' | 'roommates';
  onSelectTab: (tab: 'dashboard' | 'expenses' | 'mess' | 'eb' | 'roommates') => void;
  onOpenAddExpense: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddExpense
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark with icon */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              BillSplit
            </span>
          </button>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('expenses')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'expenses'
                  ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Expenses
            </button>
            <button
              onClick={() => onSelectTab('mess')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'mess'
                  ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mess & Meals
            </button>
            <button
              onClick={() => onSelectTab('eb')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'eb'
                  ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EB Electricity
            </button>
            <button
              onClick={() => onSelectTab('roommates')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'roommates'
                  ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roommates & Flat
            </button>
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav scrollbar */}
      <div className="md:hidden flex items-center gap-4 px-4 py-2 border-t border-slate-100 overflow-x-auto text-xs font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`whitespace-nowrap px-2 py-1 rounded ${
            activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('expenses')}
          className={`whitespace-nowrap px-2 py-1 rounded ${
            activeTab === 'expenses' ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => onSelectTab('mess')}
          className={`whitespace-nowrap px-2 py-1 rounded ${
            activeTab === 'mess' ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
          }`}
        >
          Mess & Meals
        </button>
        <button
          onClick={() => onSelectTab('eb')}
          className={`whitespace-nowrap px-2 py-1 rounded ${
            activeTab === 'eb' ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
          }`}
        >
          EB Bill
        </button>
        <button
          onClick={() => onSelectTab('roommates')}
          className={`whitespace-nowrap px-2 py-1 rounded ${
            activeTab === 'roommates' ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
          }`}
        >
          Roommates
        </button>
      </div>
    </header>
  );
};
