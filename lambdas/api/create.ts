import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { nanoid } from 'nanoid';
import { Validator } from '../core/validation';

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'missing request body',
            }),
        };
    }

    const parsedBody = JSON.parse(event.body);
    const validator = new Validator(parsedBody);
    validator.mustBeProvided('original_url').mustBeString('original_url');

    const originalUrl = parsedBody.original_url;

    if (parsedBody.alias) {
        validator
            .mustBeProvided('alias')
            .mustBeString('alias')
            .mustHaveLengthBetween('alias', 3, 20)
            .mustBeAlphanumericUnderscore('alias');
    }

    const alias = parsedBody.alias ?? nanoid(8);

    const client = new DynamoDBClient();
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
                    message: 'alias already exists',
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
