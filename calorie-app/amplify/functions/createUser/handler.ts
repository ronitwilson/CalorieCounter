import type { AppSyncResolverHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  type AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const cognito = new CognitoIdentityProviderClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const USER_POOL_ID = process.env.USER_POOL_ID!;
const TABLE_NAME = process.env.USERPROFILE_TABLE_NAME!;

type Args =
  | { __operation: 'adminCreateUser'; email: string; name: string; role: string; calorieGoal: number; invitedBy?: string }
  | { __operation: 'adminUpdateUserRole'; userId: string; role: string }
  | { __operation: 'adminSetUserStatus'; userId: string; status: string };

export const handler: AppSyncResolverHandler<Record<string, unknown>, unknown> = async (event) => {
  const fieldName = event.info.fieldName as string;
  const args = event.arguments as Record<string, unknown>;

  if (fieldName === 'adminCreateUser') {
    return handleCreateUser(args as { email: string; name: string; role: string; calorieGoal: number; invitedBy?: string });
  }
  if (fieldName === 'adminUpdateUserRole') {
    return handleUpdateRole(args as { userId: string; role: string });
  }
  if (fieldName === 'adminSetUserStatus') {
    return handleSetStatus(args as { userId: string; status: string });
  }
  throw new Error(`Unknown field: ${fieldName}`);
};

async function handleCreateUser(args: { email: string; name: string; role: string; calorieGoal: number; invitedBy?: string }) {
  const { email, name, role, calorieGoal, invitedBy } = args;

  // 1. Create Cognito user — sends temp password email via SES
  const result = await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name },
      ],
      DesiredDeliveryMediums: ['EMAIL'],
    }),
  );

  const userId = result.User!.Attributes!.find((a: AttributeType) => a.Name === 'sub')!.Value!;

  // 2. Add to Cognito group
  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      GroupName: role === 'admin' ? 'admin' : 'user',
    }),
  );

  // 3. Write DynamoDB UserProfile record
  const now = new Date().toISOString();
  const profile = {
    userId,
    email,
    name,
    role,
    calorieGoal,
    status: 'active',
    invitedBy: invitedBy ?? null,
    createdAt: now,
    updatedAt: now,
    __typename: 'UserProfile',
  };

  await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: profile }));
  return profile;
}

async function handleUpdateRole(args: { userId: string; role: string }) {
  const { userId, role } = args;

  // Get the user's email from DynamoDB to use as Cognito username
  const getResult = await dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { userId } }));
  const profile = getResult.Item;
  if (!profile) throw new Error('User not found');

  // Update Cognito group: remove from old group, add to new group
  const oldGroup = profile.role === 'admin' ? 'admin' : 'user';
  const newGroup = role === 'admin' ? 'admin' : 'user';

  if (oldGroup !== newGroup) {
    const { AdminRemoveUserFromGroupCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    await cognito.send(
      new AdminRemoveUserFromGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: profile.email,
        GroupName: oldGroup,
      }),
    );
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: profile.email,
        GroupName: newGroup,
      }),
    );
  }

  // Update DynamoDB
  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: 'SET #r = :role, updatedAt = :now',
      ExpressionAttributeNames: { '#r': 'role' },
      ExpressionAttributeValues: { ':role': role, ':now': now },
    }),
  );

  return { ...profile, role, updatedAt: now };
}

async function handleSetStatus(args: { userId: string; status: string }) {
  const { userId, status } = args;

  const getResult = await dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { userId } }));
  const profile = getResult.Item;
  if (!profile) throw new Error('User not found');

  // Disable/enable in Cognito
  if (status === 'inactive') {
    await cognito.send(
      new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: profile.email }),
    );
  } else {
    await cognito.send(
      new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: profile.email }),
    );
  }

  // Update DynamoDB
  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: 'SET #s = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':status': status, ':now': now },
    }),
  );

  return { ...profile, status, updatedAt: now };
}
