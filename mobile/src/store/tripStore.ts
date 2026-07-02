import { DriverRosterStudent, TripEventType, TripType } from '@carevan/shared';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { driverApi } from '../api/endpoints';
import { enqueueEvent, pendingCounts, unsyncedEventsForTrip } from '../db/outbox';
import { startTracking, stopTracking } from '../location/locationTask';
import { syncNow } from '../sync/syncEngine';

export type StudentStatus = TripEventType | 'PENDING';

interface ActiveTrip {
  id: string;
  type: TripType;
}

interface TripState {
  ready: boolean;
  vanId: string | null;
  schoolName: string | null;
  students: DriverRosterStudent[];
  trip: ActiveTrip | null;
  statuses: Record<string, StudentStatus>;
  pending: { events: number; pings: number };
  busy: boolean;
  error: string | null;

  bootstrap: () => Promise<void>;
  startTrip: (type: TripType) => Promise<void>;
  record: (studentId: string, type: TripEventType) => Promise<void>;
  endTrip: (abort?: boolean) => Promise<void>;
  triggerSos: (note?: string) => Promise<number>;
  refreshStatuses: () => Promise<void>;
  refreshPending: () => Promise<void>;
}

function blankStatuses(students: DriverRosterStudent[]): Record<string, StudentStatus> {
  return Object.fromEntries(students.map((s) => [s.id, 'PENDING' as StudentStatus]));
}

export const useTripStore = create<TripState>()((set, get) => ({
  ready: false,
  vanId: null,
  schoolName: null,
  students: [],
  trip: null,
  statuses: {},
  pending: { events: 0, pings: 0 },
  busy: false,
  error: null,

  bootstrap: async () => {
    set({ error: null });
    try {
      const vans = await driverApi.myVans();
      const van = vans[0] ?? null;
      set({
        ready: true,
        vanId: van?.id ?? null,
        schoolName: van?.school.name ?? null,
        students: van?.students ?? [],
        statuses: blankStatuses(van?.students ?? []),
      });

      const { trip } = await driverApi.activeTrip();
      if (trip) {
        set({ trip: { id: trip.id, type: trip.type } });
        // Kill/relaunch recovery: resume tracking for the in-progress trip.
        await startTracking(trip.id).catch(() => undefined);
        await get().refreshStatuses();
      }
      await get().refreshPending();
    } catch (e) {
      set({ ready: true, error: e instanceof Error ? e.message : 'Failed to load your van' });
    }
  },

  startTrip: async (type) => {
    const { vanId, students } = get();
    if (!vanId) throw new Error('No van assigned to you');
    set({ busy: true, error: null });
    try {
      const trip = await driverApi.startTrip({ vanId, type });
      set({ trip: { id: trip.id, type: trip.type }, statuses: blankStatuses(students) });
      await startTracking(trip.id);
    } finally {
      set({ busy: false });
    }
  },

  record: async (studentId, type) => {
    const { trip } = get();
    if (!trip) return;
    // Write to the local outbox FIRST — the tap is durable even fully offline.
    await enqueueEvent({
      id: Crypto.randomUUID(),
      tripId: trip.id,
      studentId,
      type,
      at: new Date(),
    });
    set((s) => ({ statuses: { ...s.statuses, [studentId]: type } }));
    void syncNow().then(() => get().refreshPending());
  },

  endTrip: async (abort = false) => {
    const { trip } = get();
    if (!trip) return;
    set({ busy: true, error: null });
    try {
      await syncNow(); // flush any queued taps/pings before closing out
      if (abort) await driverApi.abortTrip(trip.id);
      else await driverApi.endTrip(trip.id);
      await stopTracking();
      set({ trip: null, statuses: blankStatuses(get().students) });
      await get().refreshPending();
    } finally {
      set({ busy: false });
    }
  },

  triggerSos: async (note) => {
    const { trip } = get();
    if (!trip) throw new Error('SOS needs an active trip');
    const res = await driverApi.sos(trip.id, note);
    return res.created;
  },

  refreshStatuses: async () => {
    const { trip, students } = get();
    if (!trip) return;
    // Read the local outbox FIRST, then the server. This ordering is load-bearing:
    // if an event is still unsynced it's captured here; if it gets synced during this
    // call, the later server read is guaranteed to include it (markEventsSynced only
    // runs after postEvents commits). Reading server-first opens a gap where an
    // in-flight event is in neither set → status resets to PENDING → a re-tap fires a
    // duplicate BOARDED. (Server-side @@unique([tripId,studentId,type]) is the backstop.)
    const localEvents = await unsyncedEventsForTrip(trip.id);
    const detail = await driverApi.activeTrip();
    const serverEvents = detail.trip?.events ?? [];
    const merged = [
      ...serverEvents.map((e) => ({ studentId: e.studentId, type: e.type, at: e.at.getTime() })),
      ...localEvents.map((e) => ({
        studentId: e.studentId,
        type: e.type as TripEventType,
        at: new Date(e.at).getTime(),
      })),
    ].sort((a, b) => a.at - b.at);

    const statuses = blankStatuses(students);
    for (const e of merged) statuses[e.studentId] = e.type;
    set({ statuses });
  },

  refreshPending: async () => {
    set({ pending: await pendingCounts() });
  },
}));
