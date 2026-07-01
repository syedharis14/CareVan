/**
 * CareVan dev/demo seed — realistic Lahore data.
 *
 * DESTRUCTIVE: wipes every table, then recreates. Guarded against production.
 * Run: `pnpm prisma db seed` (from backend/).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl);
  if (process.env.NODE_ENV === 'production' || (!isLocalDb && process.env.SEED_FORCE !== '1')) {
    throw new Error(
      'Refusing to seed: this wipes all data. Requires a localhost DATABASE_URL and ' +
        'non-production NODE_ENV (set SEED_FORCE=1 to override for a non-local dev database).',
    );
  }

  // Wipe in FK-dependency order.
  await prisma.$transaction([
    prisma.alertLog.deleteMany(),
    prisma.safetyEvent.deleteMany(),
    prisma.locationPing.deleteMany(),
    prisma.tripEvent.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.paymentRecord.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.driverPayout.deleteMany(),
    prisma.vanStudent.deleteMany(),
    prisma.studentParent.deleteMany(),
    prisma.van.deleteMany(),
    prisma.student.deleteMany(),
    prisma.school.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const pin = (raw: string) => argon2.hash(raw);

  // --- Users ---
  const admin = await prisma.user.create({
    data: {
      phone: '+923214000001',
      name: 'Haris (Admin)',
      role: 'ADMIN',
      pinHash: await pin('7788'),
    },
  });

  const driverAkram = await prisma.user.create({
    data: {
      phone: '+923004561122',
      name: 'Muhammad Akram',
      role: 'DRIVER',
      pinHash: await pin('1122'),
    },
  });
  const driverRashid = await prisma.user.create({
    data: {
      phone: '+923214877890',
      name: 'Rashid Mehmood',
      role: 'DRIVER',
      pinHash: await pin('1122'),
    },
  });

  const createParent = async (phone: string, name: string) =>
    prisma.user.create({ data: { phone, name, role: 'PARENT', pinHash: await pin('3344') } });

  const ayesha = await createParent('+923331234501', 'Ayesha Khan');
  const bilal = await createParent('+923451234502', 'Bilal Ahmed');
  const sana = await createParent('+923211234503', 'Sana Tariq');
  const imran = await createParent('+923021234504', 'Imran Siddiqui');
  const nadia = await createParent('+923341234505', 'Nadia Hussain');

  // --- Schools (real Lahore localities, plausible coordinates) ---
  const gulbergSchool = await prisma.school.create({
    data: {
      name: 'Gulberg Grammar School',
      lat: 31.5102,
      lng: 74.3441,
      address: 'Main Boulevard, Gulberg III, Lahore',
    },
  });
  const modelTownSchool = await prisma.school.create({
    data: {
      name: 'Model Town Public School',
      lat: 31.4811,
      lng: 74.3247,
      address: 'Block C, Model Town, Lahore',
    },
  });

  // --- Vans ---
  const vanAkram = await prisma.van.create({
    data: {
      driverId: driverAkram.id,
      plateNo: 'LEB-2341',
      capacity: 14,
      schoolId: gulbergSchool.id,
    },
  });
  const vanRashid = await prisma.van.create({
    data: {
      driverId: driverRashid.id,
      plateNo: 'LEC-8876',
      capacity: 12,
      schoolId: modelTownSchool.id,
    },
  });

  // --- Students (home coords across Gulberg / Garden Town / Johar Town / Model Town) ---
  const students = {
    zara: await prisma.student.create({
      data: {
        name: 'Zara Khan',
        schoolId: gulbergSchool.id,
        homeLat: 31.5165,
        homeLng: 74.3568,
        pickupNotes: 'Ghar ke bahar wait karein, horn na dein',
      },
    }),
    hamza: await prisma.student.create({
      data: {
        name: 'Hamza Khan',
        schoolId: gulbergSchool.id,
        homeLat: 31.5165,
        homeLng: 74.3568,
        pickupNotes: 'Zara ka bhai — same ghar',
      },
    }),
    ibrahim: await prisma.student.create({
      data: {
        name: 'Ibrahim Ahmed',
        schoolId: gulbergSchool.id,
        homeLat: 31.4936,
        homeLng: 74.3213,
        pickupNotes: 'Garden Town, gate #2 ke samne',
      },
    }),
    fatima: await prisma.student.create({
      data: {
        name: 'Fatima Tariq',
        schoolId: gulbergSchool.id,
        homeLat: 31.4697,
        homeLng: 74.2728,
        pickupNotes: 'Johar Town, Emporium ke qareeb',
      },
    }),
    ali: await prisma.student.create({
      data: {
        name: 'Ali Siddiqui',
        schoolId: gulbergSchool.id,
        homeLat: 31.5054,
        homeLng: 74.3327,
      },
    }),
    maryam: await prisma.student.create({
      data: {
        name: 'Maryam Hussain',
        schoolId: modelTownSchool.id,
        homeLat: 31.4753,
        homeLng: 74.3178,
        pickupNotes: 'Link Road corner house',
      },
    }),
  };

  // --- Student <-> parent links ---
  await prisma.studentParent.createMany({
    data: [
      { studentId: students.zara.id, parentUserId: ayesha.id },
      { studentId: students.hamza.id, parentUserId: ayesha.id },
      { studentId: students.ibrahim.id, parentUserId: bilal.id },
      { studentId: students.fatima.id, parentUserId: sana.id },
      { studentId: students.ali.id, parentUserId: imran.id },
      { studentId: students.maryam.id, parentUserId: nadia.id },
    ],
  });

  // --- Van rosters (stopOrder = pickup sequence) ---
  await prisma.vanStudent.createMany({
    data: [
      { vanId: vanAkram.id, studentId: students.zara.id, stopOrder: 1 },
      { vanId: vanAkram.id, studentId: students.hamza.id, stopOrder: 2 },
      { vanId: vanAkram.id, studentId: students.ibrahim.id, stopOrder: 3 },
      { vanId: vanAkram.id, studentId: students.ali.id, stopOrder: 4 },
      { vanId: vanAkram.id, studentId: students.fatima.id, stopOrder: 5 },
      { vanId: vanRashid.id, studentId: students.maryam.id, stopOrder: 1 },
    ],
  });

  // --- Subscriptions (PKR 2500/month market rate) + manual payment records ---
  const subs = await Promise.all(
    [
      { parentUserId: ayesha.id, studentId: students.zara.id, status: 'ACTIVE' as const },
      { parentUserId: ayesha.id, studentId: students.hamza.id, status: 'ACTIVE' as const },
      { parentUserId: bilal.id, studentId: students.ibrahim.id, status: 'ACTIVE' as const },
      { parentUserId: sana.id, studentId: students.fatima.id, status: 'ACTIVE' as const },
      { parentUserId: imran.id, studentId: students.ali.id, status: 'UNPAID' as const },
      { parentUserId: nadia.id, studentId: students.maryam.id, status: 'ACTIVE' as const },
    ].map((s) => prisma.subscription.create({ data: { ...s, amountPkr: 2500 } })),
  );

  await prisma.paymentRecord.createMany({
    data: [
      { subscriptionId: subs[0]!.id, amountPkr: 2500, method: 'CASH', note: 'June — school gate' },
      { subscriptionId: subs[1]!.id, amountPkr: 2500, method: 'CASH', note: 'June — school gate' },
      {
        subscriptionId: subs[2]!.id,
        amountPkr: 2500,
        method: 'TRANSFER',
        note: 'June — bank transfer',
      },
    ],
  });

  console.log('Seed complete. Login credentials (dev only):');
  console.table([
    { role: 'ADMIN', name: admin.name, phone: admin.phone, pin: '7788' },
    { role: 'DRIVER', name: driverAkram.name, phone: driverAkram.phone, pin: '1122' },
    { role: 'DRIVER', name: driverRashid.name, phone: driverRashid.phone, pin: '1122' },
    { role: 'PARENT', name: ayesha.name, phone: ayesha.phone, pin: '3344' },
    { role: 'PARENT', name: bilal.name, phone: bilal.phone, pin: '3344' },
    { role: 'PARENT', name: sana.name, phone: sana.phone, pin: '3344' },
    { role: 'PARENT', name: imran.name, phone: imran.phone, pin: '3344' },
    { role: 'PARENT', name: nadia.name, phone: nadia.phone, pin: '3344' },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
