import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { CoinModule } from './coin.module';
import { Coin } from './coin.entity';
import { CoinService } from './coin.service';

describe.only('CoinService', () => {
    let repository: Repository<Coin>;
    let service: CoinService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                CoinModule,
            ],
        }).compile();

        repository = module.get('sync_chain_CoinRepository');
        service = module.get<CoinService>(CoinService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Coin" CASCADE');
    });

    describe('coin', () => {
        it('should get an coin', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const result = await service.getCoin(coin.id);
            expect(result.id).toEqual(coin.id);
        });

        it('should get coin list', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const data = { chainId: 1 };
            const result = await service.getCoins(data);
            expect(result.length).toEqual(2);
        });
    });
});