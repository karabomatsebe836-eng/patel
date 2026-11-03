import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type DentistAvailabilityRealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export function useDentistAvailabilityRealtime(
  dentistId: string | undefined,
  refreshAvailability: () => void | Promise<void>,
): DentistAvailabilityRealtimeStatus {
  const [status, setStatus] = useState<DentistAvailabilityRealtimeStatus>('connecting');

  useEffect(() => {
    if (!dentistId) {
      setStatus('disconnected');
      return;
    }

    let active = true;
    const refresh = () => {
      void Promise.resolve(refreshAvailability()).catch((error: unknown) => {
        console.error('Failed to refresh optometrist availability:', error);
      });
    };

    setStatus('connecting');
    const channel = supabase
      .channel(`dentist-availability:${dentistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dentist_availability',
          filter: `dentist_id=eq.${dentistId}`,
        },
        refresh,
      )
      .subscribe((subscriptionStatus, error) => {
        if (!active) return;

        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('connected');
          refresh();
        } else if (
          subscriptionStatus === 'CHANNEL_ERROR' ||
          subscriptionStatus === 'TIMED_OUT' ||
          subscriptionStatus === 'CLOSED'
        ) {
          setStatus('disconnected');
          console.error('Optometrist availability realtime connection failed:', error ?? subscriptionStatus);
        }
      });

    const refreshInterval = window.setInterval(refresh, 5000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [dentistId, refreshAvailability]);

  return status;
}
