import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Nft } from '../nft/nft.entity';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { Wallet } from '../wallet/wallet.entity';
import { Plugin } from './plugin.entity';
import { PluginService } from './plugin.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plugin, Collection, Tier, Nft, Wallet]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => TierModule),
        forwardRef(() => OpenseaModule),
        HttpModule
    ],
    providers: [PluginService, TierService, CollectionService, OpenseaService],
})
export class PluginModule {}