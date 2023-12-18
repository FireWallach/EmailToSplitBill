const AWS = require('aws-sdk');
const Imap = require('imap');
const lambda = new AWS.Lambda();
const secretsManager = new AWS.SecretsManager();
const { simpleParser } = require('mailparser');

exports.handler = async (event) => {
    console.log('Handler started');

    const secretArn = process.env.SPLITWISE_SECRET_ARN;
    const handleEmailLambdaArn = process.env.HANDLE_EMAIL_LAMBDA_ARN;

    let secrets;
    try {
        console.log('Retrieving secrets...');
        const secretData = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
        secrets = JSON.parse(secretData.SecretString);
        console.log('Secrets retrieved successfully');
    } catch (err) {
        console.error('Error retrieving secrets:', err);
        throw err;
    }

    const { EMAIL_USER: userEmail, EMAIL_PASSWORD: userPassword } = secrets;

    console.log('Setting up IMAP connection...');
    const imap = new Imap({
        user: userEmail,
        password: userPassword,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    function openInbox(cb) {
        imap.openBox('INBOX', false, cb);
    }

    await new Promise((resolve, reject) => {
        imap.once('ready', () => {
            console.log('IMAP connection ready');
            openInbox(err => {
                if (err) {
                    console.error('Error opening inbox:', err);
                    imap.end();
                    return reject(err);
                }
                console.log('Inbox opened');
                imap.search(['UNSEEN', ['SUBJECT', 'PECO We Have Received Your Scheduled Payment Request']], (err, results) => {
                    if (err) {
                        console.error('Error in IMAP search:', err);
                        imap.end();
                        return reject(err);
                    }
                    if (results.length > 0) {
                        console.log(results.length + ' new message(s) with specific subject found');
                        const f = imap.fetch(results, { bodies: '', markSeen: true });
                        f.on('message', function (msg, seqno) {
                            let mailUID;

                            msg.once('attributes', function (attrs) {
                                mailUID = attrs.uid;
                            });

                            msg.on('body', function (stream) {
                                simpleParser(stream, async (err, parsed) => {
                                    if (err) throw err;

                                    const emailBody = parsed.text;

                                    try {
                                        await invokeLambda(parsed.text).catch(error => {
                                            console.error('Error in invokeLambda for ' + mailUID + ':', error);
                                        });

                                        await imap.addFlags(mailUID, '\\Seen', function (err) {
                                            if (err) {
                                                console.log('Error marking message as read:', err);
                                            } else {
                                                console.log('Message marked as read');
                                            }
                                            imap.end();
                                            resolve();
                                        });
                                    } catch (error) {
                                        console.error('Error processing mail: ', error);
                                        imap.end();
                                        resolve();
                                    }
                                })
                            })
                        })
                    } else {
                        console.log('No new messages with specified subject');
                        imap.end();
                        resolve();
                    }
                });
            });
        });

        imap.once('error', err => {
            console.error('IMAP connection error:', err);
            imap.end();
            reject(err);
        });

        imap.once('end', () => {
            console.log('IMAP connection ended');
            imap.end();
            resolve();
        });

        imap.connect();
    });


    async function invokeLambda(emailBody) {
        console.log('Attempting email lambda invocation');
        const payload = { body: emailBody };
        const params = {
            FunctionName: handleEmailLambdaArn,
            InvocationType: 'Event',
            Payload: JSON.stringify(payload),
        };
        try {
            await lambda.invoke(params).promise();
            console.log('Lambda invoke successful');
        } catch (error) {
            console.error('Error invoking lambda:', error);
            throw error;
        }
    }
};
