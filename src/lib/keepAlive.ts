import { supabase } from '@/integrations/supabase/client';

const KEEP_ALIVE_KEY = 'supabase_last_ping';
const PING_INTERVAL_DAYS = 5;

/**
 * Keeps Supabase database alive by making a lightweight query.
 * Automatically runs every 5 days when the app is opened.
 */
export const keepSupabaseAlive = async (): Promise<void> => {
  try {
    const lastPing = localStorage.getItem(KEEP_ALIVE_KEY);
    const now = Date.now();
    const fiveDaysMs = PING_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

    // Only ping if 5 days have passed since last ping
    if (lastPing && now - parseInt(lastPing) < fiveDaysMs) {
      return;
    }

    // Lightweight query to keep the database active
    const { error } = await supabase
      .from('labour')
      .select('id')
      .limit(1);

    if (!error) {
      localStorage.setItem(KEEP_ALIVE_KEY, now.toString());
      console.log('[KeepAlive] Supabase pinged successfully');
    }
  } catch (err) {
    console.error('[KeepAlive] Failed to ping Supabase:', err);
  }
};

/**
 * Registers a service worker that pings Supabase in the background
 */
export const registerKeepAliveWorker = (): void => {
  if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        // @ts-ignore - periodicSync is experimental
        await registration.periodicSync.register('supabase-keep-alive', {
          minInterval: PING_INTERVAL_DAYS * 24 * 60 * 60 * 1000, // 5 days
        });
        console.log('[KeepAlive] Background sync registered');
      } catch {
        console.log('[KeepAlive] Background sync not supported, using app-based ping');
      }
    });
  }
};
