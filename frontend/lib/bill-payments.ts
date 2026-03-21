export type BillPayment = {
  id: number;
  fixedBillId: number;
  paidByUserId: number | null;
  paidByName: string | null;
  amount: number;
  paidAt: string;
  periodMonth: number;
  periodYear: number;
  proofUrl: string | null;
  proofFilename: string | null;
  notes: string | null;
  source: string;
  createdAt: string;
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function formatPeriod(month: number, year: number): string {
  const name = MONTH_NAMES[month - 1] ?? "???";
  return `${name} ${year}`;
}

export function isPaidForMonth(
  payments: BillPayment[],
  billId: number,
  month: number,
  year: number,
): boolean {
  return payments.some(
    (p) =>
      p.fixedBillId === billId &&
      p.periodMonth === month &&
      p.periodYear === year,
  );
}
