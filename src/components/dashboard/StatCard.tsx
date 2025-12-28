import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  delay?: number;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary/5 border-primary/20',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
};

const iconStyles = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export const StatCard = ({
  icon,
  label,
  value,
  subValue,
  variant = 'default',
  delay = 0,
  onClick,
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 shadow-sm',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:bg-opacity-80 transition-all active:scale-95'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2.5 rounded-lg', iconStyles[variant])}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">
            {label}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mt-0.5 whitespace-nowrap leading-tight">
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">
              {subValue}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
