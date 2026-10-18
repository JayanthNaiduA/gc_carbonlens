export interface User {
  uid: string;
  displayName: string;
  email: string | null;
  phoneNumber?: string | null;
  emailVerified: boolean;
  isDemo: boolean;
}

export interface ConsentPreferences {
  camera: boolean;
  location: boolean;
  healthConnect: boolean;
  microphone: boolean;
  personalization: boolean;
  acceptedAt?: string;
}

export interface ProductItem {
  product_ref: string;
  name: string;
  brand: string;
  category: 'Personal Care' | 'Home' | 'Food' | string;
  footprint: number;
  lower?: number;
  score: number;
  icon: 'brush' | 'floss' | 'bottle' | string;
  description?: string;
  imageUrl?: string;
}

export interface CarbonResultData {
  estimated: number;
  boundary: string;
  method: string;
  source: string;
  factorVersion: string;
  confidence: string;
}

export interface SustainabilityScoreData {
  score: number;
  version: string;
  dimensions: {
    carbon_intensity: number;
    reusability: number;
    packaging: number;
    recyclability: number;
    durability: number;
    [key: string]: number;
  };
}

export interface ScanResultPayload {
  scan_id: string;
  status: string;
  product_candidate: ProductItem;
  carbon: CarbonResultData;
  sustainability: SustainabilityScoreData;
  receipt_scan_id?: string;
  baseline_scans?: Record<string, string>;
}

export interface LedgerEntry {
  event_id: string;
  points_delta: number;
  entry_type: 'VESTED' | 'PROVISIONAL';
  policy_version: string;
  created_at: string;
}

export interface DashboardMetricData {
  period: 'today' | 'week' | 'month';
  green_score: number;
  walking_km: number;
  greener_purchases: number;
  avoided_kg_co2e: number;
  points_earned: number;
  wallet: {
    available_points: number;
    provisional_points: number;
  };
  insight: string;
}

export interface PlantingProject {
  project_id: string;
  claimed_count: number;
  species: string;
  state: 'PENDING' | 'PROVISIONAL' | 'VESTED';
  location: { lat: number; lng: number };
  created_at: string;
}

export interface GreenMarketItem {
  id: string;
  product_ref?: string;
  name: string;
  brand: string;
  category: 'Personal Care' | 'Home' | 'Food' | 'Projects & Offsets' | string;
  type: 'product' | 'project';
  price: number;
  creditsReward: number;
  footprint: number;
  lower?: number;
  co2AvoidedKg: number;
  score: number;
  verificationId: string;
  verificationBadge: string;
  verificationDetails: string;
  icon: string;
  description: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  shippingInfo?: string;
  discountTag?: string;
}

export interface CartItem extends GreenMarketItem {
  quantity: number;
}

export interface OrderItemSummary {
  id: string;
  name: string;
  quantity: number;
  price: number;
  credits_reward: number;
  type: string;
}

export interface OrderRecord {
  order_id: string;
  items: OrderItemSummary[];
  total_amount: number;
  credits_earned: number;
  co2_avoided_kg: number;
  verification_status: 'VERIFIED' | 'PENDING';
  verification_hash: string;
  payment_method: string;
  created_at: string;
}
