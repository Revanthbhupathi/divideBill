import React, { useState, useEffect } from 'react';
import {
  SimplifiedDebt,
  Roommate,
  Settlement
} from '../types';
import {
  formatCurrency,
  generateUpiUrl
} from '../utils/finance';
import {
  generateUpiQrSvg
} from '../utils/qrCode';
import {
  X,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: SimplifiedDebt | null;
  roommates: Roommate[];
  currencySymbol: string;
  onRecordSettlement: (settlement: Omit<Settlement, 'id' | 'settledAt'>) => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  debt,
  roommates,
  currencySymbol,
  onRecordSettlement
}) => {
  const [fromRoommateId, setFromRoommateId] = useState<string>('');
  const [toRoommateId, setToRoommateId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'bank_transfer' | 'other'>('upi');
  const [referenceNote, setReferenceNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  useEffect(() => {
    if (debt) {
      setFromRoommateId(debt.fromId);
      setToRoommateId(debt.toId);
      setAmount(String(debt.amount));
      setReferenceNote(`Settlement: ${debt.fromName} to ${debt.toName}`);
    } else {
      // Default to first two roommates
      setFromRoommateId(roommates[1]?.id || roommates[0]?.id || '');
      setToRoommateId(roommates[0]?.id || '');
      setAmount('500');
      setReferenceNote('Bill settlement');
    }
    setDate(new Date().toISOString().split('T')[0]);
    setCopiedUpi(false);
  }, [debt, isOpen, roommates]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const fromRm = roommates.find((r) => r.id === fromRoommateId);
  const toRm = roommates.find((r) => r.id === toRoommateId);

  // Generate UPI URL if payee has UPI
  const upiId = toRm?.upiId;
  const upiDeepLink = upiId ? generateUpiUrl(upiId, toRm.name, numAmount, referenceNote) : '';
  const qrImageUrl = upiDeepLink ? generateUpiQrSvg(upiDeepLink, 220) : '';

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromRoommateId || !toRoommateId || fromRoommateId === toRoommateId) {
      alert('Please select two different roommates.');
      return;
    }
    if (numAmount <= 0) {
      alert('Please enter a valid settlement amount.');
      return;
    }

    onRecordSettlement({
      fromRoommateId,
      toRoommateId,
      amount: numAmount,
      date,
      paymentMethod,
      referenceNote: referenceNote.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Record Settlement & Pay</span>
            </h3>
            <span className="text-xs text-slate-500">
              Clear outstanding dues and record peer payment in the ledger
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Visualization Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Settlement Transaction</span>
            <span className="font-mono text-emerald-700 font-semibold">
              {formatCurrency(numAmount, currencySymbol)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[11px] text-slate-400 block">Payer (Who is paying)</span>
              <span className="text-xs font-bold text-slate-900 truncate block">
                {fromRm?.name || 'Select Payer'}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="flex-1 text-right">
              <span className="text-[11px] text-slate-400 block">Receiver (Gets paid)</span>
              <span className="text-xs font-bold text-slate-900 truncate block">
                {toRm?.name || 'Select Receiver'}
              </span>
            </div>
          </div>
        </div>

        {/* Instant UPI QR Code Box if receiver has UPI */}
        {upiId && numAmount > 0 && (
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Scan & Pay Receiver via UPI</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">GPay / PhonePe / Paytm</span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center py-1">
              <div className="p-2 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <img
                  src={qrImageUrl}
                  alt={`UPI QR for ${toRm?.name}`}
                  className="w-36 h-36 object-contain"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 font-mono">
                {formatCurrency(numAmount, currencySymbol)} to {toRm?.name}
              </span>
            </div>

            {/* Copy UPI & Open App Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyUpi}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-white border border-emerald-300 rounded-md hover:bg-emerald-50 transition-colors shadow-2xs"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied! ({upiId})</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy UPI: {upiId}</span>
                  </>
                )}
              </button>

              <a
                href={upiDeepLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open UPI App</span>
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payer and Receiver Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payer (Debtor)
              </label>
              <select
                value={fromRoommateId}
                onChange={(e) => setFromRoommateId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                Receiver (Creditor)
              </label>
              <select
                value={toRoommateId}
                onChange={(e) => setToRoommateId(e.target.value)}
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

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Paid ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Transfer
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="cash">Cash in hand</option>
                <option value="bank_transfer">NEFT / IMPS Bank Transfer</option>
                <option value="other">Other / Adjusted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Reference / Note
              </label>
              <input
                type="text"
                placeholder="e.g. GPay UPI Ref #827162"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit */}
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
              disabled={numAmount <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
            >
              Record Settlement in Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
