export interface DealDto {
  company: string;
  entrepreneur: string;
  askAmount: number;
  askEquity: number;
  dealAmount: number | null;
  dealEquity: number | null;
  valuation: number;
  investors: string[];
  season: number;
  episode: number;
  dealMade: boolean;
  industry?: string;
  description?: string;
  pitchSummary?: string;
}

export interface DealSearchDto {
  query?: string;
  filters?: {
    industry?: string;
    dealMade?: boolean;
    season?: number;
    investor?: string;
    minValuation?: number;
    maxValuation?: number;
  };
  limit?: number;
  offset?: number;
}

export interface DealStatsDto {
  totalDeals: number;
  successfulDeals: number;
  averageValuation: number;
  totalInvested: number;
  topInvestor: string;
  topIndustry: string;
  dealSuccessRate: number;
}
