import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { Function, Runtime, Code, LayerVersion } from "aws-cdk-lib/aws-lambda";
import { LambdaRestApi, RequestValidator } from "aws-cdk-lib/aws-apigateway";
import path = require("path");

export class EmailToSplitBillStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Declarations
    const splitwiseLayer = new LayerVersion(this, "SplitwiseLayer", {
      code: Code.fromAsset(path.join(__dirname, "/lambda-layer")),
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
      environment: {
        SPLITWISE_SECRET_ARN: splitwiseSecret.secretArn,
      },
    });

    const handleEmailAPI: LambdaRestApi = new LambdaRestApi(
      this,
      "EmailApiGateway",
      {
        handler: handleEmailLambda,
        proxy: false,
      }
    );

    const validator = new RequestValidator(this, "RequestValidator", {
      restApi: handleEmailAPI,
      validateRequestBody: true,
    });

    // Configuration
    handleEmailAPI.root.addMethod("POST", undefined, {
      requestValidator: validator,
    });

    splitwiseSecret.grantRead(handleEmailLambda);
  }
}
