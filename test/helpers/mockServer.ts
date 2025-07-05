import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { WebSocketServer } from 'ws';
import type { AddressInfo } from 'node:net';

export interface MockServer {
  port: number;
  wss: WebSocketServer;
  sendEvent: (event: unknown) => void;
  connections: () => number;
  close: () => Promise<void>;
}

function handleHttp(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage> & { req: IncomingMessage }
): void {
  const pingResponse = { asterisk_id: 'mock', timestamp: Date.now() };
  const channel = { id: 'ext-chan-1', name: 'EXT', state: 'Up' };
  const bridge = { id: 'bridge-1', technology: 'softmix', bridge_type: 'mixing' };

  if (req.method === 'GET' && req.url === '/ari/asterisk/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(pingResponse));
    return;
  }

  if (req.method === 'POST' && req.url?.startsWith('/ari/channels/externalMedia')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(channel));
    return;
  }

  if (req.method === 'POST' && req.url === '/ari/bridges') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(bridge));
    return;
  }

  if (req.method === 'POST' && req.url?.includes('/addChannel')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
    return;
  }

  if (req.method === 'POST' && req.url?.includes('/removeChannel')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
    return;
  }

  if (req.method === 'DELETE' && req.url?.startsWith('/ari/bridges/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
    return;
  }

  res.writeHead(404);
  res.end();
}

export async function startMockServer(): Promise<MockServer> {
  const server = createServer(handleHttp);
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/ari/events')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;

  function sendEvent(event: unknown): void {
    const data = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(data);
      }
    }
  }

  async function close(): Promise<void> {
    await new Promise<void>((r) => wss.close(() => r()));
    await new Promise<void>((r) => server.close(() => r()));
  }

  return {
    port,
    wss,
    sendEvent,
    connections: () => wss.clients.size,
    close,
  };
}
