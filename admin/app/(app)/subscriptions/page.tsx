import {
  ListStudentsResponseSchema,
  ListSubscriptionsResponseSchema,
  ListUsersResponseSchema,
} from '@carevan/shared';
import {
  createSubscriptionAction,
  recordPaymentAction,
  setSubscriptionStatusAction,
} from '@/lib/actions';
import { apiGet } from '@/lib/api';
import { Card, Chip, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
  const [subs, parents, students] = await Promise.all([
    apiGet('/subscriptions', ListSubscriptionsResponseSchema),
    apiGet('/users?role=PARENT', ListUsersResponseSchema),
    apiGet('/students', ListStudentsResponseSchema),
  ]);

  return (
    <div>
      <PageHeader title="Subscriptions" />

      <Card title="New subscription">
        <form action={createSubscriptionAction} className="grid grid-cols-3 gap-3">
          <select name="parentUserId" className="cv-input" required defaultValue="">
            <option value="" disabled>
              Parent…
            </option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="studentId" className="cv-input" required defaultValue="">
            <option value="" disabled>
              Student…
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            name="amountPkr"
            className="cv-input"
            type="number"
            min="0"
            placeholder="Monthly PKR"
            required
          />
          <button className="cv-btn justify-self-start" type="submit">
            Create
          </button>
        </form>
      </Card>

      <div className="cv-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="cv-th">Child</th>
              <th className="cv-th">Parent</th>
              <th className="cv-th">Status</th>
              <th className="cv-th">Monthly</th>
              <th className="cv-th">Paid total</th>
              <th className="cv-th">Record payment</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="cv-td font-semibold">{s.student.name}</td>
                <td className="cv-td">{s.parent.name}</td>
                <td className="cv-td">
                  <Chip
                    label={s.status}
                    tone={
                      s.status === 'ACTIVE' ? 'safe' : s.status === 'UNPAID' ? 'transit' : 'neutral'
                    }
                  />
                  {s.status !== 'CANCELLED' ? (
                    <form action={setSubscriptionStatusAction} className="mt-1">
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <input type="hidden" name="status" value="CANCELLED" />
                      <button className="cv-text-soft text-xs underline" type="submit">
                        cancel
                      </button>
                    </form>
                  ) : null}
                </td>
                <td className="cv-td">{s.amountPkr.toLocaleString()}</td>
                <td className="cv-td">{s.paidTotalPkr.toLocaleString()}</td>
                <td className="cv-td">
                  <form action={recordPaymentAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="subscriptionId" value={s.id} />
                    <input
                      name="amountPkr"
                      className="cv-input"
                      style={{ width: 90 }}
                      type="number"
                      min="1"
                      placeholder="PKR"
                      defaultValue={s.amountPkr}
                      required
                    />
                    <select
                      name="method"
                      className="cv-input"
                      style={{ width: 110 }}
                      defaultValue="CASH"
                    >
                      <option value="CASH">Cash</option>
                      <option value="TRANSFER">Transfer</option>
                    </select>
                    <button className="cv-btn-ghost" type="submit">
                      Mark paid
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
