export type TradeDirection = "BUY" | "SELL";
export type TradeStatus = "OPEN" | "CLOSED";
export type TradeSession = "London" | "New York" | "Asian";
export type TradeEmotion = "Disciplined" | "Confident" | "Anxious" | "Greedy" | "FOMO" | "Frustrated";
export type TradeMistake = 
  | "None" 
  | "Chased Entry" 
  | "Moved Stop Loss" 
  | "Overleveraged" 
  | "Revenge Trade" 
  | "Exited Early" 
  | "Ignored Invalidation";

export interface Trade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  volume: number; // lots
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number; // In dollars
  netProfit?: number;
  commission?: number;
  swap?: number;
  rMultiple: number; // e.g. 2.5 for +2.5R, -1.0 for -1R
  pnlPercentage?: number;
  openTime: string; // ISO string
  closeTime: string; // ISO string
  status: TradeStatus;
  session: TradeSession;
  setup: string;
  rulesFollowed: boolean;
  emotion: TradeEmotion;
  mistake?: TradeMistake;
  notes?: string;
  postReview?: string;
  screenshotUrl?: string;
  confidence?: number; // 0 to 1 for AI imports
}

export interface TradeFilter {
  search: string;
  outcome: "ALL" | "WIN" | "LOSS" | "BREAKEVEN";
  direction: "ALL" | "BUY" | "SELL";
  session: "ALL" | TradeSession;
  setup: string;
  rulesOnly: boolean;
  dateRange: "ALL" | "TODAY" | "WEEK" | "MONTH";
}
