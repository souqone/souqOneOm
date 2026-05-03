export enum PaymentType {
  FEATURED = 'FEATURED',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface IPayment {
  id: string;
  userId: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  sessionId?: string | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  featuredListings: number;
  listingsPerMonth: number;
}
