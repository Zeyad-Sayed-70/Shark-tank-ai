export interface SharkDto {
  id: string;
  name: string;
  netWorth: string;
  industries: string[];
  totalDeals: number;
  avatar?: string;
  bio?: string;
}

export interface SharkDealDto {
  company: string;
  entrepreneur: string;
  dealAmount: number;
  dealEquity: number;
  valuation: number;
  season: number;
  episode: number;
  industry?: string;
}
