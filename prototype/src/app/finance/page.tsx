import PageHeader from '@/components/layout/PageHeader';
import ComingSoon from '@/components/layout/ComingSoon';

export default function Page() {
  return (
    <div>
      <PageHeader title="재무" breadcrumbItems={[{ label: '재무' }]} />
      <ComingSoon area="재무" />
    </div>
  );
}
