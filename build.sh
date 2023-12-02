#!/bin/bash
DEPLOY_DIR="deploy"

# Create deployment directory
mkdir -p $DEPLOY_DIR

# Copy Lambda function code
cp -r lib/runtime/* $DEPLOY_DIR

# Create a minimal package.json in the deployment directory
echo '{
  "name": "lambda-deployment-package",
  "version": "1.0.0",
  "dependencies": {
    "source-map-support": "^0.5.21"
  }
}' > $DEPLOY_DIR/package.json

# Install only production dependencies in the deployment directory
cd $DEPLOY_DIR
npm install --production

# Return to project root
cd ..
