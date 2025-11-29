'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type WebSocketMessage = {
  type: string;
  payload: any;
  timestamp?: string;
};

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setStatus('connecting');
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setStatus('connected');
        setReconnectAttempts(0);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        setStatus('error');
        onError?.(error);
      };

      ws.onclose = () => {
        setStatus('disconnected');
        onDisconnect?.();
        
        // Attempt to reconnect
        if (enabled && reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setStatus('error');
    }
  }, [url, enabled, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onMessage, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    send,
    isConnected: status === 'connected',
  };
}

// WebSocket context for global state management
import { createContext, useContext, ReactNode } from 'react';

interface WebSocketContextType {
  status: WebSocketStatus;
  send: (message: WebSocketMessage) => boolean;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children, url }: { children: ReactNode; url?: string }) {
  const { status, send, isConnected } = useWebSocket({
    url,
    enabled: true,
  });

  return (
    <WebSocketContext.Provider value={{ status, send, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

// Hook for real-time task updates
export function useTaskUpdates(spaceId?: string) {
  const { send, isConnected } = useWebSocketContext();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected || !spaceId) return;

    // Subscribe to task updates for this space
    send({
      type: 'subscribe',
      payload: { channel: `tasks:${spaceId}` },
    });

    // Listen for task updates
    const handleTaskUpdate = (message: WebSocketMessage) => {
      if (message.type === 'task:updated' || message.type === 'task:created' || message.type === 'task:deleted') {
        // Handle task updates
        if (message.type === 'task:deleted') {
          setTasks(prev => prev.filter(task => task.id !== message.payload.id));
        } else {
          setTasks(prev => {
            const index = prev.findIndex(t => t.id === message.payload.id);
            if (index >= 0) {
              return [...prev.slice(0, index), message.payload, ...prev.slice(index + 1)];
            }
            return [...prev, message.payload];
          });
        }
      }
    };

    // Note: This would need to be integrated with the actual WebSocket message handling
    // For now, this is a placeholder structure

    return () => {
      send({
        type: 'unsubscribe',
        payload: { channel: `tasks:${spaceId}` },
      });
    };
  }, [spaceId, isConnected, send]);

  return { tasks };
}

// Hook for real-time notifications
export function useNotifications() {
  const { send, isConnected } = useWebSocketContext();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to notifications
    send({
      type: 'subscribe',
      payload: { channel: 'notifications' },
    });

    return () => {
      send({
        type: 'unsubscribe',
        payload: { channel: 'notifications' },
      });
    };
  }, [isConnected, send]);

  return { notifications };
}
















