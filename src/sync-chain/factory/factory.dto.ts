import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ContractType } from './factory.entity';

registerEnumType(ContractType, { name: 'ContractType' });

@ObjectType('Factory')
export class Factory {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @IsNumber()
    @Field({ description: 'Block height of transaction.' })
    readonly height: number;

    @IsString()
    @Field({ description: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @IsString()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @IsString()
    @Field({ description: 'Transaction sender of transaction.' })
    readonly sender: string;

    @IsString()
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @IsString()
    @Field({ description: 'The master contract address.' })
    readonly masterAddress: string;

    @Field(() => ContractType, { description: 'The type of Contract.' })
    readonly kind?: ContractType;

    @IsNumber()
    @Field({ description: 'The chain id for the factory' })
    readonly chainId?: number;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}

@InputType()
export class GetFactoriesInput {
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a collection.', nullable: true })
    @IsOptional()
    readonly chainId?: number;
}
