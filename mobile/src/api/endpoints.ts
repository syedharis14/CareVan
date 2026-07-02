import {
  ActiveTripResponse,
  ActiveTripResponseSchema,
  AuthUser,
  ChildrenResponse,
  ChildrenResponseSchema,
  DriverVansResponse,
  DriverVansResponseSchema,
  LoginResponse,
  LoginResponseSchema,
  MeResponseSchema,
  PostPingsRequest,
  PostPingsResponse,
  PostPingsResponseSchema,
  PostTripEventsRequest,
  PostTripEventsResponse,
  PostTripEventsResponseSchema,
  SosResponse,
  SosResponseSchema,
  StartTripRequest,
  TripResponse,
  TripResponseSchema,
} from '@carevan/shared';
import { apiRequest } from './client';

export const authApi = {
  login: (phone: string, pin: string): Promise<LoginResponse> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { phone, pin },
      schema: LoginResponseSchema,
      anonymous: true,
    }),
  me: (): Promise<AuthUser> => apiRequest('/auth/me', { schema: MeResponseSchema }),
};

export const driverApi = {
  myVans: (): Promise<DriverVansResponse> =>
    apiRequest('/me/van', { schema: DriverVansResponseSchema }),

  activeTrip: (): Promise<ActiveTripResponse> =>
    apiRequest('/trips/mine/active', { schema: ActiveTripResponseSchema }),

  startTrip: (body: StartTripRequest): Promise<TripResponse> =>
    apiRequest('/trips', { method: 'POST', body, schema: TripResponseSchema }),

  endTrip: (tripId: string): Promise<TripResponse> =>
    apiRequest(`/trips/${tripId}/end`, { method: 'POST', schema: TripResponseSchema }),

  abortTrip: (tripId: string): Promise<TripResponse> =>
    apiRequest(`/trips/${tripId}/abort`, { method: 'POST', schema: TripResponseSchema }),

  postEvents: (tripId: string, body: PostTripEventsRequest): Promise<PostTripEventsResponse> =>
    apiRequest(`/trips/${tripId}/events`, {
      method: 'POST',
      body,
      schema: PostTripEventsResponseSchema,
    }),

  postPings: (tripId: string, body: PostPingsRequest): Promise<PostPingsResponse> =>
    apiRequest(`/trips/${tripId}/pings`, {
      method: 'POST',
      body,
      schema: PostPingsResponseSchema,
    }),

  sos: (tripId: string, note?: string): Promise<SosResponse> =>
    apiRequest(`/trips/${tripId}/sos`, {
      method: 'POST',
      body: { note },
      schema: SosResponseSchema,
    }),
};

export const parentApi = {
  children: (): Promise<ChildrenResponse> =>
    apiRequest('/me/children', { schema: ChildrenResponseSchema }),
};

export const meApi = {
  registerPushToken: (token: string): Promise<void> =>
    apiRequest('/me/push-token', { method: 'PUT', body: { token } }),
  clearPushToken: (): Promise<void> => apiRequest('/me/push-token', { method: 'DELETE' }),
};
