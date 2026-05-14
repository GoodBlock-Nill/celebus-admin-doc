import PageHeader from '@/components/layout/PageHeader';
import ComingSoon from '@/components/layout/ComingSoon';

export default function Page() {
  return (
    <div>
      <PageHeader title="티켓" breadcrumbItems={[{ label: '티켓' }]} />
      <ComingSoon area="티켓" />
    </div>
  );
}
