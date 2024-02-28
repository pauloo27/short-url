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
        const accesses = Math.floor(Math.random() * 8) + 1;

        for (let i = 0; i < accesses; i++) {
            promises.push(repo.incrementAccessCount(alias));
        }
        await Promise.all(promises);

        const updatedItem = await repo.findOneByAlias(alias);
        expect(updatedItem!.access_count).toBe(accesses);
    }, 10000);

    it('should list ordered by access count', async () => {
        const repo = new URLRepository(process.env.TEST_TABLE_NAME!);
        const alias = nanoid();
        const limit = 5;

        await repo.create({
            original_url: 'https://www.google.com',
            alias,
        });

        await repo.incrementAccessCount(alias);

        const result = await repo.listByAccessCount('AccessCountIndex', limit);
        expect(result).toBeDefined();
        expect(result.count).toBeGreaterThanOrEqual(1);
        expect(result.count).toBeLessThanOrEqual(limit);
        expect(result.items.length).toBeLessThanOrEqual(limit);

        let previousCount = Number.MAX_SAFE_INTEGER;
        for (const item of result.items) {
            expect(item.access_count).toBeLessThanOrEqual(previousCount);
            previousCount = item.access_count;
        }
    });
});
