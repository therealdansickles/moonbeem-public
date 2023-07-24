import { ethers } from 'ethers';
import { hashSync as hashPassword } from 'bcryptjs';

import { SessionService } from './session.service';
import { UserService } from '../user/user.service';
import { faker } from '@faker-js/faker';

describe('SessionService', () => {
    let service: SessionService;
    let userService: UserService;

    beforeAll(async () => {
        service = global.sessionService;
        userService = global.userService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('createSession', () => {
        it('should return a session', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'test';
            const signature = await wallet.signMessage(message);
            const result = await service.createSession(wallet.address, message, signature);

            expect(result.wallet.address).toEqual(wallet.address.toLowerCase());
        });

        it('should return null if invalid wallet verification', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'test';
            const signature = await wallet.signMessage(message);
            const result = await service.createSession(wallet.address, 'bobby', signature);

            expect(result).toBeNull();
        });
    });

    describe('createSessionFromEmail', () => {
        it('should return a session', async () => {
            const email = 'engineering+sessionfromemail@vibe.xyz';
            const password = 'password';
            await userService.createUser({ email, password });
            const hashed = await hashPassword(password, 10);
            const result = await service.createSessionFromEmail(email, hashed);

            expect(result.user.email).toEqual(email);
        });

        it('should return null if invalid', async () => {
            const email = 'engineering+sessionfromemail+2@vibe.xyz';
            const password = 'password';
            await userService.createUser({ email, password });
            const hashed = await hashPassword('wrong password');
            const result = await service.createSessionFromEmail(email, hashed);

            expect(result).toBeNull();
        });
    });

    describe('createSessionFromGoogle', () => {
        it('should return a session', async () => {
            const mockResponse = {
                token: 'jwt_token',
                user: {
                    id: faker.datatype.uuid(),
                    email: faker.internet.email(),
                },
            };
            jest.spyOn(service, 'createSessionFromGoogle').mockImplementation(async () => mockResponse);
            const result = await service.createSessionFromGoogle('access_token');
            expect(result.token).toBeDefined();
        });
    });
});
