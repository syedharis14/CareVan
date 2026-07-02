import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DemoStartResponse, DemoStatusResponse } from '@carevan/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { DemoService } from './demo.service';

@Roles('ADMIN')
@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  start(): Promise<DemoStartResponse> {
    return this.demo.start();
  }

  @Get('status')
  status(): DemoStatusResponse {
    return this.demo.status();
  }
}
