import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { SOCKET_EVENTS } from './events.js';

const RealtimeContext = createContext(null);

function socketOrigin() {
  const configured = import.meta.env.VITE_API_URL;
  if (!configured || configured.startsWith('/')) return undefined;
  return configured.replace(/\/api\/?$/, '');
}

export function RealtimeProvider({ children }) {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [reconnectedAt, setReconnectedAt] = useState(0);
  const acceptEvent = useCallback((eventName, payload, callback, seenEvents) => {
    if (payload?.eventId) {
      const key = `${eventName}:${payload.eventId}`;
      if (seenEvents.has(key)) return;
      seenEvents.add(key);
      if (seenEvents.size > 500) {
        seenEvents.delete(seenEvents.values().next().value);
      }
    }
    callback(payload);
  }, []);

  useEffect(() => {
    if (loading || !user) {
      setSocket(null);
      setConnectionStatus('offline');
      return undefined;
    }

    let active = true;
    let wasConnected = false;
    let connection;
    setConnectionStatus('connecting');

    const listeners = {};
    import('socket.io-client').then(({ io }) => {
      if (!active) return;
      connection = io(socketOrigin(), {
        path: '/api/socket.io',
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });
      setSocket(connection);

      listeners.connect = () => {
        setConnectionStatus('connected');
        if (wasConnected) setReconnectedAt((value) => value + 1);
        wasConnected = true;
      };
      listeners.disconnect = () => setConnectionStatus('reconnecting');
      listeners.connectError = () => setConnectionStatus('reconnecting');
      const seenEvents = new Set();
      listeners.recommendationUpdate = (payload) => acceptEvent(
        SOCKET_EVENTS.RECOMMENDATIONS_UPDATED,
        payload,
        (event) => {
          if (event.trigger !== 'new-job') toast('Your recommendations were updated.', { tone: 'success' });
        },
        seenEvents,
      );
      listeners.jobMatched = (payload) => acceptEvent(
        SOCKET_EVENTS.JOB_MATCHED,
        payload,
        (event) => toast(`${event.recommendation.job.title} was added to your recommendations.`, { tone: 'success' }),
        seenEvents,
      );
      listeners.applicationStatus = (payload) => acceptEvent(
        SOCKET_EVENTS.APPLICATION_STATUS_CHANGED,
        payload,
        (event) => toast(`Application status updated: ${event.status.replace('-', ' ')}.`, { tone: 'info' }),
        seenEvents,
      );
      listeners.newApplication = (payload) => acceptEvent(
        SOCKET_EVENTS.NEW_APPLICATION,
        payload,
        (event) => toast(`New application received for ${event.jobTitle}.`, { tone: 'info' }),
        seenEvents,
      );

      connection.on('connect', listeners.connect);
      connection.on('disconnect', listeners.disconnect);
      connection.on('connect_error', listeners.connectError);
      connection.on(SOCKET_EVENTS.RECOMMENDATIONS_UPDATED, listeners.recommendationUpdate);
      connection.on(SOCKET_EVENTS.JOB_MATCHED, listeners.jobMatched);
      connection.on(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, listeners.applicationStatus);
      connection.on(SOCKET_EVENTS.NEW_APPLICATION, listeners.newApplication);
    }).catch((error) => {
      if (!active) return;
      setConnectionStatus('reconnecting');
      console.error('Unable to load the live update client.', { name: error.name });
    });

    return () => {
      active = false;
      if (connection) {
        connection.off('connect', listeners.connect);
        connection.off('disconnect', listeners.disconnect);
        connection.off('connect_error', listeners.connectError);
        connection.off(SOCKET_EVENTS.RECOMMENDATIONS_UPDATED, listeners.recommendationUpdate);
        connection.off(SOCKET_EVENTS.JOB_MATCHED, listeners.jobMatched);
        connection.off(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, listeners.applicationStatus);
        connection.off(SOCKET_EVENTS.NEW_APPLICATION, listeners.newApplication);
        connection.disconnect();
      }
    };
  }, [acceptEvent, loading, toast, user]);

  const subscribe = useCallback((eventName, handler) => {
    if (!socket) return () => {};
    const seenEvents = new Set();
    const listener = (payload) => acceptEvent(eventName, payload, handler, seenEvents);
    socket.on(eventName, listener);
    return () => socket.off(eventName, listener);
  }, [acceptEvent, socket]);
  const value = useMemo(() => ({
    connectionStatus,
    reconnectedAt,
    subscribe,
  }), [connectionStatus, reconnectedAt, subscribe]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used inside RealtimeProvider.');
  return context;
}
