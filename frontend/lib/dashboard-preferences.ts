export type DashboardMode = "monthly_focus" | "full_timeline";

const STORAGE_KEY = "dashboardMode";

function storageKeyForWorkspace(workspaceId: number | null) {
  if (!workspaceId) return null;
  return `${STORAGE_KEY}:workspace:${workspaceId}`;
}

export function loadDashboardMode(workspaceId: number | null): DashboardMode {
  if (typeof window === "undefined") return "monthly_focus";
  const key = storageKeyForWorkspace(workspaceId);
  if (!key) return "monthly_focus";
  const stored = window.localStorage.getItem(key);
  return stored === "full_timeline" ? "full_timeline" : "monthly_focus";
}

export function saveDashboardMode(workspaceId: number | null, mode: DashboardMode) {
  if (typeof window === "undefined") return;
  const key = storageKeyForWorkspace(workspaceId);
  if (!key) return;
  window.localStorage.setItem(key, mode);
}

