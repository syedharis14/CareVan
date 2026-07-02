import {
  ListSchoolsResponseSchema,
  ListStudentsResponseSchema,
  ListUsersResponseSchema,
} from '@carevan/shared';
import { assignParentAction, createStudentAction } from '@/lib/actions';
import { apiGet } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
  const [students, schools, users] = await Promise.all([
    apiGet('/students', ListStudentsResponseSchema),
    apiGet('/schools', ListSchoolsResponseSchema),
    apiGet('/users?role=PARENT', ListUsersResponseSchema),
  ]);

  return (
    <div>
      <PageHeader title="Students" />

      <Card title="Add student">
        <form action={createStudentAction} className="grid grid-cols-2 gap-3">
          <input name="name" className="cv-input" placeholder="Student name" required />
          <select name="schoolId" className="cv-input" required defaultValue="">
            <option value="" disabled>
              Select school…
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            name="homeLat"
            className="cv-input"
            placeholder="Home latitude"
            type="number"
            step="any"
            required
          />
          <input
            name="homeLng"
            className="cv-input"
            placeholder="Home longitude"
            type="number"
            step="any"
            required
          />
          <input
            name="pickupNotes"
            className="cv-input col-span-2"
            placeholder="Pickup notes (optional)"
          />
          <button className="cv-btn col-span-2 justify-self-start" type="submit">
            Add student
          </button>
        </form>
      </Card>

      <div className="cv-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="cv-th">Student</th>
              <th className="cv-th">School</th>
              <th className="cv-th">Parents</th>
              <th className="cv-th">Link a parent</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr key={st.id}>
                <td className="cv-td font-semibold">{st.name}</td>
                <td className="cv-td">{st.school.name}</td>
                <td className="cv-td cv-text-soft">
                  {st.parents.length ? st.parents.map((p) => p.name).join(', ') : '—'}
                </td>
                <td className="cv-td">
                  <form action={assignParentAction} className="flex gap-2">
                    <input type="hidden" name="studentId" value={st.id} />
                    <select name="parentUserId" className="cv-input" required defaultValue="">
                      <option value="" disabled>
                        Parent…
                      </option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <button className="cv-btn-ghost" type="submit">
                      Link
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
