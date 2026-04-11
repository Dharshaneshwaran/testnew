export type AlertCondition = "ABOVE" | "BELOW";

export interface AlertItem {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
