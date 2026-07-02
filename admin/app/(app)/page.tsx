import {
  ListSchoolsResponseSchema,
  ListStudentsResponseSchema,
  ListSubscriptionsResponseSchema,
  ListVansResponseSchema,
  LiveTripsResponseSchema,
} from '@carevan/shared';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="cv-card p-5">
      <div className="cv-text-soft text-sm">{label}</div>
      <div className="cv-text-primary text-3xl font-extrabold">{value}</div>
      {hint ? <div className="cv-text-soft text-xs">{hint}</div> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const [schools, vans, students, subs, live] = await Promise.all([
    apiGet('/schools', ListSchoolsResponseSchema),
    apiGet('/vans', ListVansResponseSchema),
    apiGet('/students', ListStudentsResponseSchema),
    apiGet('/subscriptions', ListSubscriptionsResponseSchema),
    apiGet('/trips/live', LiveTripsResponseSchema),
  ]);
  const unpaid = subs.filter((s) => s.status === 'UNPAID').length;

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Active trips now" value={live.length} hint="see Live trips" />
        <Stat label="Schools" value={schools.length} />
        <Stat label="Vans" value={vans.length} />
        <Stat label="Students" value={students.length} />
        <Stat label="Subscriptions" value={subs.length} />
        <Stat label="Unpaid subscriptions" value={unpaid} hint="follow up" />
      </div>
    </div>
  );
}
