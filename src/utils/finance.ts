import {
  Expense,
  ExpenseCategory,
  CategoryMeta,
  Roommate,
  Settlement,
  RoommateBalance,
  SimplifiedDebt,
  DailyMessLog,
  RoomGroup
} from '../types';

export const CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  rent: {
    id: 'rent',
    name: 'Room Rent & Dues',
    icon: 'Building2',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    description: 'Flat/PG room rent, owner maintenance dues'
  },
  electricity: {
    id: 'electricity',
    name: 'EB Electricity Bill',
    icon: 'Zap',
    color: '#D97706',
    bgLight: '#FEF3C7',
    description: 'State EB meter reading & unit charges'
  },
  mess_food: {
    id: 'mess_food',
    name: 'Mess & Groceries',
    icon: 'Utensils',
    color: '#059669',
    bgLight: '#ECFDF5',
    description: 'Vegetables, rice, oil, spices, daily ration'
  },
  cook_maid: {
    id: 'cook_maid',
    name: 'Cook & Maid Salary',
    icon: 'ChefHat',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    description: 'Monthly wages for cooking & cleaning'
  },
  water_can: {
    id: 'water_can',
    name: '20L Drinking Water Cans',
    icon: 'Droplet',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    description: 'Mineral water jar refills & dispenser'
  },
  wifi: {
    id: 'wifi',
    name: 'Wi-Fi & Broadband',
    icon: 'Wifi',
    color: '#4F46E5',
    bgLight: '#EEF2FF',
    description: 'Airtel / JioFiber broadband recharge'
  },
  lpg_gas: {
    id: 'lpg_gas',
    name: 'LPG Gas Cylinder',
    icon: 'Flame',
    color: '#DC2626',
    bgLight: '#FEF2F2',
    description: 'Indane / HP cooking gas cylinder refills'
  },
  snacks_dining: {
    id: 'snacks_dining',
    name: 'Snacks & Food Delivery',
    icon: 'Pizza',
    color: '#EA580C',
    bgLight: '#FFF7ED',
    description: 'Swiggy/Zomato, tea, weekend takeaway'
  },
  other: {
    id: 'other',
    name: 'Household & Cleaning',
    icon: 'Sparkles',
    color: '#4B5563',
    bgLight: '#F3F4F6',
    description: 'Brooms, Colin, Harpic, garbage bags, etc.'
  }
};

/**
 * Format currency with symbol and tabular precision
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  // Format with commas according to Indian or International system
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2
  }).format(rounded);
  return `${symbol}${formattedNumber}`;
}

/**
 * Calculate net balance for every roommate
 */
export function calculateBalances(
  roommates: Roommate[],
  expenses: Expense[],
  settlements: Settlement[]
): RoommateBalance[] {
  const balanceMap = new Map<string, RoommateBalance>();

  roommates.forEach((rm) => {
    balanceMap.set(rm.id, {
      roommateId: rm.id,
      name: rm.name,
      paid: 0,
      share: 0,
      settledPaid: 0,
      settledReceived: 0,
      netBalance: 0
    });
  });

  // Calculate expenses paid and consumed
  expenses.forEach((expense) => {
    // Who paid
    const payer = balanceMap.get(expense.paidById);
    if (payer) {
      payer.paid += expense.amount;
    }

    // Who consumed
    expense.splits.forEach((split) => {
      const consumer = balanceMap.get(split.roommateId);
      if (consumer) {
        consumer.share += split.amount;
      }
    });
  });

  // Factor in settlements (direct payments made between roommates)
  settlements.forEach((settlement) => {
    const fromRm = balanceMap.get(settlement.fromRoommateId);
    const toRm = balanceMap.get(settlement.toRoommateId);
    if (fromRm) {
      fromRm.settledPaid += settlement.amount;
    }
    if (toRm) {
      toRm.settledReceived += settlement.amount;
    }
  });

  // Final net balance calculation
  // Net balance = (paid - share) + (settledPaid - settledReceived)
  // Positive => Owed money (Creditor)
  // Negative => Owes money (Debtor)
  balanceMap.forEach((bal) => {
    bal.netBalance = (bal.paid - bal.share) + (bal.settledPaid - bal.settledReceived);
    // round to 2 decimals to eliminate floating point issues
    bal.netBalance = Math.round(bal.netBalance * 100) / 100;
  });

  return Array.from(balanceMap.values());
}

/**
 * Debt Simplification Algorithm (Min-Cash-Flow Greedy Solver)
 * Takes complex multi-way debts and simplifies them into the minimum number of transactions
 */
