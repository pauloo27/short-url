import { newHandler } from '../../core/api';
import { ValidationError } from '../../core/validation';
import { newGatewayEvent } from '../utils';

describe('Unit the API handler wrapper', function () {
    it('should return the handler result', async () => {
        const handler = async () => ({ statusCode: 200, body: 'ok' });
        const wrapped = newHandler(handler);

        const result = await wrapped(newGatewayEvent('get', '/'));
        expect(result).toEqual({ statusCode: 200, body: 'ok' });
    });

    it('should return the handler result with headers', async () => {
        const handler = async () => ({ statusCode: 200, body: 'ok', headers: { 'x-header': 'value' } });
        const wrapped = newHandler(handler);

        const result = await wrapped(newGatewayEvent('get', '/'));
        expect(result).toEqual({ statusCode: 200, body: 'ok', headers: { 'x-header': 'value' } });
    });

    it('should return 422 when the handler throws a ValidationError', async () => {
        const handler = async () => {
            throw new ValidationError('validation error message');
        };
        const wrapped = newHandler(handler);

        const result = await wrapped(newGatewayEvent('get', '/'));
        expect(result).toEqual({ statusCode: 422, body: JSON.stringify({ message: 'validation error message' }) });
    });

    it('should return 500 when handler throws an error', async () => {
        jest.spyOn(console, 'error');
        // @ts-ignore
        console.error.mockImplementation(() => null);

        const handler = async () => {
            throw new Error('error message');
        };
        const wrapped = newHandler(handler);

        const result = await wrapped(newGatewayEvent('get', '/'));
        expect(result).toEqual({ statusCode: 500, body: JSON.stringify({ message: 'something went wrong' }) });
    });
});
