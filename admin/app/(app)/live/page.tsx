import { LiveMap } from '@/components/LiveMap';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function LivePage() {
  return (
    <div>
      <PageHeader title="Live trips" />
      <LiveMap />
    </div>
  );
}
