import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from 'src/lib/decorators/public.decorator';
import { VAddressHoldingReqDto, VAddressHoldingRspDto } from 'src/dto/market.dto';
import { IResponse, ResponseInternalError, ResponseSucc } from 'src/lib/interfaces/response.interface';
import { MarketService } from 'src/services/market.service';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JWTService } from 'src/services/jwt.service';

@ApiTags('Market')
@ApiSecurity('session') // swagger authentication, in header.session
@Controller({
    path: 'market',
    version: '1',
})
export class MarketController {
    constructor(private readonly marketService: MarketService, private readonly jwtService: JWTService) {}

    @Public()
    @ApiResponse({
        type: VAddressHoldingRspDto,
    })
    @Get('/get_address_holdings')
    public async getAddressHoldings(@Req() req: Request, @Query() args: VAddressHoldingReqDto): Promise<IResponse> {
        try {
            const payload = await this.jwtService.verifySession(req.headers.session);
            const rsp = await this.marketService.getAddressHoldings(args, payload);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
