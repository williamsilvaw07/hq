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

export function fixedBillsTotal(bills: FixedBill[]): number {
  return bills.reduce((sum, bill) => sum + bill.amount, 0);
}

export function fixedBillsCount(bills: FixedBill[]): number {
  return bills.length;
}

