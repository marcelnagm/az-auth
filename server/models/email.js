'use strict';

const axios = require('axios');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const verifyEmail = async (email) => {
    const url = `https://email-verify.conexia.com.br/verify?email=${email}`;

    const {
        data: { result },
    } = await axios.get(url).catch((err) => {
        const errorMessage = err?.response?.data?.message || err.message;
        throw new Error(errorMessage);
    });

    if (!result?.delivered) throw new Error('Invalid email.');
};

const connectSES = () => {
    const awsOptions = {
        region: 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    const sesClient = new SESClient(awsOptions);

    return sesClient;
};

const sendEmail = async (msg) => {
    await verifyEmail(msg.to);

    const sesClient = connectSES();

    const params = {
        Destination: {
            CcAddresses: [msg.from],
            ToAddresses: [msg.to],
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: msg.html,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: msg.subject,
            },
        },
        Source: msg.from,
    };

    const command = new SendEmailCommand(params);

    await sesClient.send(command).catch((err) => {
        throw new Error(err.message);
    });
};

module.exports = function (Email) {
    Email.send = function (params) {
        return sendEmail(params);
    };
};
