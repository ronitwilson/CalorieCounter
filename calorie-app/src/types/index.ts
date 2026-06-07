// ─── Enumerations ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user';

export type UserStatus = 'active' | 'inactive';

export type FoodCategory =
  | 'Grains'
  | 'Protein'
  | 'Dairy'
  | 'Vegetables'
  | 'Fruits'
  | 'Snacks'
  | 'Beverages';

export type FoodStatus = 'active' | 'deleted';

export type MealSlot =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'evening_snack'
  | 'dinner';

export type ShareMethod = 'link' | 'inapp';

export type ShareStatus = 'active' | 'revoked';

export type NotificationType =
  | 'share_received'
  | 'share_viewed'
  | 'member_linked';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  calorieGoal: number;
  status: UserStatus;
  invitedBy?: string;
  createdAt: string; // ISO 8601
}

export interface FoodItem {
  foodId: string;
  name: string;
  caloriesPer100g: number;
  category: FoodCategory;
  createdBy: string; // userId of creator
  status: FoodStatus;
  createdAt: string; // ISO 8601
}

export interface MealEntry {
  entryId: string;
  userId: string;       // the person whose meal it belongs to
  date: string;         // YYYY-MM-DD
  mealSlot: MealSlot;
  foodId: string;
  foodName: string;
  caloriesPer100g: number;
  grams: number;
  calories: number;     // pre-calculated: round((caloriesPer100g / 100) * grams)
  loggedBy: string;     // userId who created this entry (may differ for proxy)
  createdAt: string;    // ISO 8601
}

export interface ServingSize {
  sizeId: string;
  mealSlot: MealSlot;
  grams: number;
  createdBy: string; // userId
  createdAt: string; // ISO 8601
}

export interface LinkedMember {
  linkId: string;
  ownerId: string;    // the primary account that owns the relationship
  memberId: string;   // the user being proxy-logged for
  memberName: string; // denormalized for display
  linkedAt: string;   // ISO 8601
  linkedBy: string;   // userId who created the link (usually admin)
}

export interface SharedDay {
  shareId: string;
  token: string;                  // UUID token for link-based sharing
  sharedByUserId: string;
  sharedByName: string;           // denormalized
  date: string;                   // YYYY-MM-DD
  method: ShareMethod;
  recipientUserId?: string;       // set for inapp shares
  status: ShareStatus;
  expiresAt: string;              // ISO 8601
  createdAt: string;              // ISO 8601
}

export interface Notification {
  notifId: string;
  userId: string;         // recipient
  type: NotificationType;
  fromUserId: string;
  fromUserName: string;   // denormalized
  shareId?: string;       // for share_received / share_viewed
  read: boolean;
  createdAt: string;      // ISO 8601
}

// ─── Summary / Report Types ───────────────────────────────────────────────────

export interface MealSlotSummary {
  mealSlot: MealSlot;
  totalCalories: number;
  entries: MealEntry[];
}

export interface DailySummary {
  userId: string;
  date: string;           // YYYY-MM-DD
  calorieGoal: number;
  totalCalories: number;
  remaining: number;      // calorieGoal - totalCalories (can be negative)
  percentOfGoal: number;  // (totalCalories / calorieGoal) * 100, rounded to 1 dp
  byMealSlot: MealSlotSummary[];
}

export interface DayTotals {
  date: string;           // YYYY-MM-DD
  totalCalories: number;
  calorieGoal: number;
  withinGoal: boolean;
}

export interface WeeklySummary {
  userId: string;
  startDate: string;      // YYYY-MM-DD  (Monday)
  endDate: string;        // YYYY-MM-DD  (Sunday)
  days: DayTotals[];
  averageCalories: number;
  totalCalories: number;
  calorieGoal: number;
  daysWithinGoal: number;
}

export interface MonthlySummary {
  userId: string;
  year: number;
  month: number;          // 1-12
  days: DayTotals[];
  averageCalories: number;
  totalCalories: number;
  calorieGoal: number;
  daysWithinGoal: number;
  daysLogged: number;     // days where at least one entry exists
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MEAL_SLOTS: MealSlot[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'evening_snack',
  'dinner',
];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  evening_snack: 'Evening Snack',
  dinner: 'Dinner',
};
