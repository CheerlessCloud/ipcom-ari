import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AriClient } from '../src/index.js';
import { startMockServer } from './helpers/mockServer.ts';

let server: Awaited<ReturnType<typeof startMockServer>>;

describe('WebSocket lifecycle', () => {
  beforeAll(async () => {
    server = await startMockServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('reconnects after drop and disconnects gracefully', async () => {
    const client = new AriClient({
      host: '127.0.0.1',
      port: server.port,
      username: 'user',
      password: 'pass',
    });

    const received: unknown[] = [];
    const connected = new Promise((r) => server.wss.once('connection', () => r(undefined)));
    await client.connectWebSocket(['app1']);
    await connected;
    client.on('StasisStart', (e) => {
      received.push(e);
    });

    server.sendEvent({ type: 'StasisStart', channel: { id: 'c1' }, application: 'app1' });
    await new Promise((r) => setTimeout(r, 150));
    expect(received).toHaveLength(1);

    // simulate server closing connection
    for (const ws of server.wss.clients) ws.close();
    await new Promise((r) => setTimeout(r, 100));

    server.sendEvent({ type: 'StasisStart', channel: { id: 'c2' }, application: 'app1' });
    await new Promise((r) => setTimeout(r, 200));
    expect(received.length).toBeGreaterThanOrEqual(2);
    expect(client.isWebSocketConnected()).toBe(true);

    await client.closeWebSocket();
    expect(client.isWebSocketConnected()).toBe(false);
    expect(server.connections()).toBe(0);
    await client.destroy();
  });
});
