import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { newHandler } from '../core/api';
import { nanoid } from 'nanoid';
import { Validator } from '../core/validation';
import { URLRepository } from '../core/repo/url-repository';

type Body = {
    original_url: string;
    alias?: string;
};

/**
 * @openapi
 * /urls/:
 *    post:
 *      summary: Create a short URL
 *      requestBody:
 *        description: The original URL and an **optional** custom alias. The custom alias must be unique and have a length between 3 and 20. If none is provided, a random one is generated with length of 8.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - original_url
 *              properties:
 *                original_url:
 *                  type: string
 *                alias:
 *                  type: string
 *      responses:
 *        '201':
 *          description: Short URL created successfully
 *          content:
 *            application/json:
 *              example:
 *                alias: generatedAlias
 *                original_url: https://www.example.com
 *        '400':
 *          description: Missing request body
 *          content:
 *            application/json:
 *              example:
 *                message: missing request body
 *        '422':
 *          description: Unprocessable Entity
 *          content:
 *            application/json:
 *              examples:
 *                emptyOriginalUrl:
 *                  summary: Empty original_url
 *                  value:
 *                    message: original_url must be provided
 *                invalidOriginalUrlType:
 *                  summary: Invalid original_url type
 *                  value:
 *                    message: original_url must be a string
 *                invalidAlias:
 *                  summary: Custom alias length or format invalid
 *                  value:
 *                    message: alias must have length between 3 and 20
 *        '409':
 *          description: Conflict
 *          content:
 *            application/json:
 *              example:
 *                message: alias already exists
 *        '500':
 *          description: Internal Server Error
 *          content:
 *            application/json:
 *              example:
 *                message: something went wrong
 */
const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'missing request body',
            }),
        };
    }

    const repo = new URLRepository(process.env.TABLE_NAME!);

    const validator = Validator.fromJSON<Body>(event.body)
        .mustBeProvided('original_url')
        .mustBeString('original_url')
        .mustBeUrl('original_url');

    if (validator.isPresent('alias')) {
        validator
            .mustBeProvided('alias')
            .mustBeString('alias')
            .mustHaveLengthBetween('alias', 3, 20)
            .mustBeAlphanumericUnderscore('alias');
    }

    const body = validator.asValue();
    const originalUrl = body.original_url;
    const alias = body.alias ?? nanoid(8);

    try {
        await repo.create({ alias, original_url: originalUrl });
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
