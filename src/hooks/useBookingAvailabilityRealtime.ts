import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useBookingAvailabilityRealtime(
  dentistId: string | undefined,
  refreshSlots: () => void | Promise<void>,
): void {
  useEffect(() => {
    if (!dentistId) return;

    const refresh = () => {
      void Promise.resolve(refreshSlots()).catch((error: unknown) => {
        console.error('Failed to refresh available booking slots:', error);
      });
    };

    const channel = supabase
      .channel(`booking-availability:${dentistId}`)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `dentist_id=eq.${dentistId}`,
        },
        refresh,
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('Booking availability realtime connection failed:', error ?? status);
        } else if (status === 'SUBSCRIBED') {
          refresh();
        }
      });

    const refreshInterval = window.setInterval(refresh, 5000);

    return () => {
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [dentistId, refreshSlots]);
}
