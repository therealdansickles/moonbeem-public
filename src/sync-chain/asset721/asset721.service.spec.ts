import { faker } from '@faker-js/faker';

import { Asset721Service } from './asset721.service';

describe('Asset721Service', () => {
    let service: Asset721Service;

    beforeAll(async () => {
        service = global.asset721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getAsset721', () => {
        it('should get an asset by id', async () => {
            const asset = await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721({ id: asset.id });
            expect(result.id).toEqual(asset.id);
        });

        it('should get an asset by address and tokenId', async () => {
            const address = faker.finance.ethereumAddress();

            const asset1 = await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721({ tokenId: asset1.tokenId, address });
            expect(result.id).toEqual(asset1.id);
        });

        it('should get nothing', async () => {
            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721({});
            expect(result).toBeNull();
        });
    });

    describe('getAssets', () => {
        it('should get asset list', async () => {
            const address = faker.finance.ethereumAddress();
            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.string.numeric({ length: 4, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 4, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAssets(address);
            expect(result.length).toEqual(2);
        });

        it('should get erc6551 account', async () => {
            const address = faker.finance.ethereumAddress();
            const account = faker.finance.ethereumAddress();
            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
                account
            });

            const result = await service.getAssets(address);
            expect(result.length).toEqual(1);
            expect(result[0].account).toEqual(account);
        });
    });

    describe('lowercaseTransformer', () => { 
        it('should be lowercase address', async () => {
            const owner = faker.finance.ethereumAddress().toLocaleUpperCase();
            const address = faker.finance.ethereumAddress().toLocaleUpperCase();
            const tokenId = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: address,
                tokenId: tokenId,
                owner: owner,
            });
    
            const asset721 = await service.getAsset721({ tokenId, address });
            expect(asset721.owner).toEqual(owner.toLocaleLowerCase());
            expect(asset721.address).toEqual(address.toLocaleLowerCase());
        });
    });
});
