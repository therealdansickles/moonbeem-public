import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf, IsOptional, IsEthereumAddress } from 'class-validator';

@ObjectType('Waitlist')
export class Waitlist {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    id: string;

    @Field()
    @IsString()
    email: string;

    @ApiProperty()
    @IsEthereumAddress()
    @Field({ description: 'The address for a wallet.' })
    address: string;

    @Field()
    @IsNumber()
    seatNumber: number;

    @Field()
    @IsString()
    @IsOptional()
    twitter?: string;
}

@InputType('CreateWaitlistInput')
export class CreateWaitlistInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'The email of the user' })
    readonly email: string;

    @ApiProperty()
    @IsEthereumAddress() // we can use IsEthereumAddress() here, but we want to support EIP-3770 address format.
    @Field({ description: 'The address for a wallet.' })
    readonly address: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The email of the user', nullable: true })
    @IsOptional()
    readonly twitter?: string;
}