import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { PingProcessorService } from './ping-processor.service';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [AlertsModule],
  controllers: [TripsController],
  providers: [TripsService, PingProcessorService],
})
export class TripsModule {}
