import { Module } from '@nestjs/common';
import { VansController } from './vans.controller';
import { VansService } from './vans.service';

@Module({
  controllers: [VansController],
  providers: [VansService],
})
export class VansModule {}
