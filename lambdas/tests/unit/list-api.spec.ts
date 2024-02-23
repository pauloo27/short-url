import { mockDynamoDBClient, mockedStore, mockNanoId, newGatewayEvent } from '../utils';
mockDynamoDBClient();
mockNanoId();

import { lambdaHandler } from '../../api/list';
import { expect, describe, it } from '@jest/globals';

describe('Unit test for list most accessed urls api', function () {
    it('should not allow limit less than 1', async () => {
        const event = newGatewayEvent('get', { path: '/urls', queryParams: { limit: '0' } });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'limit must be at least 1',
            }),
        );
    });

    it('should not allow limit more than 20', async () => {
        const event = newGatewayEvent('get', { path: '/urls', queryParams: { limit: '21' } });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'limit must be at most 20',
            }),
        );
    });

    it('should not allow non numeric limit', async () => {
        const event = newGatewayEvent('get', { path: '/urls', queryParams: { limit: 'NaN' } });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'limit must contain only numbers',
            }),
        );
    });

    it('should return the provided limit when provided', async () => {
        const event = newGatewayEvent('get', { path: '/urls', queryParams: { limit: '15' } });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                limit: 15,
                items: [],
            }),
        );
    });

    it('should use 10 as limit when none is provided', async () => {
        const event = newGatewayEvent('get', { path: '/urls' });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                limit: 10,
                items: [],
            }),
        );
    });

    it('should return the results formatted', async () => {
        for (let i = 0; i < 10; i++) {
            mockedStore.set(`alias${i.toString().padStart(2, '0')}`, {
                alias: { S: `alias${i.toString().padStart(2, '0')}` },
                original_url: { S: `http://example.com/${i}` },
                access_count: { N: (100 - i).toString() },
            });
        }

        const event = newGatewayEvent('get', { path: '/urls', queryParams: { limit: '2' } });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(200);
        expect(result.body).toEqual(
            JSON.stringify({
                limit: 2,
                items: [
                    { alias: 'alias00', original_url: 'http://example.com/0', access_count: 100 },
                    { alias: 'alias01', original_url: 'http://example.com/1', access_count: 99 },
                ],
            }),
        );
    });
});
