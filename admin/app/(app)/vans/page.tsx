import {
  ListSchoolsResponseSchema,
  ListStudentsResponseSchema,
  ListUsersResponseSchema,
  ListVansResponseSchema,
  VanRosterResponseSchema,
} from '@carevan/shared';
import { assignVanStudentAction, createVanAction } from '@/lib/actions';
import { apiGet } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function VansPage() {
  const [vans, schools, drivers, students] = await Promise.all([
    apiGet('/vans', ListVansResponseSchema),
    apiGet('/schools', ListSchoolsResponseSchema),
    apiGet('/users?role=DRIVER', ListUsersResponseSchema),
    apiGet('/students', ListStudentsResponseSchema),
  ]);

  // Rosters for each van (one call each — fine for the founder-scale fleet).
  const rosters = await Promise.all(
    vans.map((v) => apiGet(`/vans/${v.id}/students`, VanRosterResponseSchema)),
  );

  return (
    <div>
      <PageHeader title="Vans" />

      <Card title="Add van">
        <form action={createVanAction} className="grid grid-cols-2 gap-3">
          <input
            name="plateNo"
            className="cv-input"
            placeholder="Plate no (e.g. LEB-2341)"
            required
          />
          <input
            name="capacity"
            className="cv-input"
            placeholder="Capacity"
            type="number"
            min="1"
            required
          />
          <select name="driverId" className="cv-input" required defaultValue="">
            <option value="" disabled>
              Driver…
            </option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select name="schoolId" className="cv-input" required defaultValue="">
            <option value="" disabled>
              School…
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button className="cv-btn col-span-2 justify-self-start" type="submit">
            Add van
          </button>
        </form>
      </Card>

      {vans.map((v, i) => (
        <Card key={v.id} title={`${v.plateNo} · ${v.driver.name} · ${v.school.name}`}>
          <div className="cv-text-soft mb-2 text-sm">
            Capacity {v.capacity} · {rosters[i]?.length ?? 0} on roster
          </div>
          <ol className="mb-3 list-decimal pl-6">
            {(rosters[i] ?? []).map((r) => (
              <li
                key={r.student.id}
                className="cv-td"
                style={{ borderBottom: 'none', padding: '2px 0' }}
              >
                {r.student.name}
              </li>
            ))}
          </ol>
          <form action={assignVanStudentAction} className="flex gap-2">
            <input type="hidden" name="vanId" value={v.id} />
            <select name="studentId" className="cv-input" required defaultValue="">
              <option value="" disabled>
                Add student…
              </option>
              {students
                .filter((st) => st.school.id === v.school.id)
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
            </select>
            <input
              name="stopOrder"
              className="cv-input"
              type="number"
              min="1"
              placeholder="Stop #"
              required
            />
            <button className="cv-btn-ghost" type="submit">
              Add
            </button>
          </form>
        </Card>
      ))}
    </div>
  );
}
