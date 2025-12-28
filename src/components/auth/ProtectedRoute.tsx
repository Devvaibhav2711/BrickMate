import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/shared/LoadingSpinner';

import { toast } from 'sonner';

export const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Check for admin role
                const isAdmin = session.user.user_metadata?.role === 'admin';
                if (!isAdmin) {
                    await supabase.auth.signOut();
                    toast.error("Access access denied. Admin privileges required.");
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(true);
                }
            } else {
                setIsAuthenticated(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session) {
                    const isAdmin = session.user.user_metadata?.role === 'admin';
                    if (!isAdmin) {
                        await supabase.auth.signOut();
                        toast.error("Access access denied. Admin privileges required.");
                        setIsAuthenticated(false);
                    } else {
                        setIsAuthenticated(true);
                    }
                } else {
                    setIsAuthenticated(false);
                }
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
