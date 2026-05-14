import PageHeader from '@/components/layout/PageHeader';
import ComingSoon from '@/components/layout/ComingSoon';

export default function Page() {
  return (
    <div>
      <PageHeader title="프로젝트" breadcrumbItems={[{ label: '프로젝트' }]} />
      <ComingSoon area="프로젝트" />
    </div>
  );
}
