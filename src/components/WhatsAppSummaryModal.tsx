import React, { useState, useEffect } from 'react';
import {
  Expense,
  RoommateBalance,
  SimplifiedDebt,
  Roommate
} from '../types';
import {
  generateWhatsAppSummary
} from '../utils/finance';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  activeMonth: string;
  currencySymbol: string;
  expenses: Expense[];
  balances: RoommateBalance[];
  simplifiedDebts: SimplifiedDebt[];
  roommates: Roommate[];
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({
  isOpen,
  onClose,
  roomName,
  activeMonth,
  currencySymbol,
  expenses,
  balances,
  simplifiedDebts,
  roommates
}) => {
  const [summaryText, setSummaryText] = useState('');
  const [copied, setCopied] = useState(false);

  // Month title
  const formatMonthTitle = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    if (isOpen) {
      const generated = generateWhatsAppSummary(
        roomName,
        formatMonthTitle(activeMonth),
        currencySymbol,
        expenses,
        balances,
        simplifiedDebts,
        roommates
      );
      setSummaryText(generated);
      setCopied(false);
    }
  }, [isOpen, roomName, activeMonth, currencySymbol, expenses, balances, simplifiedDebts, roommates]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                WhatsApp Group Summary
              </h3>
              <p className="text-xs text-slate-500">
                1-click shareable monthly statement formatted for your flat WhatsApp group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area Live Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Message Content Preview (Editable):</span>
            <span className="font-mono text-[11px]">{summaryText.length} characters</span>
          </div>

          <textarea
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            rows={14}
            className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 leading-relaxed resize-y"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Copy or send directly to your flat's WhatsApp chat
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
