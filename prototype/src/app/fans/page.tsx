import PageHeader from '@/components/layout/PageHeader';
import ComingSoon from '@/components/layout/ComingSoon';

export default function Page() {
  return (
    <div>
      <PageHeader title="Fans" breadcrumbItems={[{ label: 'Fans' }]} />
      <ComingSoon area="Fans" />
    </div>
  );
}
