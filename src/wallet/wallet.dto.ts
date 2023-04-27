import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsEthereumAddress, IsUrl, ValidateIf, IsObject } from 'class-validator';
import { User, UserInput } from '../user/user.dto';

@ObjectType('Wallet')
export class Wallet {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!, { description: 'The id for a wallet.' })
    readonly id: string;

    @ApiProperty()
    @IsEthereumAddress()
    @Field({ description: 'The address for a wallet.' })
    readonly address: string;

    @ApiProperty()
    @IsObject()
    @Field({ description: 'The owner of the wallet.', nullable: true })
    readonly owner?: User;
}

@InputType()
export class CreateWalletInput {
    @ApiProperty()
    @IsString() // we can use IsEthereumAddress() here, but we want to support EIP-3770 address format.
    @Field({ description: 'The address for a wallet.' })
    readonly address: string;

    @ApiProperty()
    @IsString() // we can use IsEthereumAddress() here, but we want to support EIP-3770 address format.
    @Field({ description: 'The id for the owner.', nullable: true })
    readonly ownerId?: string;
}

@InputType('BindWalletInput')
export class BindWalletInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'an ethereum or EIP-3770 address.' })
    readonly address: string;

    @Field({ description: 'The signing message' })
    @ApiProperty()
    @IsString()
    readonly message: string;

    @Field({ description: 'The signature from the front-end to verify' })
    @ApiProperty()
    @IsString()
    readonly signature: string;

    @ApiProperty()
    @IsObject()
    @Field((type) => UserInput, { description: 'the owner uuid of the wallet.' })
    readonly owner: UserInput;
}

@InputType('UnbindWalletInput')
export class UnbindWalletInput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'an ethereum or EIP-3770 address.' })
    readonly address: string;

    @ApiProperty()
    @IsObject()
    @Field((type) => UserInput, { description: 'the owner uuid of the wallet.' })
    readonly owner: UserInput;
}