export function simplifyDebts(
  balances: RoommateBalance[],
  roommates: Roommate[]
): SimplifiedDebt[] {
  const rmMap = new Map(roommates.map((r) => [r.id, r]));

  // Separate creditors (> 0) and debtors (< 0)
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  balances.forEach((b) => {
    const rounded = Math.round(b.netBalance * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ id: b.roommateId, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ id: b.roommateId, amount: -rounded }); // positive amount representing debt
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);
    const roundedSettle = Math.round(settleAmount * 100) / 100;

    if (roundedSettle > 0.01) {
      const fromRm = rmMap.get(debtor.id);
      const toRm = rmMap.get(creditor.id);

      transactions.push({
        fromId: debtor.id,
        toId: creditor.id,
        fromName: fromRm ? fromRm.name : 'Unknown',
        toName: toRm ? toRm.name : 'Unknown',
        amount: roundedSettle,
        toUpiId: toRm?.upiId,
        toPhone: toRm?.phone
      });
    }

    creditor.amount -= roundedSettle;
    debtor.amount -= roundedSettle;

    if (creditor.amount < 0.01) {
      i++;
    }
    if (debtor.amount < 0.01) {
      j++;
    }
  }

  return transactions;
}

/**
 * Generate UPI Intent URL for instant 1-tap payment in Google Pay / PhonePe / Paytm / BHIM
 */
