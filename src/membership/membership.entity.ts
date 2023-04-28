import {
    Entity,
    Column,
    JoinColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    Index,
} from 'typeorm';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';

@Entity({ name: 'Membership' })
@Index(['user.id', 'organization.id'], { unique: true })
export class Membership extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.memberships, { eager: true, createForeignKeyConstraints: false })
    @JoinColumn()
    user: User;

    @ManyToOne(() => Organization, (organization) => organization.memberships, {
        eager: true,
        createForeignKeyConstraints: false,
    })
    @JoinColumn()
    organization: Organization;

    @Column({ nullable: true, comment: 'The invite code for the membership invite' })
    inviteCode?: string;

    @Column({ default: false, comment: 'Can edit draft collections.' })
    canEdit: boolean;

    @Column({ default: false, comment: 'Can manage the organization members.' })
    canManage: boolean;

    @Column({ default: false, comment: 'Can deploy collections to the platform.' })
    canDeploy: boolean;

    @Column({ nullable: true, comment: 'Date the user accepted the invite' })
    acceptedAt: Date;

    @Column({ nullable: true, comment: 'Date the user declined the invite' })
    declinedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
