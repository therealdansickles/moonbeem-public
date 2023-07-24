import { JwtModule, JwtService } from '@nestjs/jwt';
import { Module, forwardRef } from '@nestjs/common';

import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import {
    MintSaleTransactionModule
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Nft } from '../nft/nft.entity';
import { Tier } from './tier.entity';
import { TierResolver } from './tier.resolver';
import { TierService } from './tier.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Tier, Nft, Wallet]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => WalletModule),
        forwardRef(() => UserModule),
        // sync_chain modules
        forwardRef(() => CoinModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
        JwtModule
    ],
    exports: [TierModule],
    providers: [JwtService, TierService, TierResolver],
})
export class TierModule {}
