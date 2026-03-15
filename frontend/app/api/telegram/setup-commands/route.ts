import { NextResponse } from "next/server";

/**
 * POST /api/telegram/setup-commands
 * Registers bot commands with Telegram so they appear in the command menu.
 * Call this once after deploying (or whenever commands change).
 */
export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ message: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  const commands = [
    { command: "workspace", description: "View & switch active workspace" },
    { command: "status", description: "Show current active workspace" },
    { command: "help", description: "Show usage guide & commands" },
  ];

  const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands }),
  });

  const data = await res.json();

  if (!data.ok) {
    return NextResponse.json({ message: "Failed to set commands", error: data }, { status: 500 });
  }

  return NextResponse.json({ message: "Commands registered", commands });
}
