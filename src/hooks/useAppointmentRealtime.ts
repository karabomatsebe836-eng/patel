import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AppointmentOwnerColumn = 'patient_id' | 'dentist_id';
export type AppointmentRealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export function useAppointmentRealtime(
  ownerId: string | undefined,
  ownerColumn: AppointmentOwnerColumn,
  refreshAppointments: () => void | Promise<void>,
): AppointmentRealtimeStatus {
  const [status, setStatus] = useState<AppointmentRealtimeStatus>('connecting');

  useEffect(() => {
    if (!ownerId) {
      setStatus('disconnected');
      return;
    }

    let active = true;
    setStatus('connecting');
    const refresh = () => {
      void Promise.resolve(refreshAppointments()).catch((error: unknown) => {
        console.error('Failed to refresh appointments:', error);
      });
    };

    const channel = supabase
      .channel(`appointments:${ownerColumn}:${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `${ownerColumn}=eq.${ownerId}`,
        },
        () => {
          refresh();
        },
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
          console.error('Appointment realtime connection failed:', error ?? subscriptionStatus);
        }
      });

    const refreshInterval = window.setInterval(() => {
      refresh();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [ownerId, ownerColumn, refreshAppointments]);

  return status;
}
