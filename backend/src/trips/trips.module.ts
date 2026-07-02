import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { PingProcessorService } from './ping-processor.service';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [AlertsModule],
  controllers: [TripsController],
  providers: [TripsService, PingProcessorService],
  // Exported so the demo engine can drive the real trip/ping pipeline in-process.
  exports: [TripsService, PingProcessorService],
})
export class TripsModule {}
