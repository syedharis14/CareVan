'use server';

import { revalidatePath } from 'next/cache';
import {
  CreateSchoolRequest,
  CreateStudentRequest,
  CreateSubscriptionRequest,
  CreateUserRequestSchema,
  CreateVanRequest,
  normalizePkPhone,
  RecordPaymentRequestSchema,
  UpdateSubscriptionStatusRequestSchema,
} from '@carevan/shared';
import { apiSend } from './api';

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(fd.get(k));

export async function createSchoolAction(fd: FormData): Promise<void> {
  const body: CreateSchoolRequest = {
    name: s(fd, 'name'),
    address: s(fd, 'address'),
    lat: n(fd, 'lat'),
    lng: n(fd, 'lng'),
  };
  await apiSend('/schools', 'POST', body);
  revalidatePath('/schools');
}

export async function createUserAction(fd: FormData): Promise<void> {
  // Parse through the shared schema (validates the role enum) rather than casting.
  const body = CreateUserRequestSchema.parse({
    phone: normalizePkPhone(s(fd, 'phone')),
    name: s(fd, 'name'),
    role: s(fd, 'role'),
    pin: s(fd, 'pin'),
  });
  await apiSend('/users', 'POST', body);
  revalidatePath('/users');
}

export async function createStudentAction(fd: FormData): Promise<void> {
  const notes = s(fd, 'pickupNotes');
  const body: CreateStudentRequest = {
    name: s(fd, 'name'),
    schoolId: s(fd, 'schoolId'),
    homeLat: n(fd, 'homeLat'),
    homeLng: n(fd, 'homeLng'),
    pickupNotes: notes || undefined,
  };
  await apiSend('/students', 'POST', body);
  revalidatePath('/students');
}

export async function assignParentAction(fd: FormData): Promise<void> {
  const studentId = s(fd, 'studentId');
  await apiSend(`/students/${studentId}/parents`, 'POST', { parentUserId: s(fd, 'parentUserId') });
  revalidatePath('/students');
}

export async function createVanAction(fd: FormData): Promise<void> {
  const body: CreateVanRequest = {
    plateNo: s(fd, 'plateNo'),
    capacity: n(fd, 'capacity'),
    driverId: s(fd, 'driverId'),
    schoolId: s(fd, 'schoolId'),
  };
  await apiSend('/vans', 'POST', body);
  revalidatePath('/vans');
}

export async function assignVanStudentAction(fd: FormData): Promise<void> {
  const vanId = s(fd, 'vanId');
  await apiSend(`/vans/${vanId}/students`, 'POST', {
    studentId: s(fd, 'studentId'),
    stopOrder: n(fd, 'stopOrder'),
  });
  revalidatePath('/vans');
}

export async function createSubscriptionAction(fd: FormData): Promise<void> {
  const body: CreateSubscriptionRequest = {
    parentUserId: s(fd, 'parentUserId'),
    studentId: s(fd, 'studentId'),
    amountPkr: n(fd, 'amountPkr'),
  };
  await apiSend('/subscriptions', 'POST', body);
  revalidatePath('/subscriptions');
}

export async function recordPaymentAction(fd: FormData): Promise<void> {
  const id = s(fd, 'subscriptionId');
  const note = s(fd, 'note');
  const body = RecordPaymentRequestSchema.parse({
    amountPkr: n(fd, 'amountPkr'),
    method: s(fd, 'method'),
    note: note || undefined,
  });
  await apiSend(`/subscriptions/${id}/payments`, 'POST', body);
  revalidatePath('/subscriptions');
}

export async function setSubscriptionStatusAction(fd: FormData): Promise<void> {
  const id = s(fd, 'subscriptionId');
  const body = UpdateSubscriptionStatusRequestSchema.parse({ status: s(fd, 'status') });
  await apiSend(`/subscriptions/${id}/status`, 'PATCH', body);
  revalidatePath('/subscriptions');
}

export async function markPayoutPaidAction(fd: FormData): Promise<void> {
  await apiSend('/payouts/paid', 'POST', { driverId: s(fd, 'driverId'), month: s(fd, 'month') });
  revalidatePath('/payouts');
}
