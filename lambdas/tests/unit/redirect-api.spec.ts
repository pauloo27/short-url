import { mockDynamoDBClient, mockedStore, mockNanoId, newGatewayEvent } from '../utils';
mockDynamoDBClient();
mockNanoId();

import { lambdaHandler } from '../../api/redirect';
import { expect, describe, it } from '@jest/globals';

describe('Unit test for redirect by alias api', function () {
    it('should return 404 when alias does not exist', async () => {
        const event = newGatewayEvent('get', { path: '/urls/notcreated', pathParams: { alias: 'notcreated' } });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(404);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'alias not found',
            }),
        );
    });

    it('should redirect with 302 when the alias exist', async () => {
        const alias = 'created';
        mockedStore.set(alias, {
            original_url: { S: 'http://example.com' },
        });

        const event = newGatewayEvent('get', { path: `/urls/${alias}`, pathParams: { alias } });
        const result = await lambdaHandler(event);

        expect(result.statusCode).toEqual(302);
        expect(result.body).toEqual(
            JSON.stringify({
                message: `Redirecting to http://example.com`,
            }),
        );
        expect(result.headers).toBeDefined();
        expect(result.headers!['Location']).toEqual('http://example.com');
    });
});
