import { Controller, DefaultValuePipe, Get, Inject, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { NftscanEvm } from 'nftscan-api';
import { VBetaWaitlistLeaderboardRsp, VBetaWaitlistScoreRsp, VGetAddressScoreReq } from '../dto/beta.waitlist.dto.js';
import { Public } from '../lib/decorators/public.decorator.js';
import { AppService } from '../services/app.service.js';
import { BetaWaitlistService } from '../services/beta.waitlist.service.js';

@ApiTags('BetaWaitlist')
@Controller({
    path: 'waitlist',
    version: '1',
})
export class BetaWaitlistController {
    constructor(private readonly betaWaitlistService: BetaWaitlistService) {}

    @Public()
    @ApiResponse({
        status: 200,
        description: 'get beta waitlist leaderboard',
        type: VBetaWaitlistLeaderboardRsp,
    })
    @Get('/leaderboard')
    async getLeaderboard(@Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number, @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number) {
        return this.betaWaitlistService.getLeaderboard(page, pageSize);
    }

    @Public()
    @ApiResponse({
        status: 200,
        description: 'check address nft volume score',
        type: VBetaWaitlistScoreRsp,
    })
    @Get('/:address')
    async getScore(@Param() param: VGetAddressScoreReq) {
        return this.betaWaitlistService.calculateScore(param.address);
    }
}
