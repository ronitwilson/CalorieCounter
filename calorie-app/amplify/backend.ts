import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { createUser } from './functions/createUser/resource';

export const backend = defineBackend({ auth, data, createUser });

// ─── Grant Lambda permissions ──────────────────────────────────────────────────

const userProfileTable = backend.data.resources.tables['UserProfile'];
const lambda = backend.createUser.resources.lambda as LambdaFunction;

// Cognito admin operations (create user, manage groups, enable/disable)
lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cognito-idp:AdminCreateUser',
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminRemoveUserFromGroup',
      'cognito-idp:AdminDisableUser',
      'cognito-idp:AdminEnableUser',
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

// DynamoDB read/write for UserProfile table
userProfileTable.grantReadWriteData(lambda);

// Inject environment variables
lambda.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);
lambda.addEnvironment('USERPROFILE_TABLE_NAME', userProfileTable.tableName);
