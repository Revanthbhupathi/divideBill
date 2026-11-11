import React, { useState } from 'react';
import {
  Roommate,
  RoomGroup
} from '../types';
import {
  formatCurrency,
  getDefaultRoomGroup
} from '../utils/finance';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
  Building,
  DollarSign,
  Phone,
  QrCode,
  CheckCircle2
} from 'lucide-react';

interface RoommatesViewProps {
  roomGroup: RoomGroup;
  currencySymbol: string;
  onUpdateRoommates: (roommates: Roommate[]) => void;
  onUpdateGroupDetails: (name: string, roomNumber?: string, address?: string, currency?: string) => void;
  onResetToSampleData: () => void;
  onImportData: (data: RoomGroup) => void;
}

const AVATAR_COLORS = [
  { color: '#2563EB', bg: '#EFF6FF' },
  { color: '#059669', bg: '#ECFDF5' },
  { color: '#D97706', bg: '#FEF3C7' },
  { color: '#7C3AED', bg: '#F5F3FF' },
  { color: '#DC2626', bg: '#FEF2F2' },
  { color: '#0284C7', bg: '#F0F9FF' },
  { color: '#4F46E5', bg: '#EEF2FF' },
  { color: '#EA580C', bg: '#FFF7ED' }
];

export const RoommatesView: React.FC<RoommatesViewProps> = ({
  roomGroup,
  currencySymbol,
  onUpdateRoommates,
  onUpdateGroupDetails,
  onResetToSampleData,
  onImportData
}) => {
  const [flatName, setFlatName] = useState(roomGroup.name);
  const [roomNumber, setRoomNumber] = useState(roomGroup.roomNumber || '');
  const [address, setAddress] = useState(roomGroup.address || '');
  const [selectedCurrency, setSelectedCurrency] = useState(roomGroup.currencySymbol);

  // Add / Edit Roommate Modal state
  const [isEditingRoommate, setIsEditingRoommate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [role, setRole] = useState('Roommate');
  const [colorIndex, setColorIndex] = useState(0);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setUpiId('');
    setRole('Roommate');
    setColorIndex(roomGroup.roommates.length % AVATAR_COLORS.length);
    setIsEditingRoommate(true);
  };

  const handleOpenEdit = (rm: Roommate) => {
    setEditingId(rm.id);
    setName(rm.name);
    setPhone(rm.phone);
    setUpiId(rm.upiId || '');
    setRole(rm.role || 'Roommate');
    const idx = AVATAR_COLORS.findIndex((c) => c.color === rm.avatarColor);
    setColorIndex(idx !== -1 ? idx : 0);
    setIsEditingRoommate(true);
  };

  const handleSaveRoommate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const chosenColor = AVATAR_COLORS[colorIndex];

    if (editingId) {
      // Edit existing
      const updated = roomGroup.roommates.map((rm) =>
        rm.id === editingId
          ? {
              ...rm,
              name: name.trim(),
              phone: phone.trim(),
              upiId: upiId.trim(),
              role: role.trim(),
              avatarColor: chosenColor.color,
              avatarBg: chosenColor.bg
            }
          : rm
      );
      onUpdateRoommates(updated);
    } else {
      // Add new
      const newRm: Roommate = {
        id: `rm-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        upiId: upiId.trim(),
        role: role.trim(),
        avatarColor: chosenColor.color,
        avatarBg: chosenColor.bg,
        joinedDate: new Date().toISOString().split('T')[0],
        isActive: true
      };
      onUpdateRoommates([...roomGroup.roommates, newRm]);
    }

    setIsEditingRoommate(false);
  };

  const handleDeleteRoommate = (id: string, rmName: string) => {
    if (roomGroup.roommates.length <= 2) {
      alert('A group must have at least 2 roommates.');
      return;
    }
    if (confirm(`Remove ${rmName} from this flat? Past logged expenses will still reflect their historical share.`)) {
      onUpdateRoommates(roomGroup.roommates.filter((r) => r.id !== id));
    }
  };

  const handleSaveFlatSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGroupDetails(flatName.trim(), roomNumber.trim(), address.trim(), selectedCurrency);
    alert('Flat settings updated successfully!');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(roomGroup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BillSplit_${roomGroup.name.replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (parsed && parsed.roommates && parsed.expenses) {
            onImportData(parsed);
            alert('Group ledger backup imported successfully!');
          } else {
            alert('Invalid backup file structure.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Roommates & Flat Management</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure roommates, their phone numbers & UPI handles for instant settlement transfers.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Roommate</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Roommates List (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Active Roommates ({roomGroup.roommates.length})
            </h3>
            <span className="text-xs text-slate-500">
              Click edit to update UPI ID or role
            </span>
          </div>

          <div className="space-y-3">
            {roomGroup.roommates.map((rm) => (
              <div
                key={rm.id}
                className="flex items-center justify-between p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      backgroundColor: rm.avatarBg,
                      color: rm.avatarColor
                    }}
                  >
                    {rm.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {rm.name}
                      </span>
                      {rm.role && (
                        <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          {rm.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      {rm.upiId && (
                        <span className="font-mono text-emerald-700">
                          UPI: {rm.upiId}
                        </span>
                      )}
                      {rm.phone && (
                        <span>Phone: {rm.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleOpenEdit(rm)}
                    title="Edit roommate details"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoommate(rm.id, rm.name)}
                    title="Remove roommate"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Flat Settings & Backup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Flat Config Card */}
          <form
            onSubmit={handleSaveFlatSettings}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Flat & Hostel Details</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Room / Flat Name
              </label>
              <input
                type="text"
                value={flatName}
                onChange={(e) => setFlatName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room / Flat No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 304"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  <option value="₹">₹ INR (Rupees)</option>
                  <option value="$">$ USD (Dollars)</option>
                  <option value="€">€ EUR (Euros)</option>
                  <option value="£">£ GBP (Pounds)</option>
                  <option value="A$">A$ AUD (Aus Dollar)</option>
                  <option value="C$">C$ CAD (Can Dollar)</option>
                  <option value="AED">AED (Dirhams)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Building Address (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Green Glen Layout, Bellandur, Bangalore"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Flat Settings</span>
            </button>
          </form>

          {/* Backup & Sample Data Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Data Backup & Sample Data
            </h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Ledger JSON Backup</span>
              </button>

              <label className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import JSON Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reload the realistic Bangalore PG / Hostel sample dataset? This will restore Flat 304 expenses, electricity readings, and mess logs.')) {
                    onResetToSampleData();
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Reload Sample Hostel Room</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Roommate Modal */}
      {isEditingRoommate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Roommate' : 'Add New Roommate'}
              </h3>
              <p className="text-xs text-slate-500">
                Provide their name, phone, and UPI ID for easy direct payments.
              </p>
            </div>

            <form onSubmit={handleSaveRoommate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arjun Naidu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPI ID (e.g. arjun@okaxis, rahul@paytm)
                </label>
                <input
                  type="text"
                  placeholder="name@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Used to generate 1-tap QR codes and settlement links
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flat Role / Responsibilities
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Tenant / Food"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setColorIndex(idx)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        colorIndex === idx ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.color }}
                    >
                      {colorIndex === idx && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingRoommate(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                >
                  {editingId ? 'Save Changes' : 'Add Roommate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
