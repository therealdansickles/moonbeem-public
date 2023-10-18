import { forwardRef, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { Organization } from '../organization/organization.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier } from '../tier/tier.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Redeem } from './redeem.entity';
import { RedeemResolver } from './redeem.resolver';
import { RedeemService } from './redeem.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, CollectionPlugin, Organization, Tier, Wallet, Redeem]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => MintSaleContractModule),
        JwtModule,
    ],
    exports: [RedeemModule],
    providers: [JwtService, Asset721Service, RedeemResolver, RedeemService],
})
export class RedeemModule {}
