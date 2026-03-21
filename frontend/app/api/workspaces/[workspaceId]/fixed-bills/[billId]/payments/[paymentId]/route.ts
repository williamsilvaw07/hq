import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { requireWorkspaceMember } from "@/lib/workspace-auth";
import { ensureBillPaymentTable } from "@/lib/bill-payment-migrate";
import {
  findPaymentById,
  deleteBillPayment,
} from "@/lib/repos/bill-payment-repo";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; billId: string; paymentId: string }> },
) {
  try {
    const { workspaceId, paymentId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    await ensureBillPaymentTable();

    const id = parseInt(paymentId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Payment not found." }, { status: 404 });
    }

    const payment = await findPaymentById(id, wid);
    if (!payment) {
      return NextResponse.json({ message: "Payment not found." }, { status: 404 });
    }

    // Try to clean up the proof file
    if (payment.proof_url) {
      try {
        const relativePath = payment.proof_url.replace(/^\/api\/uploads\/payments\//, "");
        const fullPath = join(process.cwd(), "uploads", "payments", relativePath);
        await unlink(fullPath);
      } catch {
        // File may already be deleted — ignore
      }
    }

    await deleteBillPayment(id, wid);
    return NextResponse.json({ data: { deleted: true } });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Not found." }, { status: 404 });
    console.error("DELETE bill payment error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
