import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await params;
    const filePath = segments.join("/");

    // Prevent directory traversal
    if (filePath.includes("..")) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext];
    if (!contentType) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const fullPath = join(process.cwd(), "uploads", "avatars", filePath);
    const buffer = await readFile(fullPath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
}
