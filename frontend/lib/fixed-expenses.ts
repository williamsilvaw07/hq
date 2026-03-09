export type FixedBill = {
  id: number;
  name: string;
  category: string;
  amount: number;
  /** Date string in DD/MM/YYYY */
  due: string;
  /** Whether the bill is considered due soon for UI highlighting */
  dueSoon: boolean;
};

export const MOCK_FIXED_BILLS: FixedBill[] = [
  { id: 1, name: "Apartment Rent", category: "Housing", amount: 2200, due: "01/10/2023", dueSoon: true },
  { id: 2, name: "Netflix 4K", category: "Entertainment", amount: 19.99, due: "12/10/2023", dueSoon: false },
  { id: 3, name: "Cloud Storage", category: "Tech", amount: 9.99, due: "20/10/2023", dueSoon: false },
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
    return parsed.map((b) => ({
      id: typeof b.id === "number" ? b.id : 0,
      name: String(b.name ?? ""),
      category: String(b.category ?? ""),
      amount: Number(b.amount ?? 0),
      due: String(b.due ?? ""),
      dueSoon: Boolean(b.dueSoon),
    })) as FixedBill[];
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


