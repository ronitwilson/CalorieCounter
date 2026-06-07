/**
 * Amplify AppSync data layer.
 * Mirrors the synchronous db.ts API but all functions are async.
 * Uses Amplify's model client API; types come from types/index.ts.
 */

import { generateClient } from 'aws-amplify/api';
import type {
  User,
  FoodItem,
  MealEntry,
  ServingSize,
  LinkedMember,
  SharedDay,
  Notification,
  UserRole,
  UserStatus,
  FoodCategory,
  FoodStatus,
  MealSlot,
  ShareMethod,
  ShareStatus,
  NotificationType,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = generateClient<any>();

// ─── ID Generation ────────────────────────────────────────────────────────────

export function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
export { generateId as newId };

// ─── Mapping helpers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUser(item: any): User {
  return {
    userId: item.userId,
    email: item.email,
    name: item.name,
    role: item.role as UserRole,
    calorieGoal: item.calorieGoal,
    status: item.status as UserStatus,
    invitedBy: item.invitedBy ?? undefined,
    createdAt: item.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFoodItem(item: any): FoodItem {
  return {
    foodId: item.foodId,
    name: item.name,
    caloriesPer100g: item.caloriesPer100g,
    category: item.category as FoodCategory,
    createdBy: item.createdBy,
    status: item.status as FoodStatus,
    createdAt: item.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMealEntry(item: any): MealEntry {
  return {
    entryId: item.entryId,
    userId: item.userId,
    date: item.date,
    mealSlot: item.mealSlot as MealSlot,
    foodId: item.foodId,
    foodName: item.foodName,
    caloriesPer100g: item.caloriesPer100g,
    grams: item.grams,
    calories: item.calories,
    loggedBy: item.loggedBy,
    createdAt: item.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toServingSize(item: any): ServingSize {
  return {
    sizeId: item.sizeId,
    mealSlot: item.mealSlot as MealSlot,
    grams: item.grams,
    createdBy: item.createdBy,
    createdAt: item.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLinkedMember(item: any): LinkedMember {
  return {
    linkId: item.linkId,
    ownerId: item.ownerId,
    memberId: item.memberId,
    memberName: item.memberName,
    linkedAt: item.createdAt,
    linkedBy: item.linkedBy,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSharedDay(item: any): SharedDay {
  return {
    shareId: item.shareId,
    token: item.token,
    sharedByUserId: item.sharedByUserId,
    sharedByName: item.sharedByName,
    date: item.date,
    method: item.method as ShareMethod,
    recipientUserId: item.recipientUserId ?? undefined,
    status: item.status as ShareStatus,
    expiresAt: item.expiresAt,
    createdAt: item.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNotification(item: any): Notification {
  return {
    notifId: item.notifId,
    userId: item.userId,
    type: item.type as NotificationType,
    fromUserId: item.fromUserId,
    fromUserName: item.fromUserName,
    shareId: item.shareId ?? undefined,
    read: item.read,
    createdAt: item.createdAt,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (client.models.UserProfile as any).list();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toUser);
}

export async function getUser(userId: string): Promise<User | undefined> {
  const { data } = await client.models.UserProfile.get({ userId });
  return data ? toUser(data) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data } = await client.models.UserProfile.getUserProfileByEmail({ email });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data as any)?.items ?? [];
  return items.length > 0 ? toUser(items[0]) : undefined;
}

/** Standard update (name, calorieGoal). For role/status changes use adminUpdate. */
export async function saveUser(user: Partial<User> & Pick<User, 'userId'>): Promise<User> {
  const { data } = await client.models.UserProfile.update({
    userId: user.userId,
    ...(user.name !== undefined && { name: user.name }),
    ...(user.calorieGoal !== undefined && { calorieGoal: user.calorieGoal }),
    ...(user.role !== undefined && { role: user.role }),
    ...(user.status !== undefined && { status: user.status }),
  });
  return toUser(data);
}

/** Admin-only: invite a new user (creates Cognito user + DDB record via Lambda). */
export async function adminCreateUser(input: {
  email: string;
  name: string;
  role: UserRole;
  calorieGoal: number;
  invitedBy?: string;
}): Promise<User> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await client.mutations.adminCreateUser(input)) as { data: any };
  return toUser(data);
}

/** Admin-only: update user role (updates Cognito group + DDB via Lambda). */
export async function adminUpdateUserRole(userId: string, role: UserRole): Promise<User> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await client.mutations.adminUpdateUserRole({ userId, role })) as { data: any };
  return toUser(data);
}

/** Admin-only: activate / deactivate user (Cognito + DDB via Lambda). */
export async function adminSetUserStatus(userId: string, status: UserStatus): Promise<User> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await client.mutations.adminSetUserStatus({ userId, status })) as { data: any };
  return toUser(data);
}

// ─── Food Items ───────────────────────────────────────────────────────────────

export async function getFoodItems(): Promise<FoodItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (client.models.FoodItem as any).list();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toFoodItem);
}

export async function getFoodItem(foodId: string): Promise<FoodItem | undefined> {
  const { data } = await client.models.FoodItem.get({ foodId });
  return data ? toFoodItem(data) : undefined;
}

export async function saveFoodItem(item: FoodItem): Promise<FoodItem> {
  const existing = await getFoodItem(item.foodId);
  if (existing) {
    const { data } = await client.models.FoodItem.update({
      foodId: item.foodId,
      name: item.name,
      caloriesPer100g: item.caloriesPer100g,
      category: item.category,
      status: item.status,
    });
    return toFoodItem(data);
  }
  const { data } = await client.models.FoodItem.create({
    foodId: item.foodId,
    name: item.name,
    caloriesPer100g: item.caloriesPer100g,
    category: item.category,
    createdBy: item.createdBy,
    status: item.status,
  });
  return toFoodItem(data);
}

// ─── Meal Entries ─────────────────────────────────────────────────────────────

export async function getMealEntries(userId: string, date: string): Promise<MealEntry[]> {
  const { data } = await client.models.MealEntry.listMealEntriesByUserAndDate({
    userId,
    date: { eq: date },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any)?.items ?? (data as any[]) ?? []).map(toMealEntry);
}

/** Fetch all entries for a user within a date range (inclusive). */
export async function getMealEntriesRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<MealEntry[]> {
  const { data } = await client.models.MealEntry.listMealEntriesByUserAndDate({
    userId,
    date: { between: [startDate, endDate] },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any)?.items ?? (data as any[]) ?? []).map(toMealEntry);
}

export async function saveMealEntry(entry: MealEntry): Promise<MealEntry> {
  const existing = await client.models.MealEntry.get({ entryId: entry.entryId });
  if (existing.data) {
    const { data } = await client.models.MealEntry.update({
      entryId: entry.entryId,
      grams: entry.grams,
      calories: entry.calories,
      mealSlot: entry.mealSlot,
    });
    return toMealEntry(data);
  }
  const { data } = await client.models.MealEntry.create({
    entryId: entry.entryId,
    userId: entry.userId,
    date: entry.date,
    mealSlot: entry.mealSlot,
    foodId: entry.foodId,
    foodName: entry.foodName,
    caloriesPer100g: entry.caloriesPer100g,
    grams: entry.grams,
    calories: entry.calories,
    loggedBy: entry.loggedBy,
  });
  return toMealEntry(data);
}

export async function deleteMealEntryById(entryId: string): Promise<void> {
  await client.models.MealEntry.delete({ entryId });
}

// ─── Serving Sizes ────────────────────────────────────────────────────────────

export async function getServingSizes(mealSlot?: MealSlot): Promise<ServingSize[]> {
  if (mealSlot) {
    const { data } = await client.models.ServingSize.listServingSizesByMealSlot({ mealSlot });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.items ?? (data as any[]) ?? []).map(toServingSize);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (client.models.ServingSize as any).list();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(toServingSize);
}

export async function saveServingSize(ss: ServingSize): Promise<ServingSize> {
  const { data } = await client.models.ServingSize.create({
    sizeId: ss.sizeId,
    mealSlot: ss.mealSlot,
    grams: ss.grams,
    createdBy: ss.createdBy,
  });
  return toServingSize(data);
}

export async function deleteServingSizeById(sizeId: string): Promise<void> {
  await client.models.ServingSize.delete({ sizeId });
}

// ─── Linked Members ───────────────────────────────────────────────────────────

export async function getLinkedMembers(ownerId: string): Promise<LinkedMember[]> {
  const { data } = await client.models.LinkedMember.listLinkedMembersByOwner({ ownerId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any)?.items ?? (data as any[]) ?? []).map(toLinkedMember);
}

export async function saveLinkedMember(lm: LinkedMember): Promise<LinkedMember> {
  const { data } = await client.models.LinkedMember.create({
    linkId: lm.linkId,
    ownerId: lm.ownerId,
    memberId: lm.memberId,
    memberName: lm.memberName,
    linkedBy: lm.linkedBy,
  });
  return toLinkedMember(data);
}

export async function deleteLinkedMemberById(linkId: string): Promise<void> {
  await client.models.LinkedMember.delete({ linkId });
}

// ─── Shared Days ──────────────────────────────────────────────────────────────

export async function getSharedDayByToken(token: string): Promise<SharedDay | undefined> {
  const { data } = await client.models.SharedDay.getSharedDayByToken({ token });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data as any)?.items ?? (data as any[]) ?? [];
  return items.length > 0 ? toSharedDay(items[0]) : undefined;
}

export async function getSharedDayById(shareId: string): Promise<SharedDay | undefined> {
  const { data } = await client.models.SharedDay.get({ shareId });
  return data ? toSharedDay(data) : undefined;
}

export async function getSharedDaysByUser(userId: string): Promise<SharedDay[]> {
  const { data } = await client.models.SharedDay.listSharedDaysByUser({ sharedByUserId: userId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any)?.items ?? (data as any[]) ?? []).map(toSharedDay);
}

export async function saveSharedDay(sd: SharedDay): Promise<SharedDay> {
  const existing = await getSharedDayById(sd.shareId);
  if (existing) {
    const { data } = await client.models.SharedDay.update({
      shareId: sd.shareId,
      status: sd.status,
    });
    return toSharedDay(data);
  }
  const { data } = await client.models.SharedDay.create({
    shareId: sd.shareId,
    token: sd.token,
    sharedByUserId: sd.sharedByUserId,
    sharedByName: sd.sharedByName,
    date: sd.date,
    method: sd.method,
    ...(sd.recipientUserId && { recipientUserId: sd.recipientUserId }),
    status: sd.status,
    expiresAt: sd.expiresAt,
  });
  return toSharedDay(data);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await client.models.Notification.listNotificationsByUser({ userId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: Notification[] = ((data as any)?.items ?? (data as any[]) ?? []).map(toNotification);
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function saveNotification(n: Notification): Promise<Notification> {
  const { data } = await client.models.Notification.create({
    notifId: n.notifId,
    userId: n.userId,
    type: n.type,
    fromUserId: n.fromUserId,
    fromUserName: n.fromUserName,
    ...(n.shareId && { shareId: n.shareId }),
    read: n.read,
  });
  return toNotification(data);
}

export async function markNotificationReadById(notifId: string): Promise<void> {
  await client.models.Notification.update({ notifId, read: true });
}

export async function markAllNotificationsReadForUser(userId: string): Promise<void> {
  const notifications = await getNotifications(userId);
  await Promise.all(
    notifications
      .filter((n) => !n.read)
      .map((n) => client.models.Notification.update({ notifId: n.notifId, read: true })),
  );
}
