import { ListPayoutsResponseSchema } from '@carevan/shared';
import { markPayoutPaidAction } from '@/lib/actions';
import { apiGet } from '@/lib/api';
import { Card, Chip, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? '') ? (monthParam as string) : currentMonth();
  const rows = await apiGet(`/payouts?month=${month}`, ListPayoutsResponseSchema);

  return (
    <div>
      <PageHeader title="Driver payouts">
        <form className="flex items-center gap-2">
          <input type="month" name="month" defaultValue={month} className="cv-input" />
          <button className="cv-btn-ghost" type="submit">
            View
          </button>
        </form>
      </PageHeader>

      <Card>
        <p className="cv-text-soft text-sm">
          activeDays is computed from location pings (days with a completed trip and enough pings) —
          never client-reported. Amount = activeDays × the configured per-day rate.
        </p>
      </Card>

      <div className="cv-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="cv-th">Driver</th>
              <th className="cv-th">Active days</th>
              <th className="cv-th">Amount (PKR)</th>
              <th className="cv-th">Paid</th>
              <th className="cv-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.driver.id}>
                <td className="cv-td font-semibold">{r.driver.name}</td>
                <td className="cv-td">{r.activeDays}</td>
                <td className="cv-td">{r.amountPkr.toLocaleString()}</td>
                <td className="cv-td">
                  {r.paidAt ? (
                    <Chip label={`Paid ${new Date(r.paidAt).toLocaleDateString()}`} tone="safe" />
                  ) : (
                    <Chip label="Unpaid" tone="neutral" />
                  )}
                </td>
                <td className="cv-td">
                  <form action={markPayoutPaidAction}>
                    <input type="hidden" name="driverId" value={r.driver.id} />
                    <input type="hidden" name="month" value={month} />
                    <button className="cv-btn-ghost" type="submit">
                      {r.paidAt ? 'Re-mark paid' : 'Mark paid'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
