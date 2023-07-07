import { merge, sort, unique } from 'lodash';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { MetadataInput } from '../metadata/metadata.dto';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier as TierDto } from '../tier/tier.dto';
import { Tier } from '../tier/tier.entity';
import { TierService } from '../tier/tier.service';
import { Wallet } from '../wallet/wallet.entity';
import { Plugin } from './plugin.entity';

@Injectable()
export class PluginService {
    constructor(
        @InjectRepository(Plugin) private readonly pluginRepository: Repository<Plugin>,
        private tierService: TierService,
        private collectionService: CollectionService,
    ) {}

    /**
     * Retrieve all plugins
     * @returns
     */
    async getPlugins(): Promise<Plugin[]> {
        return await this.pluginRepository.findBy({ isPublish: true });
    }

    /**
     * Retrieve a plugin by id.
     *
     * @param id The id of the plugin to retrieve.
     * @returns The plugin.
     */
    async getPlugin(id: string): Promise<Plugin> {
        return await this.pluginRepository.findOneBy({ id });
    }

    /**
     * Install a plugin on the given tier, with customized config of metadata
     *
     * @param payload
     * @returns
     */
    async installOnTier(payload: { tier: TierDto, plugin: Plugin, metadata: MetadataInput}) {
        const { tier, plugin, metadata } = payload;
        const { uses = [], properties = {}, conditions = {} } = tier.metadata;
        const metadataPayload = {
            // add plugin name on uses
            uses: sort(unique(uses.push(plugin.name))),
            // merge properties
            properties: merge(properties, metadata.properties),
            // merge conditions
            conditions: merge(conditions, metadata.conditions)
        }
        await this.tierService.updateTier(tier.id, { metadata: metadataPayload });
        return this.tierService.getTier(tier.id)
    }
}