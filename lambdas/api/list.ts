import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { URLRepository } from '../core/repo/url-repository';
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
 *                count: 5
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

    const repo = new URLRepository(process.env.TABLE_NAME!);
    const indexName = process.env.TABLE_ACCESS_COUNT_INDEX!;

    const result = await repo.listByAccessCount(indexName, limit);

    return {
        statusCode: 200,
        body: JSON.stringify({
            count: result.count,
            limit,
            items: result.items,
        }),
    };
};

export const lambdaHandler = newHandler(handler);
