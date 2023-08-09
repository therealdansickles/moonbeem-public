import { faker } from '@faker-js/faker';

import { CollectionService } from './collection/collection.service';
import { CollectionKind } from './collection/collection.entity';
import { CoinService } from './sync-chain/coin/coin.service';
import { TierService } from './tier/tier.service';
import { Asset721Service } from './sync-chain/asset721/asset721.service';
import { MintSaleContractService } from './sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from './sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { OrganizationService } from './organization/organization.service';

export const createCoin = async (coinService: CoinService, coin?: any) =>
    coinService.createCoin({
        address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        derivedETH: 1,
        derivedUSDC: 1.5,
        enabled: true,
        chainId: 1,
        ...coin,
    });
export const createCollection = async (collectionService: CollectionService, collection?: any) =>
    collectionService.createCollection({
        name: faker.company.name(),
        displayName: faker.company.name(),
        about: faker.company.name(),
        tags: [],
        kind: CollectionKind.edition,
        address: faker.finance.ethereumAddress(),
        ...collection,
    });
export const createTier = async (tierService: TierService, tier?: any) =>
    tierService.createTier({
        name: faker.company.name(),
        totalMints: 100,
        collection: { id: faker.string.uuid() },
        price: '100',
        paymentTokenAddress: faker.finance.ethereumAddress(),
        tierId: 0,
        metadata: {},
        ...tier,
    });
export const createMintSaleContract = async (contractService: MintSaleContractService, contract?: any) =>
    contractService.createMintSaleContract({
        height: parseInt(faker.string.numeric(5)),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
        txTime: Math.floor(faker.date.recent().getTime() / 1000),
        sender: faker.finance.ethereumAddress(),
        address: faker.finance.ethereumAddress(),
        royaltyReceiver: faker.finance.ethereumAddress(),
        royaltyRate: 10000,
        derivativeRoyaltyRate: 1000,
        isDerivativeAllowed: true,
        beginTime: Math.floor(faker.date.recent().getTime() / 1000),
        endTime: Math.floor(faker.date.recent().getTime() / 1000),
        tierId: 0,
        price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
        paymentToken: faker.finance.ethereumAddress(),
        startId: 1,
        endId: 100,
        currentId: 1,
        tokenAddress: faker.finance.ethereumAddress(),
        collectionId: faker.string.uuid(),
        ...contract,
    });
export const createAsset721 = async (asset721Service: Asset721Service, asset721?: any) =>
    asset721Service.createAsset721({
        height: parseInt(faker.string.numeric(5)),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
        txTime: Math.floor(faker.date.recent().getTime() / 1000),
        address: faker.finance.ethereumAddress(),
        tokenId: faker.string.numeric(5),
        owner: faker.finance.ethereumAddress(),
        ...asset721,
    });
export const createMintSaleTransaction = async (transactionService: MintSaleTransactionService, transaction?: any) =>
    transactionService.createMintSaleTransaction({
        height: parseInt(faker.string.numeric(5)),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
        txTime: Math.floor(faker.date.recent().getTime() / 1000),
        sender: faker.finance.ethereumAddress(),
        recipient: faker.finance.ethereumAddress(),
        tierId: 0,
        tokenAddress: faker.finance.ethereumAddress(),
        tokenId: faker.string.numeric(3),
        price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
        address: faker.finance.ethereumAddress(),
        collectionId: faker.string.uuid(),
        paymentToken: faker.finance.ethereumAddress(),
        ...transaction,
    });

export const createOrganization = async (organizationService: OrganizationService, organization?: any) =>
    organizationService.createOrganization({
        name: faker.company.name(),
        displayName: faker.company.name(),
        about: faker.company.catchPhrase(),
        avatarUrl: faker.image.url(),
        backgroundUrl: faker.image.url(),
        websiteUrl: faker.internet.url(),
        twitter: faker.internet.userName(),
        instagram: faker.internet.userName(),
        discord: faker.internet.userName(),
        owner: faker.internet.userName(),
        ...organization,
    });