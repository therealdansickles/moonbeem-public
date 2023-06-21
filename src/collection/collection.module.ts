import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { Redeem } from '../redeem/redeem.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Coin } from '../sync-chain/coin/coin.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import {
    MintSaleTransactionModule
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Collection } from './collection.entity';
import { CollectionResolver } from './collection.resolver';
import { CollectionService } from './collection.service';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, Tier, Wallet, Redeem]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => CollaborationModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => OrganizationModule),
        forwardRef(() => TierModule),
        forwardRef(() => WalletModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => UserModule),
        JwtModule,
    ],
    exports: [CollectionModule, CollectionService],
    providers: [JwtService, OpenseaService, TierService, CollectionService, CollectionResolver],
    controllers: [],
})
export class CollectionModule {}
