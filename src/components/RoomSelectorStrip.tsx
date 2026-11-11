import React from 'react';
import { Share2, ChevronLeft, ChevronRight, Home, CreditCard, Download } from 'lucide-react';

interface RoomSelectorStripProps {
  roomName: string;
  roomNumber?: string;
  activeMonth: string; // YYYY-MM
  onMonthChange: (newMonth: string) => void;
  onOpenWhatsAppSummary: () => void;
  onOpenSettleUp: () => void;
  onExportCsv: () => void;
}

export const RoomSelectorStrip: React.FC<RoomSelectorStripProps> = ({
  roomName,
  roomNumber,
  activeMonth,
  onMonthChange,
  onOpenWhatsAppSummary,
  onOpenSettleUp,
  onExportCsv
}) => {
  // Format month for display (e.g. 2026-11 -> November 2026)
  const formatMonthTitle = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = activeMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  return (
    <div className="bg-slate-100/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Room info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{roomName}</span>
                {roomNumber && (
                  <span className="text-xs text-slate-500 font-medium">· {roomNumber}</span>
                )}
              </div>
              <p className="text-xs text-slate-500">Shared Hostel & PG Expense Ledger</p>
            </div>
          </div>

          {/* Month Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Navigator */}
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                title="Previous month"
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-slate-800 whitespace-nowrap min-w-[120px] text-center">
                {formatMonthTitle(activeMonth)}
              </span>
              <button
                onClick={handleNextMonth}
                title="Next month"
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Settle Up Action */}
            <button
              onClick={onOpenSettleUp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Settle Up</span>
            </button>

            {/* WhatsApp Summary */}
            <button
              onClick={onOpenWhatsAppSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Summary</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={onExportCsv}
              title="Export Month CSV"
              className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
