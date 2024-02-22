import { mockDynamoDBClient, mockNanoId, newGatewayEvent, peekNanoId } from '../utils';
mockDynamoDBClient();
mockNanoId();

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambdaHandler } from '../../api/create';
import { expect, describe, it } from '@jest/globals';

describe('Unit test for create short url handler', function () {
    it('should not allow empty body', async () => {
        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls');
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'missing request body',
            }),
        );
    });

    it('should not allow empty original_url', async () => {
        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {});
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'original_url must be provided',
            }),
        );
    });

    it('should not allow original_url if type is not string', async () => {
        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_url: 123,
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'original_url must be a string',
            }),
        );
    });

    it('should be case sensitive', async () => {
        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_URL: '123',
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'original_url must be provided',
            }),
        );
    });

    it('should generate a random alias when none is provided', async () => {
        const originalUrl = 'https://www.example.com';
        const randomAlias = peekNanoId();

        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_url: originalUrl,
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(201);
        expect(result.body).toEqual(
            JSON.stringify({
                alias: randomAlias,
                original_url: originalUrl,
            }),
        );
    });

    it('should use provided alias', async () => {
        const originalUrl = 'https://www.example.com';
        const providedAlias = 'customAlias';

        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_url: originalUrl,
            alias: providedAlias,
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(201);
        expect(result.body).toEqual(
            JSON.stringify({
                alias: providedAlias,
                original_url: originalUrl,
            }),
        );
    });

    it('should not allow already used alias', async () => {
        const originalUrl = 'https://www.anotherexample.com';
        const providedAlias = 'customAlias';

        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_url: originalUrl,
            alias: providedAlias,
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(409);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'alias already exists',
            }),
        );
    });

    it('should not allow custom alias shorter than 3', async () => {
        const originalUrl = 'https://www.example.com';
        const providedAlias = '12';

        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_url: originalUrl,
            alias: providedAlias,
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'alias must have at least 3 characters',
            }),
        );
    });

    it('should not allow custom alias longer than 20', async () => {
        const originalUrl = 'https://www.example.com';
        const providedAlias = 'a'.repeat(21);

        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_url: originalUrl,
            alias: providedAlias,
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'alias must have at most 20 characters',
            }),
        );
    });

    it('should not allow custom alias that is not alphanumeric', async () => {
        const originalUrl = 'https://www.example.com';
        const providedAlias = '#!A8SD';

        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {
            original_url: originalUrl,
            alias: providedAlias,
        });
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'alias must contain only letters, numbers and underscores',
            }),
        );
    });
});
