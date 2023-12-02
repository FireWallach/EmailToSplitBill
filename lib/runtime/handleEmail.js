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
    const toUserId = secrets.SPLITWISE_TO_USER_ID;

    // The following console log is to be replaced with email body parsing and cost splitting.
    // Will be replaced once I've received the actual email next month.
    console.log(event.body);

    const sw = Splitwise({
        consumerKey: secrets.SPLITWISE_CONSUMER_KEY,
        consumerSecret: secrets.SPLITWISE_CONSUMER_SECRET
    });

    // All of the following can be re-configured based on your split needs.
    await sw.createDebt({
        from: secrets.SPLITWISE_FROM_USER_ID,
        to: secrets.SPLITWISE_TO_USER_ID,
        group_id: secrets.SPLITWISE_BILL_GROUP_ID,
        description: 'Enter your description here',
        amount: 1
    }).then(response => {
        console.log('Debt created successfully: ', response);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Debt created successfully', data: response })
        };
    }).catch(error => {
        console.error('Error creating debt:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating debt', error: error.message })
        };
    });
};
