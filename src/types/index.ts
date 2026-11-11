export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'mess_food'
  | 'cook_maid'
  | 'water_can'
  | 'wifi'
  | 'lpg_gas'
  | 'snacks_dining'
  | 'other';

export interface CategoryMeta {
  id: ExpenseCategory;
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  description: string;
}

export type SplitType = 'equal' | 'custom_amount' | 'percentage' | 'shares';

export interface ExpenseSplit {
  roommateId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface ElectricityMetadata {
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  fixedCharge: number;
  meterPhotoUrl?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidById: string; // roommateId
  date: string; // YYYY-MM-DD
  notes?: string;
  billPhotoUrl?: string;
  splitType: SplitType;
  splits: ExpenseSplit[]; // amounts each person owes for this bill
  monthKey: string; // YYYY-MM
  electricityData?: ElectricityMetadata;
  createdAt: number;
}

export interface Roommate {
  id: string;
  name: string;
  phone: string;
  upiId?: string;
  avatarColor: string;
  avatarBg: string;
  role?: string; // e.g. "Lead Tenant", "Food Coordinator", etc.
  joinedDate: string;
  isActive: boolean;
}

export interface MealAttendance {
  roommateId: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface DailyMessLog {
  date: string; // YYYY-MM-DD
  attendance: MealAttendance[];
  notes?: string;
}

export interface Settlement {
  id: string;
  fromRoommateId: string;
  toRoommateId: string;
  amount: number;
  date: string;
  paymentMethod: 'upi' | 'cash' | 'bank_transfer' | 'other';
  referenceNote?: string;
  settledAt: number;
}

export interface SimplifiedDebt {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  amount: number;
  toUpiId?: string;
  toPhone?: string;
}

export interface RoommateBalance {
  roommateId: string;
  name: string;
  paid: number; // total amount paid as payer
  share: number; // total amount owed as consumer
  settledPaid: number; // paid in settlements
  settledReceived: number; // received in settlements
  netBalance: number; // positive = to receive, negative = owes
}

export interface RoomGroup {
  id: string;
  name: string;
  roomNumber?: string;
  address?: string;
  currencySymbol: string;
  monthlyBudget?: number;
  activeMonth: string; // "2026-11"
  roommates: Roommate[];
  expenses: Expense[];
  settlements: Settlement[];
  messLogs: DailyMessLog[];
}
