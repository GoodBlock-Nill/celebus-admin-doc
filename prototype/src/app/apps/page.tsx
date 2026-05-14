import PageHeader from '@/components/layout/PageHeader';
import ComingSoon from '@/components/layout/ComingSoon';

export default function Page() {
  return (
    <div>
      <PageHeader title="앱" breadcrumbItems={[{ label: '앱' }]} />
      <ComingSoon area="앱" />
    </div>
  );
}
