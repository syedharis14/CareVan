import { AlertAuditResponseSchema, AlertStatus, AlertType } from '@carevan/shared';
import { apiGet } from '@/lib/api';
import { Chip, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

// Red is reserved for SOS/overspeed ONLY — a FAILED delivery flags amber, not red.
function statusTone(status: AlertStatus): 'safe' | 'transit' | 'neutral' {
  if (status === 'DELIVERED') return 'safe';
  if (status === 'FAILED') return 'transit';
  return 'neutral';
}
function typeTone(type: AlertType): 'danger' | 'safe' | 'neutral' {
  if (type === 'SOS' || type === 'OVERSPEED') return 'danger';
  if (type === 'BOARDED' || type === 'REACHED_SCHOOL' || type === 'REACHED_HOME') return 'safe';
  return 'neutral';
}

const STATUSES: AlertStatus[] = ['CREATED', 'SENT', 'DELIVERED', 'FAILED'];

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const valid = STATUSES.includes(status as AlertStatus) ? (status as AlertStatus) : undefined;
  const query = valid ? `?status=${valid}&limit=200` : '?limit=200';
  const rows = await apiGet(`/alerts${query}`, AlertAuditResponseSchema);

  return (
    <div>
      <PageHeader title="Alert audit">
        <form className="flex items-center gap-2">
          <select name="status" defaultValue={valid ?? ''} className="cv-input">
            <option value="">All statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <button className="cv-btn-ghost" type="submit">
            Filter
          </button>
        </form>
      </PageHeader>

      <p className="cv-text-soft mb-3 text-sm">
        Every alert is traceable: created before dispatch, then SENT → DELIVERED/FAILED. This page
        is how we prove alert reliability.
      </p>

      <div className="cv-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="cv-th">When</th>
              <th className="cv-th">Type</th>
              <th className="cv-th">Message</th>
              <th className="cv-th">Child</th>
              <th className="cv-th">Parent</th>
              <th className="cv-th">Status</th>
              <th className="cv-th">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="cv-td cv-text-soft">{new Date(a.at).toLocaleString()}</td>
                <td className="cv-td">
                  <Chip label={a.type} tone={typeTone(a.type)} />
                </td>
                <td className="cv-td">{a.message}</td>
                <td className="cv-td">{a.studentName ?? '—'}</td>
                <td className="cv-td">{a.parent.name}</td>
                <td className="cv-td">
                  <Chip label={a.status} tone={statusTone(a.status)} />
                </td>
                <td className="cv-td cv-text-soft">{a.errorDetail ?? ''}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="cv-td cv-text-soft" colSpan={7}>
                  No alerts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
