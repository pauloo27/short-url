import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { URLRepository } from '../core/repo/url-repository';

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

    const repo = new URLRepository(process.env.TABLE_NAME!);

    const result = await repo.findOneByAlias(alias);

    if (!result) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: 'alias not found',
            }),
        };
    }

    await repo.incrementAccessCount(alias);

    return {
        statusCode: 302,
        body: JSON.stringify({
            message: `Redirecting to ${result.original_url}`,
        }),
        headers: {
            Location: result.original_url,
        },
    };
};

export const lambdaHandler = newHandler(handler);
