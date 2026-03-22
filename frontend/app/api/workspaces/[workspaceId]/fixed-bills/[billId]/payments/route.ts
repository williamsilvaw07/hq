import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/workspace-auth";
import { ensureFixedBillTable } from "@/lib/fixed-bill-migrate";
import { ensureBillPaymentTable } from "@/lib/bill-payment-migrate";
import { findFixedBillById } from "@/lib/repos/fixed-bill-repo";
import {
  findPaymentsByBill,
  createBillPayment,
  type BillPaymentWithUser,
} from "@/lib/repos/bill-payment-repo";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function toApiPayment(row: BillPaymentWithUser) {
  // MySQL DATE can come back as Date object or string
  const rawPaidAt = row.paid_at as unknown;
  let paidAt: string;
  if (rawPaidAt instanceof Date) {
    paidAt = rawPaidAt.toISOString().slice(0, 10);
  } else if (typeof rawPaidAt === "string") {
    paidAt = rawPaidAt.slice(0, 10);
  } else {
    paidAt = new Date(String(rawPaidAt)).toISOString().slice(0, 10);
  }

  return {
    id: row.id,
    fixedBillId: row.fixed_bill_id,
    paidByUserId: row.paid_by_user_id,
    paidByName: row.paid_by_name ?? null,
    amount: Number(row.amount),
    paidAt,
    periodMonth: Number(row.period_month),
    periodYear: Number(row.period_year),
    proofUrl: row.proof_url ?? null,
    proofFilename: row.proof_filename ?? null,
    notes: row.notes ?? null,
    source: row.source ?? "web",
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; billId: string }> },
) {
  try {
    const { workspaceId, billId } = await params;
    const { workspaceId: wid } = await requireWorkspaceMember(req, workspaceId);
    await ensureFixedBillTable();
    await ensureBillPaymentTable();

    const id = parseInt(billId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    const bill = await findFixedBillById(id, wid);
    if (!bill) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    const payments = await findPaymentsByBill(id, wid);
    return NextResponse.json({ data: payments.map(toApiPayment) });
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 404) return NextResponse.json({ message: "Not found." }, { status: 404 });
    console.error("GET bill payments error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; billId: string }> },
) {
  try {
    const { workspaceId, billId } = await params;
    const { workspaceId: wid, user } = await requireWorkspaceMember(req, workspaceId);
    await ensureFixedBillTable();
    await ensureBillPaymentTable();

    const fixedBillId = parseInt(billId, 10);
    if (Number.isNaN(fixedBillId)) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    const bill = await findFixedBillById(fixedBillId, wid);
    if (!bill) {
      return NextResponse.json({ message: "Bill not found." }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    let amount: number;
    let paidAt: string;
    let periodMonth: number;
    let periodYear: number;
    let notes: string | null = null;
    let proofUrl: string | null = null;
    let proofFilename: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      amount = parseFloat(String(formData.get("amount") ?? bill.amount)) || Number(bill.amount);
      paidAt = String(formData.get("paidAt") ?? new Date().toISOString().slice(0, 10));
      periodMonth = parseInt(String(formData.get("periodMonth") ?? ""), 10);
      periodYear = parseInt(String(formData.get("periodYear") ?? ""), 10);
      notes = formData.get("notes") ? String(formData.get("notes")).trim() || null : null;

      if (Number.isNaN(periodMonth) || Number.isNaN(periodYear)) {
        const d = new Date(paidAt + "T00:00:00");
        periodMonth = d.getMonth() + 1;
        periodYear = d.getFullYear();
      }

      const file = formData.get("proof");
      if (file && typeof file !== "string") {
        const blob = file as Blob;
        if (blob.size > MAX_FILE_SIZE) {
          return NextResponse.json({ message: "File too large (max 5MB)." }, { status: 422 });
        }
        const fileType = blob.type;
        if (!ALLOWED_TYPES.includes(fileType)) {
          return NextResponse.json(
            { message: "Invalid file type. Use JPEG, PNG, WebP, GIF, or PDF." },
            { status: 422 },
          );
        }

        const ext =
          fileType === "image/jpeg" ? "jpg" :
          fileType === "image/png" ? "png" :
          fileType === "image/webp" ? "webp" :
          fileType === "image/gif" ? "gif" : "pdf";

        const dir = join(process.cwd(), "uploads", "payments", String(wid), String(fixedBillId));
        await mkdir(dir, { recursive: true });
        const filename = `proof-${Date.now()}.${ext}`;
        const path = join(dir, filename);
        const buffer = Buffer.from(await blob.arrayBuffer());
        await writeFile(path, buffer);

        proofUrl = `/api/uploads/payments/${wid}/${fixedBillId}/${filename}`;
        proofFilename = (file as File).name ?? filename;
      }
    } else {
      const body = await req.json();
      amount = typeof body.amount === "number" ? body.amount : parseFloat(String(body.amount ?? bill.amount)) || Number(bill.amount);
      paidAt = typeof body.paidAt === "string" ? body.paidAt : new Date().toISOString().slice(0, 10);
      periodMonth = typeof body.periodMonth === "number" ? body.periodMonth : 0;
      periodYear = typeof body.periodYear === "number" ? body.periodYear : 0;
      notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

      if (!periodMonth || !periodYear) {
        const d = new Date(paidAt + "T00:00:00");
        periodMonth = d.getMonth() + 1;
        periodYear = d.getFullYear();
      }
    }

    const paymentId = await createBillPayment({
      fixedBillId,
      workspaceId: wid,
      paidByUserId: user.id,
      amount,
      paidAt,
      periodMonth,
      periodYear,
      proofUrl,
      proofFilename,
      notes,
      source: "web",
    });

    const payments = await findPaymentsByBill(fixedBillId, wid);
    const created = payments.find((p) => p.id === paymentId);

    return NextResponse.json(
      { data: created ? toApiPayment(created) : { id: paymentId } },
      { status: 201 },
    );
  } catch (e: unknown) {
    const status = (e as { status?: number }).status;
    if (status === 401) return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    if (status === 403) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    if (status === 404) return NextResponse.json({ message: "Not found." }, { status: 404 });
    console.error("POST bill payment error:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
