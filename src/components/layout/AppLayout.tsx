import { ReactNode, useEffect, useRef } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the main container
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    // Also scroll the window to ensure complete reset
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isLoginPage && <Header />}
      <main
        ref={mainRef}
        className="flex-1 pb-24 overflow-y-auto scroll-smooth"
      >
        {children}
      </main>
      {!isLoginPage && <MobileNav />}
    </div>
  );
};
