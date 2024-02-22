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

export interface Path {
    path: string;
    pathParams?: { [key: string]: string };
    queryParams?: { [key: string]: string };
}

export function newGatewayEvent<T>(method: HttpMethod, path: string | Path, body?: T): APIGatewayProxyEvent {
    let encodedBody: string | null = null;
    if (body) {
        encodedBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const rawPath = typeof path === 'string' ? path : path.path;
    const queryParams = typeof path === 'string' ? {} : path.queryParams ?? {};
    const urlParams = typeof path === 'string' ? {} : path.pathParams ?? {};

    return {
        ...baseEvent,
        httpMethod: method,
        path: rawPath,
        queryStringParameters: queryParams,
        pathParameters: urlParams,
        body: encodedBody,
        requestContext: {
            ...baseEvent.requestContext,
            httpMethod: method,
            path: rawPath,
            resourcePath: rawPath,
        },
    };
}

export const mockedStore = new Map<string, any>();

export function mockDynamoDBClient() {
    jest.mock('@aws-sdk/client-dynamodb', () => {
        return {
            DynamoDBClient: jest.fn(() => ({
                send: jest.fn((cmd: any) => {
                    switch (cmd._cmd) {
                        case 'PutItemCommand':
                            if (mockedStore.has(cmd.Item.alias.S)) {
                                throw {
                                    name: 'ConditionalCheckFailedException',
                                };
                            }
                            mockedStore.set(cmd.Item.alias.S, cmd.Item);
                            return;
                        case 'UpdateItemCommand':
                            const current = mockedStore.get(cmd.Key.alias.S);
                            if (!current) {
                                throw new Error('Item not found');
                            }
                            mockedStore.set(cmd.Key.alias.S, {
                                ...current,
                                access_count: { N: (parseInt(current.access_count.N) + 1).toString() },
                            });
                            return;
                        case 'GetItemCommand':
                            return { Item: mockedStore.get(cmd.Key.alias.S) };
                    }
                }),
            })),
            PutItemCommand: jest.fn((obj: any) => ({ ...obj, _cmd: 'PutItemCommand' })),
            GetItemCommand: jest.fn((obj: any) => ({ ...obj, _cmd: 'GetItemCommand' })),
            UpdateItemCommand: jest.fn((obj: any) => ({ ...obj, _cmd: 'UpdateItemCommand' })),
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
