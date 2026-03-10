export type FixedBillFrequency = "monthly" | "weekly";

export type FixedBill = {
  id: number;
  name: string;
  category: string;
  amount: number;
  /** Next charge date, free-form string (e.g. DD/MM/YYYY) */
  due: string;
  /** Whether the bill is considered due soon for UI highlighting */
  dueSoon: boolean;
  /** How often this bill repeats */
  frequency: FixedBillFrequency;
  /** Day of month (1–31) when billed, for monthly frequency */
  dayOfMonth: number | null;
  /** Day of week (0–6, Sunday=0) when billed, for weekly frequency */
  dayOfWeek: number | null;
  /** Optional end date for the recurrence (e.g. YYYY-MM-DD), or null for no end */
  endDate: string | null;
};

export const MOCK_FIXED_BILLS: FixedBill[] = [
  {
    id: 1,
    name: "Apartment Rent",
    category: "Housing",
    amount: 2200,
    due: "01/10/2023",
    dueSoon: true,
    frequency: "monthly",
    dayOfMonth: 1,
    dayOfWeek: null,
    endDate: null,
  },
  {
    id: 2,
    name: "Netflix 4K",
    category: "Entertainment",
    amount: 19.99,
    due: "12/10/2023",
    dueSoon: false,
    frequency: "monthly",
    dayOfMonth: 12,
    dayOfWeek: null,
    endDate: null,
  },
  {
    id: 3,
    name: "Cloud Storage",
    category: "Tech",
    amount: 9.99,
    due: "20/10/2023",
    dueSoon: false,
    frequency: "monthly",
    dayOfMonth: 20,
    dayOfWeek: null,
    endDate: null,
  },
];

const STORAGE_KEY_PREFIX = "fixedBills:v1:";

export function fixedBillsTotal(bills: FixedBill[]): number {
  return bills.reduce((sum, bill) => sum + bill.amount, 0);
}

export function fixedBillsCount(bills: FixedBill[]): number {
  return bills.length;
}

function getStorageKey(workspaceId: number | null): string {
  const suffix = workspaceId && workspaceId > 0 ? String(workspaceId) : "default";
  return `${STORAGE_KEY_PREFIX}${suffix}`;
}

export function loadFixedBills(workspaceId: number | null): FixedBill[] {
  if (typeof window === "undefined") {
    return MOCK_FIXED_BILLS;
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(workspaceId));
    if (!raw) return MOCK_FIXED_BILLS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return MOCK_FIXED_BILLS;
    return parsed.map((b) => {
      const safeDue = String(b.due ?? "");
      const parsedDay =
        typeof b.dayOfMonth === "number"
          ? b.dayOfMonth
          : Number.parseInt(safeDue.slice(0, 2), 10) || null;

      const frequency: FixedBillFrequency =
        b.frequency === "weekly" || b.frequency === "monthly"
          ? b.frequency
          : "monthly";

      return {
        id: typeof b.id === "number" ? b.id : 0,
        name: String(b.name ?? ""),
        category: String(b.category ?? ""),
        amount: Number(b.amount ?? 0),
        due: safeDue,
        dueSoon: Boolean(b.dueSoon),
        frequency,
        dayOfMonth: parsedDay,
        dayOfWeek:
          typeof b.dayOfWeek === "number" && b.dayOfWeek >= 0 && b.dayOfWeek <= 6
            ? b.dayOfWeek
            : null,
        endDate: typeof b.endDate === "string" ? b.endDate : null,
      } as FixedBill;
    });
  } catch {
    return MOCK_FIXED_BILLS;
  }
}

export function saveFixedBills(workspaceId: number | null, bills: FixedBill[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(bills));
  } catch {
    // ignore storage errors
  }
}


