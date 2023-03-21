import { Module } from '@nestjs/common';
import { EvmChain, NftscanEvm } from 'nftscan-api';
import { BetaWaitlistController } from '../controllers/beta.waitlist.controller';
import { BetaWaitlistService } from '../services/beta.waitlist.service';
import { SharedModule } from './share.module';

@Module({
    imports: [SharedModule],
    providers: [
        BetaWaitlistService,
        {
            provide: 'NFT_SCAN',
            useFactory: async () => {
                const config = {
                    apiKey: process.env.NFTSCAN_API, // Replace with your NFTScan API key.
                    chain: EvmChain.ETH, // Replace with your chain.
                };

                const evm = new NftscanEvm(config);
                return evm;
            },
        },
    ],
    controllers: [BetaWaitlistController],
    exports: [BetaWaitlistService],
})
export class BetaWaitlistModule {}
