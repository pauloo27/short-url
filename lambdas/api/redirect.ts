import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

/**
 * @openapi
 * /urls/{alias}:
 *    get:
 *      summary: Redirect by alias
 *      parameters:
 *        - name: alias
 *          in: path
 *          required: true
 *          description: The alias for redirection
 *          schema:
 *            type: string
 *      responses:
 *        '302':
 *          description: Redirect successful, with Location header
 *          content:
 *            application/json:
 *              example:
 *                message: 'Redirecting to https://example.com'
 *        '404':
 *          description: Alias not found
 *          content:
 *            application/json:
 *              example:
 *                message: 'alias not found'
 *        '500':
 *          description: Internal Server Error
 *          content:
 *            application/json:
 *              example:
 *                message: something went wrong
 */
const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const alias = event.pathParameters?.alias;
    if (!alias) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'invalid alias',
            }),
        };
    }

    const client = new DynamoDBClient();
    const result = await client.send(
        new GetItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                alias: { S: alias },
            },
        }),
    );

    if (!result.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: 'alias not found',
            }),
        };
    }

    await client.send(
        new UpdateItemCommand({
            TableName: process.env.TABLE_NAME!,
            Key: {
                alias: { S: alias },
            },
            UpdateExpression: 'SET access_count = access_count + :one',
            ExpressionAttributeValues: {
                ':one': { N: '1' },
            },
        }),
    );

    return {
        statusCode: 302,
        body: JSON.stringify({
            message: `Redirecting to ${result.Item.original_url.S}`,
        }),
        headers: {
            Location: result.Item.original_url.S!,
        },
    };
};

export const lambdaHandler = newHandler(handler);
