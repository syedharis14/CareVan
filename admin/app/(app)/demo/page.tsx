import { DemoPanel } from '@/components/DemoPanel';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function DemoPage() {
  return (
    <div>
      <PageHeader title="Demo mode" />
      <DemoPanel />
    </div>
  );
}
