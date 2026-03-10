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
/**
 * Parse a stored bill date string into a Date.
 * Supports both "YYYY-MM-DD" and "DD/MM/YYYY" formats.
 */
export function parseBillDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // ISO date: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const day = Number.parseInt(dd, 10);
    const month = Number.parseInt(mm, 10) - 1;
    const year = Number.parseInt(yyyy, 10);
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

/** Format a Date as DD/MM/YYYY for display. */
export function formatBillDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Format a Date as YYYY-MM-DD for `<input type="date" />` values. */
export function formatBillInputDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

function parseEndDate(endDate: string | null): Date | null {
  if (!endDate) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const d = new Date(endDate + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = parseBillDate(endDate);
  return parsed;
}

/**
 * Compute the next occurrence date for a bill, starting from `fromDate` (defaults to today).
 * Returns null if no future occurrences exist (e.g. after endDate or missing configuration).
 */
export function computeNextOccurrence(
  bill: FixedBill,
  fromDate: Date = new Date(),
): Date | null {
  const start = parseBillDate(bill.due);
  if (!start) return null;

  const end = parseEndDate(bill.endDate);

  // Base date is the later of "today" and the start date.
  const base = fromDate > start ? fromDate : start;

  if (end && base > end) {
    return null;
  }

  if (bill.frequency === "weekly") {
    const weekday = typeof bill.dayOfWeek === "number" ? bill.dayOfWeek : start.getDay();
    if (weekday < 0 || weekday > 6) return null;

    const baseMidnight = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const baseWeekday = baseMidnight.getDay();
    let delta = (weekday - baseWeekday + 7) % 7;
    const candidate = new Date(
      baseMidnight.getFullYear(),
      baseMidnight.getMonth(),
      baseMidnight.getDate() + delta,
    );

    // Ensure we never schedule before start date
    const next = candidate < start ? new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000) : candidate;

    if (end && next > end) {
      return null;
    }
    return next;
  }

  // Monthly
  const targetDay =
    typeof bill.dayOfMonth === "number" && bill.dayOfMonth >= 1 && bill.dayOfMonth <= 31
      ? bill.dayOfMonth
      : start.getDate();

  const baseYear = base.getFullYear();
  const baseMonth = base.getMonth();

  // Candidate in current month
  let candidate = new Date(baseYear, baseMonth, targetDay);

  // If that spills into next month (e.g. Feb 31) clamp to last day of month
  if (candidate.getMonth() !== baseMonth) {
    candidate = new Date(baseYear, baseMonth + 1, 0);
  }

  if (candidate < base || candidate < start) {
    // Move to next month
    const nextMonthYear = baseMonth === 11 ? baseYear + 1 : baseYear;
    const nextMonth = (baseMonth + 1) % 12;
    candidate = new Date(nextMonthYear, nextMonth, targetDay);
    if (candidate.getMonth() !== nextMonth) {
      candidate = new Date(nextMonthYear, nextMonth + 1, 0);
    }
  }

  if (end && candidate > end) {
    return null;
  }

  return candidate;
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Human-readable recurrence rule description for a bill. */
export function formatRecurrenceRule(bill: FixedBill): string {
  const start = parseBillDate(bill.due);

  if (bill.frequency === "weekly") {
    const weekday =
      typeof bill.dayOfWeek === "number" && bill.dayOfWeek >= 0 && bill.dayOfWeek <= 6
        ? bill.dayOfWeek
        : start?.getDay();
    if (weekday == null) return "Weekly";
    return `Weekly on ${WEEKDAY_NAMES[weekday]}`;
  }

  const day =
    typeof bill.dayOfMonth === "number" && bill.dayOfMonth >= 1 && bill.dayOfMonth <= 31
      ? bill.dayOfMonth
      : start?.getDate();

  if (!day) return "Monthly";
  return `Monthly on day ${day}`;
}

