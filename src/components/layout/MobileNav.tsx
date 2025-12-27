import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Factory,
  UserCircle,
  Wallet,
  Shield,
  Calendar
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { path: '/labour', icon: Users, labelKey: 'labour' as const },
  { path: '/daily-workers', icon: Calendar, labelKey: 'dailyWorkers' as const },
  { path: '/production', icon: Factory, labelKey: 'production' as const },
  { path: '/customers', icon: UserCircle, labelKey: 'customers' as const },
  { path: '/expenses', icon: Wallet, labelKey: 'expenses' as const },
  { path: '/admin', icon: Shield, labelKey: 'admin' as const },
];

export const MobileNav = () => {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/40 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] safe-area-inset-bottom">
      <div className="flex items-center justify-start md:justify-around px-2 py-3 overflow-x-auto scrollbar-hide w-full gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center min-w-[64px] touch-target group"
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-3 w-8 h-1 bg-primary rounded-full shadow-[0_2px_10px] shadow-primary/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-2 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground group-hover:text-primary/80"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>

              <span
                className={cn(
                  "text-[10px] font-medium mt-1 transition-all duration-300",
                  isActive ? "text-primary translate-y-0" : "text-muted-foreground/80 translate-y-0.5"
                )}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
