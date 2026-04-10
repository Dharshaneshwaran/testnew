export interface ExpiryItem {
  label: string;
  value: string;
}

export interface OptionLeg {
  oi: number;
  iv: number;
  volume: number;
  ltp: number;
  change: number;
}

export interface OptionChainRow {
  strike: number;
  ce: OptionLeg;
  pe: OptionLeg;
}
