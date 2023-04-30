import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { User } from './user.entity';
import { UserModule } from './user.module';
import { AuthModule } from '../auth/auth.module';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';

export const gql = String.raw;

describe('UserResolver', () => {
    let repository: Repository<User>;
    let service: UserService;
    let app: INestApplication;
    let authService: AuthService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                UserModule,
                AuthModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [AuthModule, UserModule],
                }),
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        repository = module.get('UserRepository');
        authService = module.get<AuthService>(AuthService);
        app = module.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "User" CASCADE');
        await app.close();
    });

    describe('getUser', () => {
        it('should get an user', async () => {
            const credentials = await authService.createUserWithEmail({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const user = credentials.user;
            const query = gql`
                query GetUser($id: String!) {
                    user(id: $id) {
                        id
                        email
                        avatarUrl
                        backgroundUrl
                        websiteUrl
                        twitter
                        instagram
                        discord

                        wallets {
                            id
                        }
                    }
                }
            `;

            const variables = { id: user.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(credentials.sessionToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.id).toEqual(user.id);
                    expect(body.data.user.email).toEqual(user.email);
                    expect(body.data.user.avatarUrl).toBeDefined();
                    expect(body.data.user.avatarUrl).toBeDefined();
                    expect(body.data.user.backgroundUrl).toBeDefined();
                    expect(body.data.user.websiteUrl).toBeDefined();
                    expect(body.data.user.twitter).toBeDefined();
                    expect(body.data.user.instagram).toBeDefined();
                    expect(body.data.user.discord).toBeDefined();
                    expect(body.data.user.wallets).toBeDefined();
                });
        });
    });

    describe('updateUser', () => {
        it('should update an user', async () => {
            const credentials = await authService.createUserWithEmail({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const user = credentials.user;
            const query = gql`
                mutation updateUser($input: UpdateUserInput!) {
                    updateUser(input: $input) {
                        id
                        email
                        username
                        avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    id: user.id,
                    username: faker.internet.userName(),
                    email: faker.internet.email(),
                    avatarUrl: faker.internet.avatar(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(credentials.sessionToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateUser.id).toEqual(user.id);
                    expect(body.data.updateUser.email).toEqual(variables.input.email);
                    expect(body.data.updateUser.username).toEqual(variables.input.username);
                    expect(body.data.updateUser.avatarUrl).toEqual(variables.input.avatarUrl);
                });
        });
    });
});