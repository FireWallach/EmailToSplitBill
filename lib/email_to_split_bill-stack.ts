import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { Function, Runtime, Code, LayerVersion } from "aws-cdk-lib/aws-lambda";
import path = require("path");
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

export class EmailToSplitBillStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Declarations
    const splitwiseLayer = new LayerVersion(this, "SplitwiseLayer", {
      code: Code.fromAsset(path.join(__dirname, "/lambda-layer")),
      compatibleRuntimes: [Runtime.NODEJS_16_X],
    });

    const emailLayer = new LayerVersion(this, "EmailLayer", {
      code: Code.fromAsset(path.join(__dirname, "email-layer")),
      compatibleRuntimes: [Runtime.NODEJS_16_X],
    });

    const splitwiseSecret = new secretsmanager.Secret(
      this,
      "SplitwiseSecrets",
      {
        secretName: "SplitwiseAPIValues",
      }
    );

    const handleEmailLambda: Function = new Function(this, "handleEmail", {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(path.join(__dirname, "../deploy")),
      handler: "handleEmail.handler",
      layers: [splitwiseLayer],
      timeout: cdk.Duration.seconds(30),
      environment: {
        SPLITWISE_SECRET_ARN: splitwiseSecret.secretArn,
      },
    });

    const checkForBillLambda: Function = new Function(this, "checkForBill", {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset(path.join(__dirname, "../deploy")),
      handler: "checkForBill.handler",
      layers: [emailLayer],
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        SPLITWISE_SECRET_ARN: splitwiseSecret.secretArn,
        HANDLE_EMAIL_LAMBDA_ARN: handleEmailLambda.functionArn,
      },
    });

    // Grant Permissions
    splitwiseSecret.grantRead(handleEmailLambda);
    splitwiseSecret.grantRead(checkForBillLambda);

    const lambdaInvokedPolicy = new iam.PolicyStatement({
      actions: ["lambda:InvokeFunction"],
      resources: [handleEmailLambda.functionArn],
    });

    checkForBillLambda.addToRolePolicy(lambdaInvokedPolicy);

    // Schedule
    const checkEmailRule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
    });

    checkEmailRule.addTarget(new targets.LambdaFunction(checkForBillLambda));
  }
}
