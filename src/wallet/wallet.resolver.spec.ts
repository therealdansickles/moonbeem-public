import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { ethers } from 'ethers';
import { hashSync as hashPassword } from 'bcryptjs';

import { WalletModule } from './wallet.module';
import { WalletService } from './wallet.service';
import { UserService } from '../user/user.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';

import { TierService } from '../tier/tier.service';
import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { RelationshipService } from '../relationship/relationship.service';
import { SessionModule } from '../session/session.module';
import { SessionService } from '../session/session.service';

export const gql = String.raw;

describe('WalletResolver', () => {
    let service: WalletService;
    let collectionService: CollectionService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;
    let tierService: TierService;
    let userService: UserService;
    let relationshipService: RelationshipService;
    let sessionService: SessionService;
    let app: INestApplication;
    let address: string;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                WalletModule,
                SessionModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [WalletModule, SessionModule],
                }),
            ],
        }).compile();

        service = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);
        mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);
        mintSaleContractService = module.get<MintSaleContractService>(MintSaleContractService);
        tierService = module.get<TierService>(TierService);
        userService = module.get<UserService>(UserService);
        relationshipService = module.get<RelationshipService>(RelationshipService);
        sessionService = module.get<SessionService>(SessionService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('wallet', () => {
        it('should get a wallet', async () => {
            const address = faker.finance.ethereumAddress();
            await service.createWallet({ address });
            const query = gql`
                query GetWallet($address: String!) {
                    wallet(address: $address) {
                        address
                    }
                }
            `;
            const variables = { address };
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.address).toEqual(address);
                });
        });

        it('should get a wallet by name', async () => {
            const address = faker.finance.ethereumAddress();
            const name = 'dogvibe';
            await service.createWallet({ address, name });
            const query = gql`
                query GetWallet($name: String!) {
                    wallet(name: $name) {
                        name
                        address
                    }
                }
            `;
            const variables = { name };
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.address).toEqual(address);
                    expect(body.data.wallet.name).toEqual(name);
                });
        });

        it('should create a wallet', async () => {
            address = faker.finance.ethereumAddress();
            const user = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const query = gql`
                mutation CreateWallet($input: CreateWalletInput!) {
                    createWallet(input: $input) {
                        id
                        address
                        owner {
                            email
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address,
                    ownerId: user.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createWallet.address).toEqual(address);
                    expect(body.data.createWallet.owner.id).toEqual(user.id);
                });
        });
    });

    describe('updateWallet', () => {
        it('should update a wallet', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });
            const session = await sessionService.createSession(wallet.address, message, signature);

            const query = gql`
                mutation UpdateWallet($input: UpdateWalletInput!) {
                    updateWallet(input: $input) {
                        address
                        name
                    }
                }
            `;

            const variables = {
                input: {
                    id: wallet.id,
                    address: wallet.address,
                    name: faker.internet.userName(),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(session.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateWallet.name).toEqual(variables.input.name);
                });
        });

        it('should forbid if no session provided', async () => {
            const randomWallet = ethers.Wallet.createRandom();

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });

            const query = gql`
                mutation UpdateWallet($input: UpdateWalletInput!) {
                    updateWallet(input: $input) {
                        address
                        name
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    name: faker.internet.userName(),
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

        it("should forbid if candidate wallet id isn't equal the one extract from token", async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });
            const session = await sessionService.createSession(wallet.address, message, signature);

            const anotherWallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const query = gql`
                mutation UpdateWallet($input: UpdateWalletInput!) {
                    updateWallet(input: $input) {
                        address
                        name
                    }
                }
            `;

            const variables = {
                input: {
                    id: anotherWallet.id,
                    address: wallet.address,
                    name: faker.internet.userName(),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(session.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeTruthy();
                    expect(body.data).toBeFalsy();
                });
        });
    });

    describe('bindWallet', () => {
        it('should forbid if not signed in', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            const owner = await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });

            const query = gql`
                mutation BindWallet($input: BindWalletInput!) {
                    bindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    owner: { id: owner.id },
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
                    expect(body.data).toBeNull();
                });
        });

        it('should bind a wallet', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            const owner = await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });

            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: await hashPassword(owner.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;
            const query = gql`
                mutation BindWallet($input: BindWalletInput!) {
                    bindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    owner: { id: owner.id },
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.bindWallet.owner.id).toEqual(variables.input.owner.id);
                });
        });

        it('should bind a wallet even if the wallet doesnt exist', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            const owner = await userService.createUser({
                name,
                email,
                password,
            });

            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: await hashPassword(owner.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation BindWallet($input: BindWalletInput!) {
                    bindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                    owner: { id: owner.id },
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.bindWallet.address).toEqual(randomWallet.address.toLowerCase());
                    expect(body.data.bindWallet.owner.id).toEqual(variables.input.owner.id);
                });
        });
    });

    describe('unbindWallet', () => {
        it('should unbind a wallet', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const owner = await userService.createUser({
                name: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const wallet = await service.createWallet({ address: randomWallet.address });
            await service.bindWallet({
                address: wallet.address,
                owner: { id: owner.id },
                message,
                signature,
            });

            const query = gql`
                mutation UnbindWallet($input: UnbindWalletInput!) {
                    unbindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    owner: { id: owner.id },
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.unbindWallet.owner).toEqual(null);
                    // expect(body.data.unbindWallet.owner.id).not.toEqual(owner.id);
                    // expect(body.data.unbindWallet.owner.id).toEqual('00000000-0000-0000-0000-000000000000');
                });
        });
    });

    describe('relationships', () => {
        it('should return followersTotal and followingsTotal', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followingWallet1 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followingWallet2 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followerWallet1 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followerWallet2 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followerWallet3 = await service.createWallet({ address: faker.finance.ethereumAddress() });

            await relationshipService.createRelationshipByAddress({
                followingAddress: wallet.address,
                followerAddress: followerWallet1.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: wallet.address,
                followerAddress: followerWallet2.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: wallet.address,
                followerAddress: followerWallet3.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: followingWallet1.address,
                followerAddress: wallet.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: followingWallet2.address,
                followerAddress: wallet.address,
            });

            const query = gql`
                query Wallet($address: String!) {
                    wallet(address: $address) {
                        id
                        address
                        followingsTotal
                        followersTotal
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.followingsTotal).toEqual(2);
                    expect(body.data.wallet.followersTotal).toEqual(3);
                });
        });
    });

    describe('minted', () => {
        it('should get minted NFTs', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
            });

            const transaction = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                chainId: faker.random.numeric(5),
            });

            const query = gql`
                query MintedByWallet($address: String!) {
                    wallet(address: $address) {
                        minted {
                            address
                            txTime
                            txHash
                            chainId

                            tier {
                                name

                                collection {
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const [firstMint] = body.data.wallet.minted;
                    expect(firstMint.address).toEqual(collection.address); // NOTE: These horrible `address` namings, which one is it???
                    expect(firstMint.txTime).toEqual(transaction.txTime);
                    expect(firstMint.txHash).toEqual(transaction.txHash);
                    expect(firstMint.chainId).toEqual(transaction.chainId);
                    expect(firstMint.tier.name).toEqual(tier.name);
                    expect(firstMint.tier.collection.name).toEqual(collection.name);
                });
        });
    });

    describe('activities', () => {
        it('should get activities by wallet address', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
            });

            const transaction = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                chainId: faker.random.numeric(5),
            });

            const query = gql`
                query AddressByWallet($address: String!) {
                    wallet(address: $address) {
                        activities {
                            address
                            type
                            tokenAddress
                            tokenId
                            txTime
                            txHash
                            chainId

                            tier {
                                name

                                collection {
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const [firstMint] = body.data.wallet.activities;
                    expect(firstMint.address).toEqual(collection.address); // NOTE: These horrible `address` namings, which one is it???
                    expect(firstMint.txTime).toEqual(transaction.txTime);
                    expect(firstMint.txHash).toEqual(transaction.txHash);
                    expect(firstMint.chainId).toEqual(transaction.chainId);
                    expect(firstMint.tier.name).toEqual(tier.name);
                    expect(firstMint.tier.collection.name).toEqual(collection.name);
                });
        });
    });

    describe('getEstimatedValue', () => {
        it('should get estimated value', async () => {
            const sender1 = faker.finance.ethereumAddress();

            const wallet = await service.createWallet({ address: sender1 });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
            });

            const paymentToken = faker.finance.ethereumAddress();

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken,
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                royaltyReceiver: sender1,
                royaltyRate: faker.random.numeric(2),
                derivativeRoyaltyRate: faker.random.numeric(2),
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().valueOf() / 1000),
                endTime: Math.floor(faker.date.future().valueOf() / 1000),
                price: faker.random.numeric(5),
                tierId: tier.tierId,
                address: collection.address,
                paymentToken,
                startId: 0,
                endId: 10,
                currentId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const query = gql`
                query GetEstimatedValueByWallet($address: String!) {
                    wallet(address: $address) {
                        id
                        address
                        estimatedValue {
                            total
                            totalUSDC
                            paymentTokenAddress
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.estimatedValue).toBeDefined();
                    expect(+body.data.wallet.estimatedValue[0].total).toBeGreaterThan(0);
                    expect(+body.data.wallet.estimatedValue[0].paymentTokenAddress).toBeDefined();
                });
        });
    });

    describe('createdCollections', () => {
        it('should get created collections by wallet', async () => {
            const wallet = await service.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [],
                creator: { id: wallet.id },
            });

            const query = gql`
                query CreatedCollections($address: String!) {
                    wallet(address: $address) {
                        createdCollections {
                            name
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const [firstCollection] = body.data.wallet.createdCollections;
                    expect(firstCollection.name).toEqual(collection.name);
                });
        });
    });
});
