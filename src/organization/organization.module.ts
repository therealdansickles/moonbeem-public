import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { MailModule } from '../mail/mail.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { MembershipService } from '../membership/membership.service';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Organization } from './organization.entity';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { CoinModule } from '../sync-chain/coin/coin.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Collaboration, Membership, Organization, User, Tier, Wallet]),
        TypeOrmModule.forFeature([MintSaleTransaction], 'sync_chain'),
        forwardRef(() => CollaborationModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => MailModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => CoinModule),
        JwtModule,
    ],
    exports: [OrganizationModule, OrganizationService],
    providers: [JwtService, MembershipService, OrganizationService, OrganizationResolver, MintSaleTransactionService],
    controllers: [],
})
export class OrganizationModule {}
