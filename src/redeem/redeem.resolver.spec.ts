import { ethers } from 'ethers';
import { NftService } from 'src/nft/nft.service';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollectionService } from '../collection/collection.service';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { OrganizationService } from '../organization/organization.service';
import { Plugin } from '../plugin/plugin.entity';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { PHYSICAL_REDEMPTION_PLUGIN_NAME } from './redeem.constants';
import { RedeemService } from './redeem.service';

export const gql = String.raw;

describe('RedeemResolver', () => {
    let pluginRepository: Repository<Plugin>;
    let redeemService: RedeemService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;
    let tierService: TierService;
    let nftService: NftService;
    let collectionPluginService: CollectionPluginService;
    let mintSaleContractService: MintSaleContractService;
    let asset721Service: Asset721Service;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;

        pluginRepository = global.pluginRepository;
        redeemService = global.redeemService;
        userService = global.userService;
        organizationService = global.organizationService;
        collectionService = global.collectionService;
        tierService = global.tierService;
        nftService = global.nftService;
        mintSaleContractService = global.mintSaleContractService;
        asset721Service = global.asset721Service;
        collectionPluginService = global.collectionPluginService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getRedeemByQuery', () => {
        it('should get a redeem', async () => {
            const ownerUser = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: ownerUser,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const ownerWallet = ethers.Wallet.createRandom();
            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const mintSaleContract = await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress().toLowerCase(),
                address: faker.finance.ethereumAddress().toLowerCase(),
                royaltyReceiver: faker.finance.ethereumAddress().toLowerCase(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress().toLowerCase(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress().toLowerCase(),
                collectionId: collection.id,
            });

            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: mintSaleContract.tokenAddress,
                tokenId,
                owner: ownerWallet.address,
            });

            const message = 'claim a redeem font';
            const signature = await ownerWallet.signMessage(message);

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const createdRedeem = await redeemService.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin.id,
                tokenId,
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: ownerWallet.address,
                message,
                signature,
            });

            const query = gql`
                query GetRedeemByQuery($collectionId: String!, $tokenId: String!) {
                    getRedeemByQuery(collectionId: $collectionId, tokenId: $tokenId) {
                        id
                        deliveryAddress
                        email
                    }
                }
            `;

            const variables = {
                collectionId: collection.id,
                tokenId,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getRedeemByQuery.id).toBeTruthy();
                    expect(body.data.getRedeemByQuery.deliveryAddress).toEqual(createdRedeem.deliveryAddress);
                });
        });
    });

    describe('createRedeem', () => {
        it('should forbid if signature not matched', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const trueWallet = ethers.Wallet.createRandom();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await trueWallet.signMessage(message);

            const query = gql`
                mutation CreateRedeem($input: CreateRedeemInput!) {
                    createRedeem(input: $input) {
                        id
                        deliveryAddress
                        email
                    }
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                    message,
                    signature,
                    deliveryAddress: faker.location.streetAddress(),
                    deliveryCity: faker.location.city(),
                    deliveryZipcode: faker.location.zipCode(),
                    deliveryState: faker.location.state(),
                    deliveryCountry: faker.location.country(),
                    email: faker.internet.email(),
                    collection: { id: collection.id },
                    collectionPluginId: collectionPlugin.id,
                    tokenId: +faker.string.numeric({ length: 1, allowLeadingZeros: false }),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeTruthy();
                    expect(body.data).toBeFalsy();
                });
        });

        it("should forbid if owner of the asset721 doesn't match the signed wallet", async () => {
            const ownerUser = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: ownerUser,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const mintSaleContract = await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress().toLowerCase(),
                address: faker.finance.ethereumAddress().toLowerCase(),
                royaltyReceiver: faker.finance.ethereumAddress().toLowerCase(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress().toLowerCase(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress().toLowerCase(),
                collectionId: collection.id,
            });

            const ownerWallet = ethers.Wallet.createRandom();
            const ownerWallet2 = ethers.Wallet.createRandom();
            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: mintSaleContract.tokenAddress,
                tokenId,
                owner: ownerWallet2.address,
            });

            const message = 'claim a redeem font';
            const signature = await ownerWallet.signMessage(message);

            const query = gql`
                mutation CreateRedeem($input: CreateRedeemInput!) {
                    createRedeem(input: $input) {
                        id
                        deliveryAddress
                        email
                    }
                }
            `;

            const variables = {
                input: {
                    address: ownerWallet.address,
                    message,
                    signature,
                    deliveryAddress: faker.location.streetAddress(),
                    deliveryCity: faker.location.city(),
                    deliveryZipcode: faker.location.zipCode(),
                    deliveryState: faker.location.state(),
                    deliveryCountry: faker.location.country(),
                    email: faker.internet.email(),
                    collection: { id: collection.id },
                    collectionPluginId: collectionPlugin.id,
                    tokenId: +tokenId,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeTruthy();
                    expect(body.data).toBeFalsy();
                });
        });

        it('should create a redeem', async () => {
            const ownerUser = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: ownerUser,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const ownerWallet = ethers.Wallet.createRandom();
            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });

            const mintSaleContract = await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress().toLowerCase(),
                address: faker.finance.ethereumAddress().toLowerCase(),
                royaltyReceiver: faker.finance.ethereumAddress().toLowerCase(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress().toLowerCase(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress().toLowerCase(),
                collectionId: collection.id,
            });

            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: mintSaleContract.tokenAddress,
                tokenId,
                owner: ownerWallet.address,
            });

            const message = 'claim a redeem font';
            const signature = await ownerWallet.signMessage(message);

            const query = gql`
                mutation CreateRedeem($input: CreateRedeemInput!) {
                    createRedeem(input: $input) {
                        id
                        deliveryAddress
                        email
                    }
                }
            `;

            const variables = {
                input: {
                    address: ownerWallet.address,
                    message,
                    signature,
                    deliveryAddress: faker.location.streetAddress(),
                    deliveryCity: faker.location.city(),
                    deliveryZipcode: faker.location.zipCode(),
                    deliveryState: faker.location.state(),
                    deliveryCountry: faker.location.country(),
                    email: faker.internet.email(),
                    collection: { id: collection.id },
                    collectionPluginId: collectionPlugin.id,
                    tokenId,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createRedeem.id).toBeTruthy();
                    expect(body.data.createRedeem.deliveryAddress).toEqual(variables.input.deliveryAddress);
                });
        });
    });

    describe('redeemOverview', () => {
        it('should return the overview for the redeem', async () => {
            const ownerUser = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: ownerUser,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const totalRecipients1 = Math.floor(Math.random() * 100);
            const collectionPlugin1 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
                pluginDetail: {
                    recipients: new Array(totalRecipients1).fill('0'),
                },
            });

            const totalRecipients2 = Math.floor(Math.random() * 200);
            const collectionPlugin2 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
                pluginDetail: {
                    recipients: new Array(totalRecipients2).fill('0'),
                },
            });

            const ownerWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await ownerWallet.signMessage(message);

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            await redeemService.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: tokenId1,
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: ownerWallet.address,
                message,
                signature,
            });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            await redeemService.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: tokenId2,
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: ownerWallet.address,
                message,
                signature,
            });
            const tokenId3 = faker.string.numeric({ length: 3, allowLeadingZeros: false });
            await redeemService.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: tokenId3,
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: ownerWallet.address,
                message,
                signature,
            });

            const tokenId4 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            await redeemService.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin2.id,
                tokenId: tokenId4,
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: ownerWallet.address,
                message,
                signature,
            });

            const query = gql`
                query RedeemOverview($collectionId: String!) {
                    redeemOverview(collectionId: $collectionId) {
                        collectionPluginId
                        tokenIds
                        recipientsTotal
                    }
                }
            `;

            const variables = {
                address: ownerWallet.address,
                message,
                signature,
                collectionId: collection.id,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.redeemOverview).toBeTruthy();
                    expect(body.data.redeemOverview.length).toEqual(2);
                    expect(body.data.redeemOverview.find((item) => item.tokenIds.length === 3).recipientsTotal).toEqual(totalRecipients1);
                    expect(body.data.redeemOverview.find((item) => item.tokenIds.length === 1).recipientsTotal).toEqual(totalRecipients2);
                });
        });
    });

    describe('getRedeemQualifications', () => {
        it('should work', async () => {
            const ownerUser = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: ownerUser,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {},
                },
            });

            const plugin = await pluginRepository.save({
                name: PHYSICAL_REDEMPTION_PLUGIN_NAME,
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const anotherPlugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin1 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
                pluginDetail: {
                    recipients: new Array(100).fill(0).map((_, idx) => idx.toString()),
                },
            });

            await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
                pluginDetail: {
                    recipients: new Array(100).fill(0).map((_, idx) => idx.toString()),
                },
            });

            await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: anotherPlugin.id,
                name: faker.commerce.productName(),
                pluginDetail: {
                    recipients: new Array(100).fill(0).map((_, idx) => idx.toString()),
                },
            });

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            // mint token1
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: tokenId1,
                ownerAddress: randomWallet.address,
                properties: {},
            });
            // redeem collection plugin 1
            // and leave collection plugin 2 ready to redeem
            await redeemService.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: tokenId1,
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });

            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: tokenId2,
                ownerAddress: randomWallet.address,
                properties: {},
            });

            const tokenId3 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: tokenId3,
                ownerAddress: faker.finance.ethereumAddress(),
                properties: {},
            });

            const query = gql`
                query GetRedeemQualifications($collectionId: String!, $address: String!) {
                    getRedeemQualifications(collectionId: $collectionId, address: $address) {
                        tokenId
                        collection {
                            id
                        }
                        collectionPlugin {
                            id
                        }
                    }
                }
            `;

            const variables = {
                collectionId: collection.id,
                address: randomWallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getRedeemQualifications).toBeTruthy();
                    expect(body.data.getRedeemQualifications.length).toEqual(3);
                });
        });
    });
});
