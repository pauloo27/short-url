import { nanoid } from 'nanoid';
import { URLRepository } from '../../core/repo/url-repository';

describe('Integration test with DynamoDB', function () {
    it('should put item in DynamoDB', async () => {
        const repo = new URLRepository(process.env.TEST_TABLE_NAME!);
        const alias = nanoid();

        await repo.create({
            original_url: 'https://www.google.com',
            alias,
        });

        const item = await repo.findOneByAlias(alias);
        expect(item).toBeDefined();
        expect(item!.original_url).toBe('https://www.google.com');
        expect(item!.alias).toBe(alias);
        expect(item!.access_count).toBe(0);
    });

    it('should update access count on redirect', async () => {
        const repo = new URLRepository(process.env.TEST_TABLE_NAME!);
        const alias = nanoid();

        await repo.create({
            original_url: 'https://www.google.com',
            alias,
        });

        const item = await repo.findOneByAlias(alias);
        expect(item).toBeDefined();
        expect(item!.original_url).toBe('https://www.google.com');
        expect(item!.alias).toBe(alias);
        expect(item!.access_count).toBe(0);

        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(repo.incrementAccessCount(alias));
        }
        await Promise.all(promises);

        const updatedItem = await repo.findOneByAlias(alias);
        expect(updatedItem!.access_count).toBe(5);
    }, 10000);
});
