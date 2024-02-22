import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ValidationError } from './validation';

export function newHandler(handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>) {
    return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        try {
            const result = await handler(event);
            return result;
        } catch (error) {
            if (error instanceof ValidationError) {
                return {
                    statusCode: 422,
                    body: JSON.stringify({ message: error.message }),
                };
            }
            console.error(error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'something went wrong' }),
            };
        }
    };
}
