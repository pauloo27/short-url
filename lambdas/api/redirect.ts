import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

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
 *        '404':
 *          description: Alias not found
 *          content:
 *            application/json:
 *              example:
 *                message: 'Alias not found'
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

    return {
        statusCode: 302,
        body: '',
        headers: {
            Location: result.Item.original_url.S!,
        },
    };
};

export const lambdaHandler = newHandler(handler);
