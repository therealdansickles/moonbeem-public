import { Body, Controller, DefaultValuePipe, Get, Inject, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VUploadImageReqDto, VUploadImageRsp } from '../dto/upload.dto.js';
import { Public } from '../lib/decorators/public.decorator.js';
import { IResponse, ResponseInternalError, ResponseSucc } from '../lib/interfaces/response.interface.js';
import { UploadService } from '../services/upload.service.js';

@ApiTags('Upload')
@Controller({
    path: 'upload',
    version: '1',
})
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Public()
    @ApiResponse({
        status: 200,
        description: 'upload an image file to cdn',
        type: VUploadImageRsp,
    })
    @Post('/asset')
    public async uploadImage(@Req() req: Request, @Body() body: VUploadImageReqDto): Promise<IResponse> {
        try {
            var rsp = await this.uploadService.handleImage(body);
            return new ResponseSucc(rsp);
        } catch (error) {
            console.log('err', error);
            return new ResponseInternalError((error as Error).message);
        }
    }
}
