import {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    ScanCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';

interface URL {
    alias: string;
    original_url: string;
    access_count: number;
}

interface ListResult {
    count: number;
    items: URL[];
}

type CreateURL = Omit<URL, 'access_count'>;

export class URLRepository {
    constructor(private readonly tableName: string) {}

    async create(item: CreateURL): Promise<void> {
        const cmd = new PutItemCommand({
            TableName: this.tableName,
            Item: {
                alias: { S: item.alias },
                original_url: { S: item.original_url },
                access_count: { N: '0' },
            },
            ConditionExpression: 'attribute_not_exists(alias)',
        });
        await this.getClient().send(cmd);
    }

    async findOneByAlias(alias: string): Promise<URL | undefined> {
        const cmd = new GetItemCommand({
            TableName: this.tableName,
            Key: {
                alias: { S: alias },
            },
        });

        const result = await this.getClient().send(cmd);

        if (!result?.Item) {
            return undefined;
        }

        return {
            alias: result.Item?.alias.S!,
            original_url: result.Item?.original_url.S!,
            access_count: Number(result.Item?.access_count.N!),
        };
    }

    async incrementAccessCount(alias: string): Promise<void> {
        const cmd = new UpdateItemCommand({
            TableName: this.tableName,
            Key: {
                alias: { S: alias },
            },
            UpdateExpression: 'SET access_count = access_count + :one',
            ExpressionAttributeValues: {
                ':one': { N: '1' },
            },
        });

        await this.getClient().send(cmd);
    }

    async listByAccessCount(indexName: string, limit: number): Promise<ListResult> {
        const cmd = new ScanCommand({
            TableName: this.tableName,
            IndexName: indexName,
            Limit: limit,
        });
        const result = await this.getClient().send(cmd);

        return {
            count: result.Count ?? 0,
            items:
                result.Items?.map((item) => ({
                    alias: item.alias.S!,
                    original_url: item.original_url.S!,
                    access_count: Number(item.access_count.N!),
                })) ?? [],
        };
    }

    private getClient() {
        return new DynamoDBClient();
    }
}
