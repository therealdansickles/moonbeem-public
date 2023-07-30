import { IPaginatedType } from './pagination.interface';
import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsObject, IsString } from 'class-validator';

@ObjectType('PageInfo')
export class PageInfo {
    @Field(() => Boolean, { description: 'Next page in the current paging results, Used to determine paging status' })
    @IsBoolean()
    readonly hasNextPage: boolean;

    @Field(() => Boolean, {
        description: 'Previous page in the current paging results, Used to determine paging status',
    })
    @IsBoolean()
    readonly hasPreviousPage: boolean;

    @Field(() => String, { nullable: true, description: 'Cursor value of the first item in the result set' })
    @IsString()
    readonly startCursor?: string;

    @Field(() => String, { nullable: true, description: 'Cursor value of the last item in the result set' })
    @IsString()
    readonly endCursor?: string;
}

export default function Paginated<T>(classRef: Type<T>) {
    @ObjectType(`${classRef.name}Edge`)
    abstract class EdgeType {
        @Field(() => String)
        readonly cursor?: string;

        @Field(() => classRef)
        readonly node: T;
    }

    @ObjectType(`${classRef.name}Connection`)
    abstract class PaginatedType implements IPaginatedType<T> {
        @Field(() => [EdgeType], { nullable: true, description: 'Return the result set' })
        @IsArray()
        readonly edges: Array<EdgeType>;

        @Field(() => PageInfo, { description: 'Cursor-based paging information' })
        @IsObject()
        readonly pageInfo: PageInfo;

        @Field(() => Int, { description: 'Total number of entity objects in query' })
        readonly totalCount: number;
    }

    return PaginatedType;
}