export function generateUpiUrl(
  upiId: string,
  payeeName: string,
  amount: number,
  notes: string = 'BillSplit Settlement'
): string {
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanAmount = amount.toFixed(2);
  const cleanNotes = encodeURIComponent(notes);
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNotes}`;
}

/**
 * Calculate total meal attendance from daily logs
 */
export function calculateMessAttendanceStats(
  messLogs: DailyMessLog[],
  roommates: Roommate[]
) {
  const stats: Record<
    string,
    {
      breakfast: number;
      lunch: number;
      dinner: number;
      totalMeals: number;
      percentage: number;
    }
  > = {};

  roommates.forEach((rm) => {
    stats[rm.id] = { breakfast: 0, lunch: 0, dinner: 0, totalMeals: 0, percentage: 0 };
  });

  let grandTotalMeals = 0;

  messLogs.forEach((log) => {
    log.attendance.forEach((att) => {
      const rmStat = stats[att.roommateId];
      if (rmStat) {
        if (att.breakfast) rmStat.breakfast++;
        if (att.lunch) rmStat.lunch++;
        if (att.dinner) rmStat.dinner++;
      }
    });
  });

  roommates.forEach((rm) => {
    const s = stats[rm.id];
    // Weights: Breakfast = 0.5 meal, Lunch = 1 meal, Dinner = 1 meal
    s.totalMeals = s.breakfast * 0.5 + s.lunch * 1.0 + s.dinner * 1.0;
    grandTotalMeals += s.totalMeals;
  });

  roommates.forEach((rm) => {
    const s = stats[rm.id];
    s.percentage = grandTotalMeals > 0 ? (s.totalMeals / grandTotalMeals) * 100 : 0;
  });

  return { stats, grandTotalMeals };
}

/**
 * Generate clear, beautiful text formatted for WhatsApp group sharing
 */
export function generateWhatsAppSummary(
  roomName: string,
  monthName: string,
  currencySymbol: string,
  expenses: Expense[],
  balances: RoommateBalance[],
  simplifiedDebts: SimplifiedDebt[],
  roommates: Roommate[]
): string {
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categorySpend: Record<string, number> = {};
  expenses.forEach((e) => {
    categorySpend[e.category] = (categorySpend[e.category] || 0) + e.amount;
  });

  let msg = `🏠 *${roomName} - BillSplit Monthly Statement*\n`;
  msg += `📅 *Month:* ${monthName}\n`;
  msg += `💰 *Total Room Expenses:* ${formatCurrency(totalSpend, currencySymbol)} (${expenses.length} bills logged)\n`;
  msg += `═══════════════════════════\n\n`;

  // Major Category Breakdown
  msg += `📊 *Category Breakdown:*\n`;
  Object.entries(categorySpend).forEach(([catKey, amt]) => {
    const cat = CATEGORIES[catKey as ExpenseCategory];
    msg += `• ${cat?.name || catKey}: ${formatCurrency(amt, currencySymbol)}\n`;
  });
  msg += `\n═══════════════════════════\n\n`;

  // Roommate Balances
  msg += `👥 *Individual Net Balances:*\n`;
  balances.forEach((bal) => {
    if (bal.netBalance > 0.01) {
      msg += `• *${bal.name}*: +${formatCurrency(bal.netBalance, currencySymbol)} (🟢 Gets back)\n`;
    } else if (bal.netBalance < -0.01) {
      msg += `• *${bal.name}*: -${formatCurrency(Math.abs(bal.netBalance), currencySymbol)} (🔴 Owes)\n`;
    } else {
      msg += `• *${bal.name}*: Settled up (0)\n`;
    }
  });
  msg += `\n═══════════════════════════\n\n`;

  // Simplified Settlements (Who owes whom)
  msg += `🤝 *Settlement Plan (Auto-Simplified):*\n`;
  if (simplifiedDebts.length === 0) {
    msg += `🎉 All expenses are fully balanced! No pending payments.\n`;
  } else {
    simplifiedDebts.forEach((debt, index) => {
      const upiText = debt.toUpiId ? ` [UPI: ${debt.toUpiId}]` : '';
      msg += `${index + 1}. *${debt.fromName}* ➡️ *${debt.toName}*: ${formatCurrency(debt.amount, currencySymbol)}${upiText}\n`;
    });
  }

  msg += `\n💡 Please settle your dues via UPI or cash and keep our flat stress-free!\n`;
  msg += `_Managed via BillSplit for Roommates_`;

  return msg;
}

/**
 * Realistic default sample data for a hostel/PG room in Bangalore / Pune / Delhi
 */
export function getDefaultRoomGroup(): RoomGroup {
  const currentMonthKey = '2026-11';

  const roommates: Roommate[] = [
    {
      id: 'rm-1',
      name: 'Arjun Naidu',
      phone: '+91 98765 43210',
      upiId: 'arjun@okaxis',
      avatarColor: '#2563EB',
      avatarBg: '#EFF6FF',
      role: 'Lead Tenant (Rent & EB)',
      joinedDate: '2026-06-01',
      isActive: true
    },
    {
      id: 'rm-2',
      name: 'Rahul Sharma',
      phone: '+91 98123 45678',
      upiId: 'rahul.sharma@paytm',
      avatarColor: '#059669',
      avatarBg: '#ECFDF5',
      role: 'Food & Mess Incharge',
      joinedDate: '2026-06-01',
      isActive: true
    },
    {
      id: 'rm-3',
      name: 'Rohan Deshmukh',
      phone: '+91 99887 76655',
      upiId: 'rohan.d@icici',
      avatarColor: '#D97706',
      avatarBg: '#FEF3C7',
      role: 'Wi-Fi & Utilities',
      joinedDate: '2026-06-01',
      isActive: true
    },
    {
      id: 'rm-4',
      name: 'Sneha Patel',
      phone: '+91 97654 32109',
      upiId: 'sneha.patel@okhdfcbank',
      avatarColor: '#7C3AED',
      avatarBg: '#F5F3FF',
      role: 'Roommate',
      joinedDate: '2026-07-15',
      isActive: true
    }
  ];

  // 4 roommates share equal rent
  const rentSplits = roommates.map((rm) => ({
    roommateId: rm.id,
    amount: 4500
  }));

  // EB split equally
  const ebSplits = roommates.map((rm) => ({
    roommateId: rm.id,
    amount: 380
  }));

  // Cook auntie salary split equally
  const cookSplits = roommates.map((rm) => ({
    roommateId: rm.id,
    amount: 750
  }));

  // Veggies & ration split equally
  const veggiesSplits = roommates.map((rm) => ({
    roommateId: rm.id,
    amount: 215
  }));

  // Wi-Fi recharge split equally
  const wifiSplits = roommates.map((rm) => ({
    roommateId: rm.id,
    amount: 199.75
  }));

  // Water cans (4 jars x ₹35 = ₹140)
  const waterSplits = roommates.map((rm) => ({
    roommateId: rm.id,
    amount: 35
  }));

  // Swiggy weekend dinner - only Arjun, Rahul, Rohan ate (Sneha was at hometown)
  const dinnerSplits = [
    { roommateId: 'rm-1', amount: 330 },
    { roommateId: 'rm-2', amount: 330 },
    { roommateId: 'rm-3', amount: 330 }
  ];

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      title: 'Flat Rent - Nov 2026',
      amount: 18000,
      category: 'rent',
      paidById: 'rm-1', // Arjun paid landlord
      date: '2026-11-01',
      notes: 'Transferred via NEFT to landlord Satish Uncle',
      splitType: 'equal',
      splits: rentSplits,
      monthKey: currentMonthKey,
      createdAt: 1762848000000
    },
    {
      id: 'exp-2',
      title: 'Bescom Electricity (EB) Bill',
      amount: 1520,
      category: 'electricity',
      paidById: 'rm-1', // Arjun paid
      date: '2026-11-03',
      notes: 'Sub-meter consumption: 160 units @ ₹8.25/unit + fixed charges',
      splitType: 'equal',
      splits: ebSplits,
      monthKey: currentMonthKey,
      electricityData: {
        previousReading: 4120,
        currentReading: 4280,
        unitsConsumed: 160,
        ratePerUnit: 8.25,
        fixedCharge: 200
      },
      createdAt: 1762934400000
    },
    {
      id: 'exp-3',
      title: 'Cook Auntie (Kamla Bai) Salary',
      amount: 3000,
      category: 'cook_maid',
      paidById: 'rm-2', // Rahul paid
      date: '2026-11-05',
      notes: 'Monthly cooking & kitchen cleaning fee',
      splitType: 'equal',
      splits: cookSplits,
      monthKey: currentMonthKey,
      createdAt: 1763107200000
    },
    {
      id: 'exp-4',
      title: 'Weekly Vegetables & Kirana (D-Mart)',
      amount: 860,
      category: 'mess_food',
      paidById: 'rm-2', // Rahul paid
      date: '2026-11-06',
      notes: 'Aata 5kg, onions, potatoes, tomatoes, oil & ginger-garlic',
      splitType: 'equal',
      splits: veggiesSplits,
      monthKey: currentMonthKey,
      createdAt: 1763193600000
    },
    {
      id: 'exp-5',
      title: 'Airtel Xstream Fiber 200Mbps',
      amount: 799,
      category: 'wifi',
      paidById: 'rm-3', // Rohan paid
      date: '2026-11-04',
      notes: 'Monthly broadband renewal for flat Wi-Fi',
      splitType: 'equal',
      splits: wifiSplits,
      monthKey: currentMonthKey,
      createdAt: 1763020800000
    },
    {
      id: 'exp-6',
      title: 'Bisleri 20L Water Jars (4 Cans)',
      amount: 140,
      category: 'water_can',
      paidById: 'rm-3', // Rohan paid
      date: '2026-11-08',
      notes: 'Cash paid to local water delivery boy',
      splitType: 'equal',
      splits: waterSplits,
      monthKey: currentMonthKey,
      createdAt: 1763366400000
    },
    {
      id: 'exp-7',
      title: 'Biryani & Kebabs Weekend Treat',
      amount: 990,
      category: 'snacks_dining',
      paidById: 'rm-4', // Sneha treated/paid via Zomato
      date: '2026-11-09',
      notes: 'Split among Arjun, Rahul and Rohan (Sneha was travelling)',
      splitType: 'equal',
      splits: dinnerSplits,
      monthKey: currentMonthKey,
      createdAt: 1763452800000
    }
  ];

  // Daily Mess Logs for recent days
  const messLogs: DailyMessLog[] = [
    {
      date: '2026-11-07',
      notes: 'Aloo paratha for breakfast, Dal Tadka lunch',
      attendance: [
        { roommateId: 'rm-1', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-2', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-3', breakfast: false, lunch: true, dinner: true },
        { roommateId: 'rm-4', breakfast: true, lunch: false, dinner: true }
      ]
    },
    {
      date: '2026-11-08',
      notes: 'Poha breakfast, Rajma Chawal dinner',
      attendance: [
        { roommateId: 'rm-1', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-2', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-3', breakfast: true, lunch: true, dinner: false },
        { roommateId: 'rm-4', breakfast: true, lunch: true, dinner: true }
      ]
    },
    {
      date: '2026-11-09',
      notes: 'Idli Sambar breakfast',
      attendance: [
        { roommateId: 'rm-1', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-2', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-3', breakfast: true, lunch: false, dinner: true },
        { roommateId: 'rm-4', breakfast: false, lunch: false, dinner: false }
      ]
    },
    {
      date: '2026-11-10',
      notes: 'Upma breakfast, Paneer Butter Masala dinner',
      attendance: [
        { roommateId: 'rm-1', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-2', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-3', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-4', breakfast: true, lunch: true, dinner: true }
      ]
    },
    {
      date: '2026-11-11',
      notes: 'Eggs & toast, Veg Khichdi dinner',
      attendance: [
        { roommateId: 'rm-1', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-2', breakfast: true, lunch: true, dinner: true },
        { roommateId: 'rm-3', breakfast: false, lunch: true, dinner: true },
        { roommateId: 'rm-4', breakfast: true, lunch: true, dinner: true }
      ]
    }
  ];

  const settlements: Settlement[] = [];

  return {
    id: 'room-304',
    name: 'Flat 304 - Royal Palms PG',
    roomNumber: 'Room 304',
    address: 'B-Block, 3rd Floor, Green Glen Layout, Bellandur, Bangalore',
    currencySymbol: '₹',
    monthlyBudget: 30000,
    activeMonth: currentMonthKey,
    roommates,
    expenses,
    settlements,
    messLogs
  };
}

const STORAGE_KEY = 'billsplit_room_data_v1';

export function loadRoomData(): RoomGroup {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.roommates && parsed.expenses) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading saved room data:', err);
  }
  const defaultData = getDefaultRoomGroup();
  saveRoomData(defaultData);
  return defaultData;
}

export function saveRoomData(data: RoomGroup): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving room data:', err);
  }
}
