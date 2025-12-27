import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isLoginPage && <Header />}
      <main className="flex-1 pb-24 overflow-y-auto scroll-smooth">
        {children}
      </main>
      {!isLoginPage && <MobileNav />}
    </div>
  );
};
