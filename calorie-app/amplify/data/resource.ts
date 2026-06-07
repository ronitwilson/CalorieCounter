import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { createUser } from '../functions/createUser/resource';

const schema = a.schema({
  // ─── Enums ──────────────────────────────────────────────────────────────────

  UserRole: a.enum(['admin', 'user']),
  UserStatus: a.enum(['active', 'inactive']),
  FoodCategory: a.enum([
    'Grains',
    'Protein',
    'Dairy',
    'Vegetables',
    'Fruits',
    'Snacks',
    'Beverages',
  ]),
  FoodStatus: a.enum(['active', 'deleted']),
  MealSlot: a.enum([
    'breakfast',
    'morning_snack',
    'lunch',
    'evening_snack',
    'dinner',
  ]),
  ShareMethod: a.enum(['link', 'inapp']),
  ShareStatus: a.enum(['active', 'revoked']),
  NotificationType: a.enum(['share_received', 'share_viewed', 'member_linked']),

  // ─── Models ─────────────────────────────────────────────────────────────────

  // User profile stored in DynamoDB (Cognito handles identity).
  // userId = Cognito sub — set externally, never auto-generated.
  UserProfile: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      name: a.string().required(),
      role: a.ref('UserRole').required(),
      calorieGoal: a.integer().required(),
      status: a.ref('UserStatus').required(),
      invitedBy: a.string(),
    })
    .identifier(['userId'])
    .secondaryIndexes((index) => [
      index('email').queryField('getUserProfileByEmail'),
    ])
    .authorization((allow) => [
      allow.groups(['admin']),
      // Each user can read and update their own profile
      allow.authenticated().to(['read', 'update']),
    ]),

  FoodItem: a
    .model({
      foodId: a.string().required(),
      name: a.string().required(),
      caloriesPer100g: a.integer().required(),
      category: a.ref('FoodCategory').required(),
      createdBy: a.string().required(),
      status: a.ref('FoodStatus').required(),
    })
    .identifier(['foodId'])
    .authorization((allow) => [
      allow.groups(['admin']),
      allow.authenticated().to(['read']),
    ]),

  MealEntry: a
    .model({
      entryId: a.string().required(),
      userId: a.string().required(),
      date: a.string().required(),   // YYYY-MM-DD
      mealSlot: a.ref('MealSlot').required(),
      foodId: a.string().required(),
      foodName: a.string().required(),
      caloriesPer100g: a.integer().required(),
      grams: a.integer().required(),
      calories: a.integer().required(),
      loggedBy: a.string().required(),
    })
    .identifier(['entryId'])
    .secondaryIndexes((index) => [
      // Query all entries for a user on a specific date (or date prefix)
      index('userId').sortKeys(['date']).queryField('listMealEntriesByUserAndDate'),
    ])
    .authorization((allow) => [
      allow.groups(['admin']),
      allow.authenticated(),
    ]),

  ServingSize: a
    .model({
      sizeId: a.string().required(),
      mealSlot: a.ref('MealSlot').required(),
      grams: a.integer().required(),
      createdBy: a.string().required(),
    })
    .identifier(['sizeId'])
    .secondaryIndexes((index) => [
      index('mealSlot').queryField('listServingSizesByMealSlot'),
    ])
    .authorization((allow) => [
      allow.groups(['admin']),
      allow.authenticated().to(['read']),
    ]),

  LinkedMember: a
    .model({
      linkId: a.string().required(),
      ownerId: a.string().required(),
      memberId: a.string().required(),
      memberName: a.string().required(),
      linkedBy: a.string().required(),
    })
    .identifier(['linkId'])
    .secondaryIndexes((index) => [
      index('ownerId').queryField('listLinkedMembersByOwner'),
    ])
    .authorization((allow) => [
      allow.groups(['admin']),
      allow.authenticated().to(['read']),
    ]),

  SharedDay: a
    .model({
      shareId: a.string().required(),
      token: a.string().required(),
      sharedByUserId: a.string().required(),
      sharedByName: a.string().required(),
      date: a.string().required(),   // YYYY-MM-DD
      method: a.ref('ShareMethod').required(),
      recipientUserId: a.string(),
      status: a.ref('ShareStatus').required(),
      expiresAt: a.string().required(),
    })
    .identifier(['shareId'])
    .secondaryIndexes((index) => [
      index('token').queryField('getSharedDayByToken'),
      index('sharedByUserId').queryField('listSharedDaysByUser'),
    ])
    .authorization((allow) => [
      allow.groups(['admin']),
      allow.authenticated(),
    ]),

  Notification: a
    .model({
      notifId: a.string().required(),
      userId: a.string().required(),
      type: a.ref('NotificationType').required(),
      fromUserId: a.string().required(),
      fromUserName: a.string().required(),
      shareId: a.string(),
      read: a.boolean().required(),
    })
    .identifier(['notifId'])
    .secondaryIndexes((index) => [
      index('userId').queryField('listNotificationsByUser'),
    ])
    .authorization((allow) => [
      allow.groups(['admin']),
      allow.authenticated(),
    ]),

  // ─── Custom mutations ────────────────────────────────────────────────────────

  // Admin invite flow: creates Cognito user + DynamoDB UserProfile record.
  adminCreateUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      name: a.string().required(),
      role: a.ref('UserRole').required(),
      calorieGoal: a.integer().required(),
      invitedBy: a.string(),
    })
    .returns(a.ref('UserProfile'))
    .authorization((allow) => [allow.groups(['admin'])])
    .handler(a.handler.function(createUser)),

  // Update user role (also updates Cognito group membership).
  adminUpdateUserRole: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      role: a.ref('UserRole').required(),
    })
    .returns(a.ref('UserProfile'))
    .authorization((allow) => [allow.groups(['admin'])])
    .handler(a.handler.function(createUser)),

  // Deactivate / reactivate user (also disables/enables Cognito user).
  adminSetUserStatus: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      status: a.ref('UserStatus').required(),
    })
    .returns(a.ref('UserProfile'))
    .authorization((allow) => [allow.groups(['admin'])])
    .handler(a.handler.function(createUser)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
