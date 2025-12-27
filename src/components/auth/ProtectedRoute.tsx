import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/shared/LoadingSpinner';

export const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setIsAuthenticated(!!session);
            });

            return () => subscription.unsubscribe();
        };

        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
