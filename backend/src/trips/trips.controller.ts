import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ActiveTripResponse,
  ListTripsQuery,
  ListTripsQuerySchema,
  ListTripsResponse,
  LiveTripsResponse,
  PostPingsRequest,
  PostPingsRequestSchema,
  PostPingsResponse,
  PostTripEventsRequest,
  PostTripEventsRequestSchema,
  PostTripEventsResponse,
  SosRequest,
  SosRequestSchema,
  SosResponse,
  StartTripRequest,
  StartTripRequestSchema,
  TripDetailResponse,
  TripResponse,
} from '@carevan/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthPrincipal } from '../common/types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PingProcessorService } from './ping-processor.service';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly pingProcessor: PingProcessorService,
  ) {}

  @Roles('DRIVER')
  @Post()
  start(
    @CurrentUser() driver: AuthPrincipal,
    @Body(new ZodValidationPipe(StartTripRequestSchema)) body: StartTripRequest,
  ): Promise<TripResponse> {
    return this.tripsService.start(driver, body);
  }

  @Roles('DRIVER')
  @Get('mine/active')
  mineActive(@CurrentUser() driver: AuthPrincipal): Promise<ActiveTripResponse> {
    return this.tripsService.mineActive(driver);
  }

  // Registered before ':id' so "live" isn't captured as a trip id.
  @Roles('ADMIN')
  @Get('live')
  live(): Promise<LiveTripsResponse> {
    return this.tripsService.live();
  }

  @Roles('ADMIN')
  @Get()
  list(
    @Query(new ZodValidationPipe(ListTripsQuerySchema)) query: ListTripsQuery,
  ): Promise<ListTripsResponse> {
    return this.tripsService.list(query);
  }

  @Roles('ADMIN', 'DRIVER')
  @Get(':id')
  detail(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') id: string,
  ): Promise<TripDetailResponse> {
    return this.tripsService.detail(principal, id);
  }

  @Roles('DRIVER')
  @HttpCode(HttpStatus.OK)
  @Post(':id/end')
  end(@CurrentUser() driver: AuthPrincipal, @Param('id') id: string): Promise<TripResponse> {
    return this.tripsService.end(driver, id, false);
  }

  @Roles('DRIVER')
  @HttpCode(HttpStatus.OK)
  @Post(':id/abort')
  abort(@CurrentUser() driver: AuthPrincipal, @Param('id') id: string): Promise<TripResponse> {
    return this.tripsService.end(driver, id, true);
  }

  @Roles('DRIVER')
  @HttpCode(HttpStatus.OK)
  @Post(':id/events')
  postEvents(
    @CurrentUser() driver: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PostTripEventsRequestSchema)) body: PostTripEventsRequest,
  ): Promise<PostTripEventsResponse> {
    return this.tripsService.postEvents(driver, id, body);
  }

  @Roles('DRIVER')
  @HttpCode(HttpStatus.OK)
  @Post(':id/pings')
  postPings(
    @CurrentUser() driver: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PostPingsRequestSchema)) body: PostPingsRequest,
  ): Promise<PostPingsResponse> {
    return this.pingProcessor.ingest(driver, id, body);
  }

  @Roles('DRIVER')
  @HttpCode(HttpStatus.OK)
  @Post(':id/sos')
  sos(
    @CurrentUser() driver: AuthPrincipal,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SosRequestSchema)) body: SosRequest,
  ): Promise<SosResponse> {
    return this.tripsService.sos(driver, id, body);
  }
}
