import Breadcrumb from './Breadcrumb';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
}

export default function PageHeader({ title, actions, breadcrumbItems }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Breadcrumb customItems={breadcrumbItems} />
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-[28px] font-bold text-gray-900">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
