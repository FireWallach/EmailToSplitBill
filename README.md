# Email to Splitwise Integration Project

## Overview

This project is an AWS CDK application that integrates email notifications with Splitwise. It's designed to detect specific email notifications (e.g., bill payments from PECO) and automatically create corresponding entries in Splitwise. This repository is for the Lambda project specifically. If you're following along, you'll have to set up an automatic detection on your mail. I intend to make another repo with details on this exact topic once I've got it finalized myself. If this happens, it'll be linked here.

## Features

- Automated detection of bill payment emails.

- Creation of debts in Splitwise based on email content.

- Secure handling of credentials and sensitive data using AWS Secrets Manager.

- Lambda function for processing and API integration.

## Prerequisites

- Node.js

- AWS CLI

- AWS Account and Credentials

- AWS CDK Toolkit

## Installation

1. Clone the repository and install prerequisite CLI

```bash
git clone https://github.com/FireWallach/EmailToSplitBill.git
```

2. Install the following
   - [NodeJS](https://nodejs.org/en)
   - [CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
   - [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. Run npm install on the root folder:

```bash
npm install
```

4. Configure your AWS environment

```bash
aws configure
```

\*You'll have to provide your access keys and your default region

```bash
cdk init
cdk bootstrap
```

5. Deploy the CDK project to your AWS instance

```bash
npm run deploy
```

## Usage

- The application will monitor incoming emails (set up separately) for specific triggers.
- Upon detection of a relevant email, it will invoke the AWS Lambda function.
- The Lambda function processes the email and updates Splitwise accordingly.

## Contributing

Feel free to fork the repository and submit pull requests with any enhancements or fixes.

## License

MIT License

Copyright (c) 2023 Dylan Wallach

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contact

Dylan Wallach
[dylan@wallach.dev](mailto:dylan@wallach.dev)
