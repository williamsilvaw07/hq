import EditTransactionClient from "./edit-transaction-client";

export function generateStaticParams(): { id: string }[] {
  return [{ id: "0" }];
}

export default function EditTransactionPage() {
  return <EditTransactionClient />;
}
