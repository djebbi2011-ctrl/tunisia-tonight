// ============================================================
// Tunisia Tonight — Types TypeScript partagés
// ============================================================

export type Role = 'CLIENT' | 'HOTELIER' | 'ADMIN' | 'SUPER_ADMIN';

export type MealPlan = 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD' | 'ALL_INCLUSIVE';

export const MEAL_PLAN_LABELS: Record<MealPlan, string> = {
  ROOM_ONLY:    'Sans repas',
  BREAKFAST:    'Petit-déjeuner inclus',
  HALF_BOARD:   'Demi-pension',
  FULL_BOARD:   'Pension complète',
  ALL_INCLUSIVE:'Tout inclus',
};

export type ReservationStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'VALIDATED'
  | 'REFUSED'
  | 'CANCELLED'
  | 'COMPLETED';

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  PAID:            'Commission payée — En attente hôtel',
  VALIDATED:       'Confirmé par l\'hôtel',
  REFUSED:         'Refusé par l\'hôtel',
  CANCELLED:       'Annulé',
  COMPLETED:       'Séjour terminé',
};

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface Hotel {
  id: string;
  name: string;
  stars: number;
  city: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities: string[];
  photos: string[];
  isActive: boolean;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  capacity: number;
  bedType?: string;
  viewType?: string;
  photos: string[];
  amenities: string[];
}

export interface SearchResult {
  id: string;
  name: string;
  stars: number;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities: string[];
  photos: string[];
  cheapestRate: {
    roomTypeId: string;
    name: string;
    basePriceTnd: number;
    totalTnd: number;
    commissionTnd: number;
    commissionPct: number;
    mealPlan: MealPlan;
    minStay: number;
  };
  availableRooms: SearchResult['cheapestRate'][];
  nights: number;
}

export interface SearchParams {
  city: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  stars?: number;
  maxPriceTnd?: number;
  mealPlan?: MealPlan;
}

export interface Reservation {
  id: string;
  reference: string;
  checkin: string;
  checkout: string;
  nights: number;
  adults: number;
  children: number;
  mealPlan: MealPlan;
  status: ReservationStatus;
  contractPriceTnd: number;
  commissionTnd: number;
  totalTnd: number;
  specialRequests?: string;
  hotel?: Pick<Hotel, 'name' | 'city' | 'photos'>;
  roomType?: Pick<RoomType, 'name' | 'viewType'>;
  discount?: {
    discountPct: number;
    discountTnd: number;
    netPriceTnd: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
