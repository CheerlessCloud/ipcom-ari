import type { WebSocketEvent, WebSocketEventType } from './events.types';

export type WebSocketEventListener = (data: WebSocketEvent) => void;

export type TypedWebSocketEventListener<T extends WebSocketEvent['type']> = (
  data: Extract<WebSocketEvent, { type: T }>
) => void;

export interface WebSocketReconnectInfo {
  apps: string[];
  subscribedEvents?: WebSocketEventType[];
}

export type WebSocketClientEvents = {
  connected: void;
  disconnected: void;
  reconnected: WebSocketReconnectInfo;
  reconnectFailed: Error;
  error: Error;
} & {
  [K in WebSocketEventType]: Extract<WebSocketEvent, { type: K }>;
};

export type WebSocketClientEventType = keyof WebSocketClientEvents;

export type WebSocketClientEventListener<T extends WebSocketClientEventType> = (
  data: WebSocketClientEvents[T]
) => void;
