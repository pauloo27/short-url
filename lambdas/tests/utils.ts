import { APIGatewayProxyEvent } from 'aws-lambda';

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

const baseEvent: APIGatewayProxyEvent = {
    httpMethod: 'get',
    body: '',
    headers: {},
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    path: '/',
    pathParameters: {},
    queryStringParameters: {},
    requestContext: {
        accountId: '123456789012',
        apiId: '1234',
        authorizer: {},
        httpMethod: 'get',
        identity: {
            accessKey: '',
            accountId: '',
            apiKey: '',
            apiKeyId: '',
            caller: '',
            clientCert: {
                clientCertPem: '',
                issuerDN: '',
                serialNumber: '',
                subjectDN: '',
                validity: { notAfter: '', notBefore: '' },
            },
            cognitoAuthenticationProvider: '',
            cognitoAuthenticationType: '',
            cognitoIdentityId: '',
            cognitoIdentityPoolId: '',
            principalOrgId: '',
            sourceIp: '',
            user: '',
            userAgent: '',
            userArn: '',
        },
        path: '/',
        protocol: 'HTTP/1.1',
        requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
        requestTimeEpoch: 1428582896000,
        resourceId: '123456',
        resourcePath: '/',
        stage: 'dev',
    },
    resource: '',
    stageVariables: {},
};

export function newGatewayEvent<T>(method: HttpMethod, path: string, body?: T): APIGatewayProxyEvent {
    let encodedBody: string | null = null;
    if (body) {
        encodedBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    return {
        ...baseEvent,
        httpMethod: method,
        path,
        body: encodedBody,
        requestContext: {
            ...baseEvent.requestContext,
            httpMethod: method,
            path,
            resourcePath: path,
        },
    };
}

export function mockDynamoDBClient() {
    jest.mock('@aws-sdk/client-dynamodb', () => {
        const mockedStore = new Map<string, any>();

        return {
            DynamoDBClient: jest.fn(() => ({
                send: jest.fn((cmd: any) => {
                    if (cmd._cmd === 'PutItemCommand') {
                        if (mockedStore.has(cmd.Item.alias.S)) {
                            throw {
                                name: 'ConditionalCheckFailedException',
                            };
                        }
                        mockedStore.set(cmd.Item.alias.S, cmd.Item);
                    }
                }),
            })),
            PutItemCommand: jest.fn((obj: any) => ({ ...obj, _cmd: 'PutItemCommand' })),
        };
    });
}

let randomIndex = 0;
const randomIds = ['QbjLyrdo', 'Z9SykPd-', 'HsH5gIME', 'My-2f-1Z'];

export function peekNanoId() {
    return randomIds[randomIndex];
}

export function mockNanoId() {
    jest.mock('nanoid', () => {
        return {
            nanoid: jest.fn(() => randomIds[randomIndex++]),
        };
    });
}
