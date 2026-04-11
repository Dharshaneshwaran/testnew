import { apiRequest } from "@/lib/api/client";
import { AlertCondition, AlertItem } from "@/types/alert";

interface ApiAlertItem {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function normalizeAlert(alert: ApiAlertItem): AlertItem {
  return {
    ...alert,
    targetPrice: Number(alert.targetPrice),
  };
}

export async function getAlerts(token: string) {
  const alerts = await apiRequest<ApiAlertItem[]>("/alerts", { method: "GET" }, token);
  return alerts.map(normalizeAlert);
}

export async function createAlert(
  payload: {
    symbol: string;
    condition: AlertCondition;
    targetPrice: number;
    isActive?: boolean;
  },
  token: string,
) {
  const alert = await apiRequest<ApiAlertItem>(
    "/alerts",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );

  return normalizeAlert(alert);
}

export async function toggleAlert(id: string, token: string) {
  const alert = await apiRequest<ApiAlertItem>(
    `/alerts/${encodeURIComponent(id)}/toggle`,
    { method: "PATCH" },
    token,
  );

  return normalizeAlert(alert);
}
