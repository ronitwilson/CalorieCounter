import type {
  User,
  FoodItem,
  MealEntry,
  ServingSize,
  LinkedMember,
  SharedDay,
  Notification,
  MealSlot,
} from '../types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  users: 'ct_users',
  foodItems: 'ct_food_items',
  mealEntries: 'ct_meal_entries',
  servingSizes: 'ct_serving_sizes',
  linkedMembers: 'ct_linked_members',
  sharedDays: 'ct_shared_days',
  notifications: 'ct_notifications',
} as const;

// ─── ID Generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

// ─── Generic Storage Helpers ──────────────────────────────────────────────────

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString();

const SEED_USERS: User[] = [
  {
    userId: 'user-admin',
    email: 'admin@calorietrack.com',
    name: 'Admin User',
    role: 'admin',
    calorieGoal: 2000,
    status: 'active',
    createdAt: NOW,
  },
  {
    userId: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Smith',
    role: 'user',
    calorieGoal: 1800,
    status: 'active',
    createdAt: NOW,
  },
  {
    userId: 'user-2',
    email: 'bob@example.com',
    name: 'Bob Johnson',
    role: 'user',
    calorieGoal: 2200,
    status: 'active',
    createdAt: NOW,
  },
];

const SEED_FOOD_ITEMS: FoodItem[] = [
  // Grains
  {
    foodId: 'food-001',
    name: 'White Rice (cooked)',
    caloriesPer100g: 130,
    category: 'Grains',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-002',
    name: 'Brown Rice (cooked)',
    caloriesPer100g: 112,
    category: 'Grains',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-003',
    name: 'Whole Wheat Bread',
    caloriesPer100g: 247,
    category: 'Grains',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-004',
    name: 'Oatmeal (cooked)',
    caloriesPer100g: 71,
    category: 'Grains',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-005',
    name: 'Pasta (cooked)',
    caloriesPer100g: 158,
    category: 'Grains',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  // Protein
  {
    foodId: 'food-006',
    name: 'Chicken Breast (grilled)',
    caloriesPer100g: 165,
    category: 'Protein',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-007',
    name: 'Salmon (baked)',
    caloriesPer100g: 206,
    category: 'Protein',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-008',
    name: 'Boiled Egg',
    caloriesPer100g: 155,
    category: 'Protein',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-009',
    name: 'Lentils (cooked)',
    caloriesPer100g: 116,
    category: 'Protein',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-010',
    name: 'Canned Tuna (in water)',
    caloriesPer100g: 109,
    category: 'Protein',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  // Dairy
  {
    foodId: 'food-011',
    name: 'Whole Milk',
    caloriesPer100g: 61,
    category: 'Dairy',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-012',
    name: 'Greek Yogurt (plain)',
    caloriesPer100g: 97,
    category: 'Dairy',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-013',
    name: 'Cheddar Cheese',
    caloriesPer100g: 402,
    category: 'Dairy',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  // Vegetables
  {
    foodId: 'food-014',
    name: 'Broccoli (steamed)',
    caloriesPer100g: 35,
    category: 'Vegetables',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-015',
    name: 'Spinach (raw)',
    caloriesPer100g: 23,
    category: 'Vegetables',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-016',
    name: 'Sweet Potato (baked)',
    caloriesPer100g: 90,
    category: 'Vegetables',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-017',
    name: 'Carrot (raw)',
    caloriesPer100g: 41,
    category: 'Vegetables',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  // Fruits
  {
    foodId: 'food-018',
    name: 'Banana',
    caloriesPer100g: 89,
    category: 'Fruits',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-019',
    name: 'Apple',
    caloriesPer100g: 52,
    category: 'Fruits',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-020',
    name: 'Blueberries',
    caloriesPer100g: 57,
    category: 'Fruits',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-021',
    name: 'Orange',
    caloriesPer100g: 47,
    category: 'Fruits',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  // Snacks
  {
    foodId: 'food-022',
    name: 'Almonds',
    caloriesPer100g: 579,
    category: 'Snacks',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-023',
    name: 'Dark Chocolate (70%)',
    caloriesPer100g: 598,
    category: 'Snacks',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-024',
    name: 'Rice Cakes (plain)',
    caloriesPer100g: 387,
    category: 'Snacks',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-025',
    name: 'Peanut Butter',
    caloriesPer100g: 588,
    category: 'Snacks',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  // Beverages
  {
    foodId: 'food-026',
    name: 'Orange Juice',
    caloriesPer100g: 45,
    category: 'Beverages',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-027',
    name: 'Coffee (black, brewed)',
    caloriesPer100g: 2,
    category: 'Beverages',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
  {
    foodId: 'food-028',
    name: 'Whole Milk Latte',
    caloriesPer100g: 54,
    category: 'Beverages',
    createdBy: 'user-admin',
    status: 'active',
    createdAt: NOW,
  },
];

const SEED_SERVING_SIZES: ServingSize[] = [
  {
    sizeId: 'ss-001',
    mealSlot: 'breakfast',
    grams: 200,
    createdBy: 'user-admin',
    createdAt: NOW,
  },
  {
    sizeId: 'ss-002',
    mealSlot: 'morning_snack',
    grams: 100,
    createdBy: 'user-admin',
    createdAt: NOW,
  },
  {
    sizeId: 'ss-003',
    mealSlot: 'lunch',
    grams: 350,
    createdBy: 'user-admin',
    createdAt: NOW,
  },
  {
    sizeId: 'ss-004',
    mealSlot: 'evening_snack',
    grams: 100,
    createdBy: 'user-admin',
    createdAt: NOW,
  },
  {
    sizeId: 'ss-005',
    mealSlot: 'dinner',
    grams: 400,
    createdBy: 'user-admin',
    createdAt: NOW,
  },
];

// ─── Initialization ───────────────────────────────────────────────────────────

function initializeIfEmpty(): void {
  if (!localStorage.getItem(KEYS.users)) {
    writeList(KEYS.users, SEED_USERS);
  }
  if (!localStorage.getItem(KEYS.foodItems)) {
    writeList(KEYS.foodItems, SEED_FOOD_ITEMS);
  }
  if (!localStorage.getItem(KEYS.mealEntries)) {
    writeList<MealEntry>(KEYS.mealEntries, []);
  }
  if (!localStorage.getItem(KEYS.servingSizes)) {
    writeList(KEYS.servingSizes, SEED_SERVING_SIZES);
  }
  if (!localStorage.getItem(KEYS.linkedMembers)) {
    writeList<LinkedMember>(KEYS.linkedMembers, []);
  }
  if (!localStorage.getItem(KEYS.sharedDays)) {
    writeList<SharedDay>(KEYS.sharedDays, []);
  }
  if (!localStorage.getItem(KEYS.notifications)) {
    writeList<Notification>(KEYS.notifications, []);
  }
}

// Run initialization immediately when the module loads
initializeIfEmpty();

// ─── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return readList<User>(KEYS.users);
}

export function getUser(userId: string): User | undefined {
  return getUsers().find((u) => u.userId === userId);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function saveUser(user: User): void {
  const list = getUsers();
  const idx = list.findIndex((u) => u.userId === user.userId);
  if (idx >= 0) {
    list[idx] = user;
  } else {
    list.push(user);
  }
  writeList(KEYS.users, list);
}

// ─── Food Items ───────────────────────────────────────────────────────────────

export function getFoodItems(): FoodItem[] {
  return readList<FoodItem>(KEYS.foodItems);
}

export function getFoodItem(foodId: string): FoodItem | undefined {
  return getFoodItems().find((f) => f.foodId === foodId);
}

export function saveFoodItem(item: FoodItem): void {
  const list = getFoodItems();
  const idx = list.findIndex((f) => f.foodId === item.foodId);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  writeList(KEYS.foodItems, list);
}

// ─── Meal Entries ─────────────────────────────────────────────────────────────

export function getMealEntries(userId: string, date: string): MealEntry[] {
  return readList<MealEntry>(KEYS.mealEntries).filter(
    (e) => e.userId === userId && e.date === date,
  );
}

export function getMealEntry(entryId: string): MealEntry | undefined {
  return readList<MealEntry>(KEYS.mealEntries).find(
    (e) => e.entryId === entryId,
  );
}

export function saveMealEntry(entry: MealEntry): void {
  const list = readList<MealEntry>(KEYS.mealEntries);
  const idx = list.findIndex((e) => e.entryId === entry.entryId);
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }
  writeList(KEYS.mealEntries, list);
}

export function deleteMealEntryById(entryId: string): void {
  const list = readList<MealEntry>(KEYS.mealEntries).filter(
    (e) => e.entryId !== entryId,
  );
  writeList(KEYS.mealEntries, list);
}

// ─── Serving Sizes ────────────────────────────────────────────────────────────

export function getServingSizes(mealSlot?: MealSlot): ServingSize[] {
  const list = readList<ServingSize>(KEYS.servingSizes);
  if (mealSlot) {
    return list.filter((ss) => ss.mealSlot === mealSlot);
  }
  return list;
}

export function saveServingSize(ss: ServingSize): void {
  const list = readList<ServingSize>(KEYS.servingSizes);
  const idx = list.findIndex((s) => s.sizeId === ss.sizeId);
  if (idx >= 0) {
    list[idx] = ss;
  } else {
    list.push(ss);
  }
  writeList(KEYS.servingSizes, list);
}

export function deleteServingSizeById(sizeId: string): void {
  const list = readList<ServingSize>(KEYS.servingSizes).filter(
    (s) => s.sizeId !== sizeId,
  );
  writeList(KEYS.servingSizes, list);
}

// ─── Linked Members ───────────────────────────────────────────────────────────

export function getLinkedMembers(ownerId: string): LinkedMember[] {
  return readList<LinkedMember>(KEYS.linkedMembers).filter(
    (lm) => lm.ownerId === ownerId,
  );
}

export function saveLinkedMember(lm: LinkedMember): void {
  const list = readList<LinkedMember>(KEYS.linkedMembers);
  const idx = list.findIndex((l) => l.linkId === lm.linkId);
  if (idx >= 0) {
    list[idx] = lm;
  } else {
    list.push(lm);
  }
  writeList(KEYS.linkedMembers, list);
}

export function deleteLinkedMemberById(linkId: string): void {
  const list = readList<LinkedMember>(KEYS.linkedMembers).filter(
    (l) => l.linkId !== linkId,
  );
  writeList(KEYS.linkedMembers, list);
}

// ─── Shared Days ──────────────────────────────────────────────────────────────

export function getSharedDays(): SharedDay[] {
  return readList<SharedDay>(KEYS.sharedDays);
}

export function getSharedDayById(shareId: string): SharedDay | undefined {
  return getSharedDays().find((sd) => sd.shareId === shareId);
}

export function getSharedDayByToken(token: string): SharedDay | undefined {
  return getSharedDays().find((sd) => sd.token === token);
}

export function saveSharedDay(sd: SharedDay): void {
  const list = getSharedDays();
  const idx = list.findIndex((s) => s.shareId === sd.shareId);
  if (idx >= 0) {
    list[idx] = sd;
  } else {
    list.push(sd);
  }
  writeList(KEYS.sharedDays, list);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getNotifications(userId: string): Notification[] {
  return readList<Notification>(KEYS.notifications)
    .filter((n) => n.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function saveNotification(n: Notification): void {
  const list = readList<Notification>(KEYS.notifications);
  const idx = list.findIndex((x) => x.notifId === n.notifId);
  if (idx >= 0) {
    list[idx] = n;
  } else {
    list.push(n);
  }
  writeList(KEYS.notifications, list);
}

export function markNotificationReadById(notifId: string): void {
  const list = readList<Notification>(KEYS.notifications);
  const idx = list.findIndex((n) => n.notifId === notifId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], read: true };
    writeList(KEYS.notifications, list);
  }
}

export function markAllNotificationsReadForUser(userId: string): void {
  const list = readList<Notification>(KEYS.notifications).map((n) =>
    n.userId === userId ? { ...n, read: true } : n,
  );
  writeList(KEYS.notifications, list);
}

// ─── Re-export generateId for consumers ──────────────────────────────────────
export { generateId as newId };
