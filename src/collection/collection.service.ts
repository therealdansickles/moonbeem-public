import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, IsNull } from 'typeorm';
import { Collection, CollectionKind } from './collection.entity';
import { GraphQLError } from 'graphql';
import { Tier } from '../tier/tier.entity';
import { CreateCollectionInput } from './collection.dto';

@Injectable()
export class CollectionService {
    constructor(
        @InjectRepository(Collection)
        private readonly collectionRepository: Repository<Collection>,

        @InjectRepository(Tier)
        private readonly tierRepository: Repository<Tier>
    ) {}

    /**
     * Retrieves the collection associated with the given id.
     *
     * @param id The id of the collection to retrieve.
     * @returns The collection associated with the given id.
     */
    async getCollection(id: string): Promise<Collection | null> {
        return this.collectionRepository.findOne({ where: { id }, relations: ['organization', 'tiers'] });
    }

    /**
     * Retrieves the collection associated with the given address.
     *
     * @param address The address of the collection to retrieve.
     * @returns The collection associated with the given address.
     */
    async getCollectionByAddress(address: string): Promise<Collection | null> {
        return this.collectionRepository.findOne({ where: { address }, relations: ['organization'] });
    }

    /**
     * Retrieves the collection associated with the given organization.
     *
     * @param organizationId The id of the organization to retrieve.
     * @returns The collection associated with the given organization.
     */
    async getCollectionsByOrganizationId(organizationId: string): Promise<Collection[]> {
        return this.collectionRepository.find({
            where: { organization: { id: organizationId } },
            relations: ['organization', 'tiers'],
        });
    }

    /**
     * Creates a new collection with the given data.
     *
     * @param data The data to use when creating the collection.
     * @returns The newly created collection.
     */
    async createCollection(data: any): Promise<Collection> {
        try {
            return this.collectionRepository.save(data);
        } catch (e) {
            throw new GraphQLError('Failed to create new collection.', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Updates a collection.
     *
     * @param params The id of the collection to update and the data to update it with.
     * @returns A boolean if it updated succesfully.
     */
    async updateCollection(id: string, data: any): Promise<boolean> {
        try {
            const result: UpdateResult = await this.collectionRepository.update(id, data);
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to update collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Publishes a collection.
     *
     * @param id The id of the collection to publish.
     * @returns A boolean if it published successfully.
     */
    async publishCollection(id: string): Promise<boolean> {
        try {
            const result: UpdateResult = await this.collectionRepository.update(id, { publishedAt: new Date() });
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to publish collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * TODO: Fix this and make it a soft deletion.
     *
     * Deletes a collection if it is not published.
     *
     * @param id The id of the collection to delete.
     * @returns true if the collection was deleted, false otherwise.
     */
    async deleteCollection(id: string): Promise<boolean> {
        try {
            const result = await this.collectionRepository.delete({ id, publishedAt: IsNull() });
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to delete collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    async createCollectionWithTiers(data: CreateCollectionInput) {
        const { tiers, ...collection } = data;
        const kind = CollectionKind;
        if ([kind.whitelistEdition, kind.whitelistTiered, kind.whitelistBulk].indexOf(collection.kind) >= 0) {
            tiers.forEach((tier) => {
                if (!tier.merkleRoot)
                    throw new GraphQLError('Please provide merkleRoot for the whitelisting collection.');
            });
        }

        const createResult = await this.collectionRepository.save(collection as Collection);

        if (data.tiers) {
            tiers.forEach(async (tier) => {
                const dd = tier as unknown as Tier;
                dd.collection = createResult.id as unknown as Collection;
                const attributesJson = JSON.stringify(tier.attributes);
                dd.attributes = attributesJson;

                try {
                    return await this.tierRepository.save(dd);
                } catch (e) {
                    throw new GraphQLError(`Failed to create tier ${data.name}`, {
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }
            });
        }

        const result = await this.collectionRepository.findOne({
            where: { id: createResult.id },
            relations: ['tiers'],
        });
        return result;
    }
}
