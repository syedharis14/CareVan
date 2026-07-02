import { Module } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({
  imports: [TripsModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
