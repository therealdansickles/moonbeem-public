import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { Record721 } from './record721.entity';
import { Record721Module } from './record721.module';
import { Record721Service } from './record721.service';

describe.only('Record721Service', () => {
    let repository: Repository<Record721>;
    let service: Record721Service;

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
                    dropSchema: true,
                }),
                Record721Module,
            ],
        }).compile();

        repository = module.get('sync_chain_Record721Repository');
        service = module.get<Record721Service>(Record721Service);
    });

    describe('erc721 record', () => {
        it('should get an contract', async () => {
            const record = await service.createRecord721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                name: 'USC Coin',
                symbol: 'USDC',
                baseUri: 'https://',
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getRecord721(record.id);
            expect(result.id).toEqual(record.id);
        });
    });
});
