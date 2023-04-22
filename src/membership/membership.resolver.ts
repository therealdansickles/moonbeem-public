import { Public } from '../lib/decorators/public.decorator';
import { Resolver, Query, Args, Mutation, ResolveField, Parent } from '@nestjs/graphql';

import {
    Membership,
    CreateMembershipInput,
    UpdateMembershipInput,
    DeleteMembershipInput,
    MembershipRequestInput,
} from './membership.dto';
import { MembershipService } from './membership.service';
import { Organization } from '../organization/organization.dto';
import { OrganizationService } from '../organization/organization.service';
import { MailService } from '../mail/mail.service';
import { CurrenUser } from '../lib/decorators/curret-user.decorator';
import { AuthPayload } from '../auth/auth.service';

@Resolver(() => Membership)
export class MembershipResolver {
    constructor(
        private readonly membershipService: MembershipService,
        private readonly organizationService: OrganizationService,
        private mailService: MailService
    ) {}

    @Public()
    @Query(() => Membership, { description: 'Retrieve a membership by id.', nullable: true })
    async membership(@Args('id') id: string): Promise<Membership> {
        return await this.membershipService.getMembership(id);
    }

    @Public()
    @Mutation(() => Membership, { description: 'Create a new membership.' })
    async createMembership(
        @CurrenUser() user: AuthPayload,
        @Args('input') input: CreateMembershipInput
    ): Promise<Membership> {
        return await this.membershipService.createMembership(input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'Accept a membership request.' })
    async acceptMembership(@Args('input') input: MembershipRequestInput): Promise<boolean> {
        return await this.membershipService.acceptMembership(input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'Accept a membership request.' })
    async declineMembership(@Args('input') input: MembershipRequestInput): Promise<boolean> {
        return await this.membershipService.declineMembership(input);
    }

    @Public()
    @Mutation(() => Membership, { description: 'Update a membership.' })
    async updateMembership(@Args('input') input: UpdateMembershipInput): Promise<Membership> {
        const { id } = input;
        return await this.membershipService.updateMembership(id, input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'Deletes a membership.' })
    async deleteMembership(@Args('input') input: DeleteMembershipInput): Promise<boolean> {
        const { id } = input;
        return await this.membershipService.deleteMembership(id);
    }

    @Public()
    @ResolveField(() => Organization, { description: 'The organization the membership belongs to.' })
    async organization(@Parent() membership: Membership): Promise<Organization> {
        console.log(membership);
        const { organization } = membership;
        return await this.organizationService.getOrganization(organization.id);
    }
}