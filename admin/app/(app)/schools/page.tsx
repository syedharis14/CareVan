import { ListSchoolsResponseSchema } from '@carevan/shared';
import { createSchoolAction } from '@/lib/actions';
import { apiGet } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SchoolsPage() {
  const schools = await apiGet('/schools', ListSchoolsResponseSchema);

  return (
    <div>
      <PageHeader title="Schools" />

      <Card title="Add school">
        <form action={createSchoolAction} className="grid grid-cols-2 gap-3">
          <input name="name" className="cv-input" placeholder="School name" required />
          <input name="address" className="cv-input" placeholder="Address" required />
          <input
            name="lat"
            className="cv-input"
            placeholder="Latitude"
            type="number"
            step="any"
            required
          />
          <input
            name="lng"
            className="cv-input"
            placeholder="Longitude"
            type="number"
            step="any"
            required
          />
          <button className="cv-btn col-span-2 justify-self-start" type="submit">
            Add school
          </button>
        </form>
      </Card>

      <div className="cv-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="cv-th">Name</th>
              <th className="cv-th">Address</th>
              <th className="cv-th">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id}>
                <td className="cv-td font-semibold">{s.name}</td>
                <td className="cv-td">{s.address}</td>
                <td className="cv-td cv-text-soft">
                  {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
