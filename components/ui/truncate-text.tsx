import { cn } from '@/lib/utils';

export function TruncateText({
  text,
  lines = 1,
  className,
}: {
  text: string;
  lines?: 1 | 2;
  className?: string;
}) {
  const clamp = lines === 2 ? 'line-clamp-2' : 'truncate';
  return (
    <span title={text} className={cn(clamp, className)}>
      {text}
    </span>
  );
}