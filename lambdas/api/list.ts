import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { Validator } from '../core/validation';

const defaultLimit = 10;

/**
 * @openapi
 * /urls/:
 *    get:
 *      summary: List most accessed URLs, ordered by access count
 *      parameters:
 *        - name: limit
 *          in: query
 *          description: Number of items to return (default is 10). At least 1 and at most 20.
 *          schema:
 *            type: integer
 *            minimum: 1
 *            maximum: 20
 *      responses:
 *        '200':
 *          description: Successful response
 *          content:
 *            application/json:
 *              example:
 *                limit: 10
 *                items:
 *                  - alias: 'alias1'
 *                    original_url: 'https://www.example.com/1'
 *                    access_count: 10
 *                  - alias: 'alias2'
 *                    original_url: 'https://www.example.com/2'
 *                    access_count: 5
 *        '422':
 *          description: Unprocessable Entity
 *          content:
 *            application/json:
 *              example:
 *                message: 'limit must be at least 1'
 *        '500':
 *          description: Internal Server Error
 *          content:
 *            application/json:
 *              example:
 *                message: something went wrong
 */
const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    let limit = defaultLimit;

    if (event.queryStringParameters) {
        const validator = Validator.fromObject(event.queryStringParameters as { limit?: string });

        if (validator.isPresent('limit')) {
            const body = validator
                .mustBeProvided('limit')
                .mustBeNumericString('limit')
                .transform('limit', (value) => parseInt(value, 10))
                .mustBeInRange('limit', 1, 20)
                .asValue();

            limit = body.limit;
        }
    }

    const client = new DynamoDBClient();

    const result = await client.send(
        new ScanCommand({
            TableName: process.env.TABLE_NAME,
            IndexName: process.env.TABLE_ACCESS_COUNT_INDEX,
            Limit: limit,
        }),
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            limit,
            count: result.Count,
            items: result.Items ? result.Items.map(formatItem) : [],
        }),
    };
};

function formatItem(item: any) {
    return {
        alias: item.alias.S,
        original_url: item.original_url.S,
        access_count: parseInt(item.access_count.N),
    };
}

export const lambdaHandler = newHandler(handler);
