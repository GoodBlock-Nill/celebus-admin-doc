import { InboxIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  message: string;
  icon?: 'inbox' | 'search';
  action?: React.ReactNode;
}

export default function EmptyState({ message, icon = 'inbox', action }: EmptyStateProps) {
  const Icon = icon === 'search' ? MagnifyingGlassIcon : InboxIcon;

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Icon className="w-12 h-12 text-gray-300 mb-4" />
      <p className="text-base text-gray-500 mb-4">{message}</p>
      {action}
    </div>
  );
}
