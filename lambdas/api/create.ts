import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const client = new DynamoDBClient();
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Missing request body',
            }),
        };
    }

    const parsedBody = JSON.parse(event.body);
    const originalUrl = parsedBody.original_url;
    if (!originalUrl) {
        return {
            statusCode: 422,
            body: JSON.stringify({
                message: 'Missing original_url in request body',
            }),
        };
    }

    const alias = parsedBody.alias ?? nanoid(8);

    const cmd = new PutItemCommand({
        TableName: process.env.TABLE_NAME!,
        Item: {
            alias: { S: alias },
            original_url: { S: originalUrl },
            access_count: { N: '0' },
        },
        ConditionExpression: 'attribute_not_exists(alias)',
    });

    try {
        await client.send(cmd);
    } catch (e: any) {
        if ('name' in e && e.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                body: JSON.stringify({
                    message: 'Alias already exists',
                }),
            };
        }
        throw e;
    }

    return {
        statusCode: 201,
        body: JSON.stringify({
            alias,
            original_url: originalUrl,
        }),
    };
};

export const lambdaHandler = newHandler(handler);
