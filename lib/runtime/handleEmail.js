const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const Splitwise = require('splitwise')

exports.handler = async (event) => {
    // You'll have to define these secrets in AWS Secrets manager.
    const secretArn = process.env.SPLITWISE_SECRET_ARN;
    const secretData = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
    const secrets = JSON.parse(secretData.SecretString);

    const consumerKey = secrets.SPLITWISE_CONSUMER_KEY;
    const consumerSecret = secrets.SPLITWISE_CONSUMER_SECRET;
    const groupId = secrets.SPLITWISE_BILL_GROUP_ID;
    const fromUserId = secrets.SPLITWISE_FROM_USER_ID;
    const toUserId1 = secrets.SPLITWISE_TO_USER_ID1;
    const toUserId2 = secrets.SPLITWISE_TO_USER_ID2;

    // This is the parsing for my specific electric company. You may have to modify it.
    function extractTotalCost(body) {
        try {
            // Regular expression to match the pattern $X.XX
            const regexPattern = /\$\d+\.\d+/;
            const matches = body.match(regexPattern);

            if (!matches) {
                throw new Error('No monetary value found in the body');
            }

            // Extract the first match and remove the dollar sign
            const amountString = matches[0].slice(1);

            // Convert to float
            const amount = parseFloat(amountString);

            // Check if conversion was successful
            if (isNaN(amount)) {
                throw new Error('Failed to convert extracted string to a number');
            }

            return amount;
        } catch (error) {
            console.error('Error extracting total cost:', error.message);
            // Handle the error appropriately
            // For example, you can return null or throw the error further
            return null;
        }
    }

    const sw = Splitwise({
        consumerKey: consumerKey,
        consumerSecret: consumerSecret
    });

    const totalCost = extractTotalCost(event.body);
    const individualCost = totalCost / 3;

    try {
        const response = await sw.createExpense({
            group_id: groupId,
            cost: totalCost,
            description: 'PECO Energy Bill',
            details: 'Automated bill split',
            users: [
                { user_id: fromUserId, paid_share: totalCost, owed_share: individualCost },
                { user_id: toUserId1, paid_share: 0, owed_share: individualCost },
                { user_id: toUserId2, paid_share: 0, owed_share: individualCost }
            ]
        });

        console.log('Expense created successfully: ', response);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Expense created successfully', data: response })
        };
    } catch (error) {
        console.error('Error creating expense:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating expense', error: error.message })
        };
    }
};
