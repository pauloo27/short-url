import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambdaHandler } from '../../api/create';
import { expect, describe, it } from '@jest/globals';
import { newGatewayEvent } from '../utils';

// TODO: mock the DynamoDBClient and PutItemCommand

describe('Unit test for create short url handler', function () {
    it('should not allow empty body', async () => {
        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls');
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(400);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'Missing request body',
            }),
        );
    });

    it('should not allow empty original_url', async () => {
        const event: APIGatewayProxyEvent = newGatewayEvent('post', '/urls', {});
        const result: APIGatewayProxyResult = await lambdaHandler(event);

        expect(result.statusCode).toEqual(422);
        expect(result.body).toEqual(
            JSON.stringify({
                message: 'Missing original_url in request body',
            }),
        );
    });
});
