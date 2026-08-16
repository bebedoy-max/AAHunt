export interface Provider {
  id: number;
  name: string;
  logo_url: string | null;
  website_url: string;
  description: string | null;
  free_credit_amount: string | null;
  credit_type: string | null;
  has_kling: boolean;
  kling_detail: string | null;
  category: string;
  requires_credit_card: boolean;
  expiry_days: number | null;
  status: string;
  entity_type: string;
  quality_score: number;
  last_verified_at: string | null;
  source_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchJob {
  id: number;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  providers_found: number | null;
  providers_updated: number | null;
  codes_found: number | null;
  progress: number;
  error_message: string | null;
  log: string | null;
  targets: string | null;
}

export interface ProvidersSummary {
  total: number;
  kling: number;
  active: number;
  noCreditCard: number;
}
