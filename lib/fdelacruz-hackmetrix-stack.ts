import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { assert } from 'console';

export class FdelacruzHackmetrixStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Base name template
    let baseName = 'AwsCdk';

    // Define a queue for notifications
    const myQueue = new sqs.Queue(this, baseName + 'Queue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    // Define a topic for notifications
    const myTopic = new sns.Topic(this, baseName + 'Topic');

    // Add topic to queue for notifications
    myTopic.addSubscription(new subs.SqsSubscription(myQueue));

    // Define a role for lambda
    const myRole = new iam.Role(this, baseName + 'LambdaRole', {
      roleName: baseName + 'LambdaRole',
      description: baseName + 'LambdaRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    ]
    });

    // Define a lambda function
    const myLambda = new lambda.Function(this, baseName + 'Lambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(300),
      functionName: baseName + 'Lambda',
      handler: 'mylambda.handler',
      memorySize: 1024,
      role: myRole
    });

    // Define a API gateway for handle request
    new apigw.LambdaRestApi(this, baseName + 'API', {
      handler: myLambda
      // handler: myLambdaCounter.handler
    });

    // Define a KMS for encryptation
    const myKmsKey = new kms.Key(this, baseName + 'KMS');

    // Define a S3 bucket for save JSON files
    const myBucket = new s3.Bucket(this, baseName + 'S3', {
      versioned: true,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: myKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    assert(myBucket.encryptionKey === myKmsKey);

    // Allow lambda read and write in the S3 bucket
    // myBucket.grantReadWrite(myLambda);

    // Add repository for CDK code
    new codecommit.Repository(this, baseName + 'Repo', {
      repositoryName: baseName + 'Repo',
      description: 'Repository for ' + baseName + ' code',
    });

  }
}
