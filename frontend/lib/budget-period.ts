/** Current period and next_reset date for a budget (day/week/month/year). */
export function getCurrentPeriod(budget: {
  periodType: string | null;
  periodInterval: number | null;
  startDate: Date | null;
}): { start: Date; end: Date; next_reset: Date } {
  const now = new Date();
  const type = budget.periodType ?? "month";
  const interval = budget.periodInterval ?? 1;

  if (type === "week") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const nextReset = new Date(sunday);
    nextReset.setDate(sunday.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);
    return { start: monday, end: sunday, next_reset: nextReset };
  }

  if (type === "month" && interval === 3 && budget.startDate) {
    const anchor = new Date(budget.startDate);
    anchor.setHours(0, 0, 0, 0);
    if (now < anchor) {
      const start = new Date(anchor);
      const end = new Date(anchor);
      end.setMonth(end.getMonth() + 3);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      const nextReset = new Date(end);
      nextReset.setDate(nextReset.getDate() + 1);
      return { start, end, next_reset: nextReset };
    }
    let periodStart = new Date(anchor);
    while (true) {
      const next = new Date(periodStart);
      next.setMonth(next.getMonth() + 3);
      if (next > now) break;
      periodStart = next;
    }
    const start = new Date(periodStart);
    const end = new Date(periodStart);
    end.setMonth(end.getMonth() + 3);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    const nextReset = new Date(end);
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);
    return { start, end, next_reset: nextReset };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end, next_reset: nextReset };
}
