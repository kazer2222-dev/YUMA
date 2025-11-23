'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type EventMessage = {
  type: string;
  payload?: any;
  timestamp?: string;
};

interface UseServerSentEventsOptions {
  url?: string;
  spaceId?: string;
  channel?: string;
  onMessage?: (message: EventMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function useServerSentEvents(options: UseServerSentEventsOptions = {}) {
  const {
    url = '/api/realtime/events',
    spaceId,
    channel = 'global',
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Store callbacks in refs to prevent infinite loops
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onMessage, onError, onConnect, onDisconnect]);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) {
      return;
    }

    try {
      setStatus('connecting');
      
      const params = new URLSearchParams();
      if (spaceId) params.append('spaceId', spaceId);
      params.append('channel', channel);
      
      const eventSource = new EventSource(`${url}?${params.toString()}`);
      
      eventSource.onopen = () => {
        setStatus('connected');
        onConnectRef.current?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const message: EventMessage = JSON.parse(event.data);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        setStatus('error');
        onErrorRef.current?.(error);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setStatus('disconnected');
            connect();
          }
        }, 3000);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('SSE connection error:', error);
      setStatus('error');
    }
  }, [url, spaceId, channel, enabled]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('disconnected');
    onDisconnectRef.current?.();
  }, []);

  useEffect(() => {
    // Disconnect existing connection first
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, spaceId, channel, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}

// Hook for real-time task updates using SSE
export function useTaskUpdates(spaceId?: string) {
  const [tasks, setTasks] = useState<any[]>([]);

  const { isConnected } = useServerSentEvents({
    spaceId,
    channel: spaceId ? `tasks:${spaceId}` : 'tasks:global',
    enabled: !!spaceId,
    onMessage: (message) => {
      if (message.type === 'task:updated' || message.type === 'task:created') {
        const task = message.payload;
        setTasks(prev => {
          const index = prev.findIndex(t => t.id === task.id);
          if (index >= 0) {
            return [...prev.slice(0, index), task, ...prev.slice(index + 1)];
          }
          return [...prev, task];
        });
      } else if (message.type === 'task:deleted') {
        setTasks(prev => prev.filter(task => task.id !== message.payload.id));
      }
    },
  });

  return { tasks, isConnected };
}

// Hook for real-time notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const { isConnected } = useServerSentEvents({
    channel: 'notifications',
    onMessage: (message) => {
      if (message.type === 'notification') {
        setNotifications(prev => [message.payload, ...prev]);
      }
    },
  });

  return { notifications, isConnected };
}

// Hook for real-time space updates
export function useSpaceUpdates(spaceId: string) {
  const [space, setSpace] = useState<any>(null);

  const { isConnected } = useServerSentEvents({
    spaceId,
    channel: `space:${spaceId}`,
    onMessage: (message) => {
      if (message.type === 'space:updated') {
        setSpace(message.payload);
      }
    },
  });

  return { space, isConnected };
}
