import { ListUsersResponseSchema } from '@carevan/shared';
import { createUserAction } from '@/lib/actions';
import { apiGet } from '@/lib/api';
import { Card, Chip, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await apiGet('/users', ListUsersResponseSchema);

  return (
    <div>
      <PageHeader title="Drivers & parents" />

      <Card title="Create account">
        <p className="cv-text-soft mb-3 text-sm">
          Accounts are created here — there is no self-signup. The user signs in with phone + PIN.
        </p>
        <form action={createUserAction} className="grid grid-cols-2 gap-3">
          <input name="name" className="cv-input" placeholder="Full name" required />
          <input name="phone" className="cv-input" placeholder="03XX XXXXXXX" required />
          <select name="role" className="cv-input" defaultValue="DRIVER" required>
            <option value="DRIVER">Driver</option>
            <option value="PARENT">Parent</option>
          </select>
          <input name="pin" className="cv-input" placeholder="PIN (4–6 digits)" required />
          <button className="cv-btn col-span-2 justify-self-start" type="submit">
            Create account
          </button>
        </form>
      </Card>

      <div className="cv-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="cv-th">Name</th>
              <th className="cv-th">Phone</th>
              <th className="cv-th">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="cv-td font-semibold">{u.name}</td>
                <td className="cv-td">{u.phone}</td>
                <td className="cv-td">
                  <Chip
                    label={u.role}
                    tone={
                      u.role === 'DRIVER' ? 'primary' : u.role === 'PARENT' ? 'transit' : 'neutral'
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
