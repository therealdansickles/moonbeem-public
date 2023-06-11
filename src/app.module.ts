import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RavenInterceptor, RavenModule } from 'nest-raven';

import { CollaborationModule } from './collaboration/collaboration.module';
import { CollectionModule } from './collection/collection.module';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { MembershipModule } from './membership/membership.module';
import { Module } from '@nestjs/common';
import { MongoAdapter } from './lib/adapters/mongo.adapter';
import { MoonpayModule } from './moonpay/moonpay.module';
import { NftModule } from './nft/nft.module';
import { OpenseaModule } from './opensea/opensea.module';
import { OrganizationModule } from './organization/organization.module';
import { PollerModule } from './poller/poller.module';
import { RedeemModule } from './redeem/redeem.module';
import { RedisAdapter } from './lib/adapters/redis.adapter';
import { RelationshipModule } from './relationship/relationship.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SearchModule } from './search/search.module';
import { SessionGuard } from './session/session.guard';
import { SessionModule } from './session/session.module';
import { SyncChainModule } from './sync-chain/sync-chain.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from './modules/upload.module';
import { UserModule } from './user/user.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { WalletModule } from './wallet/wallet.module';
import { appConfig } from './lib/configs/app.config';
import configuration from '../config';

@Module({
    imports: [
        CollaborationModule,
        CollectionModule,
        MembershipModule,
        OrganizationModule,
        PollerModule,
        RavenModule,
        SearchModule,
        SessionModule,
        SyncChainModule,
        UploadModule,
        UserModule,
        WaitlistModule,
        WalletModule,
        RelationshipModule,
        OpenseaModule,
        MoonpayModule,
        RedeemModule,
        NftModule,
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            load: [configuration]
        }),
        // integration graphql
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver, // GraphQL server adapter
            debug: appConfig.global.debug ? true : false, // is debug?
            playground: appConfig.global.debug ? true : false, // is show platground? waiting for fix: throw an error when set it true
            autoSchemaFile: true,
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                name: configService.get('platformPostgresConfig.name'),
                type: configService.get('platformPostgresConfig.type'),
                url: configService.get('platformPostgresConfig.url'),
                autoLoadEntities: configService.get('platformPostgresConfig.autoLoadEntities'),
                synchronize: configService.get('platformPostgresConfig.synchronize'),
                logging: configService.get('platformPostgresConfig.logging'),
            })
        }),
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        OpenseaModule,
        MoonpayModule,
        SaleHistoryModule,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useValue: new RavenInterceptor(),
        },
        {
            provide: APP_GUARD,
            useClass: SessionGuard,
        },
        MongoAdapter,
        RedisAdapter,
    ],
    exports: [],
})
export class AppModule {}
