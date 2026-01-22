import { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/shared/LoadingSpinner';

import { toast } from 'sonner';

// Cache auth state to avoid repeated checks
let cachedAuthState: boolean | null = null;

export const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(cachedAuthState);
    const checkInProgress = useRef(false);

    useEffect(() => {
        // If already authenticated from cache, skip the check
        if (cachedAuthState === true) {
            setIsAuthenticated(true);
            return;
        }

        if (checkInProgress.current) return;
        checkInProgress.current = true;

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const isAdmin = session.user.user_metadata?.role === 'admin';
                if (!isAdmin) {
                    await supabase.auth.signOut();
                    toast.error("Access denied. Admin privileges required.");
                    cachedAuthState = false;
                    setIsAuthenticated(false);
                } else {
                    cachedAuthState = true;
                    setIsAuthenticated(true);
                }
            } else {
                cachedAuthState = false;
                setIsAuthenticated(false);
            }
            checkInProgress.current = false;
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const isAdmin = session.user.user_metadata?.role === 'admin';
                if (!isAdmin) {
                    await supabase.auth.signOut();
                    toast.error("Access denied. Admin privileges required.");
                    cachedAuthState = false;
                    setIsAuthenticated(false);
                } else {
                    cachedAuthState = true;
                    setIsAuthenticated(true);
                }
            } else {
                cachedAuthState = false;
                setIsAuthenticated(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isAuthenticated === null) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
