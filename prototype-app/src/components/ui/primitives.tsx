import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl bg-card border border-border-card', className)} {...props}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-[13px] text-text-body flex items-center gap-0.5">
          {action}
          <span className="text-text-disabled">›</span>
        </button>
      )}
    </div>
  );
}

export function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium', className)}>
      {children}
    </span>
  );
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium', className)}>
      {children}
    </span>
  );
}

export function ProgressBar({ percent, className, barClassName }: { percent: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn('h-2 w-full rounded-full bg-muted overflow-hidden', className)}>
      <div className={cn('h-full rounded-full bg-primary', barClassName)} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}

export function FilterTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
            active === t ? 'bg-primary text-white' : 'bg-muted text-text-body',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function PrimaryButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'w-full rounded-xl bg-primary py-3 text-[14px] font-semibold text-white active:opacity-90 disabled:bg-muted disabled:text-text-disabled',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
