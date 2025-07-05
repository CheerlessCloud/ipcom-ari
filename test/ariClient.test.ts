import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AriClient } from '../src/index.js';
import { startMockServer } from './helpers/mockServer.ts';

let server: Awaited<ReturnType<typeof startMockServer>>;

const wsEvent = {
  type: 'StasisStart',
  args: [],
  channel: { id: 'channel-1', name: 'PJSIP/channel-1', state: 'Up' },
  application: 'testApp',
};

describe('AriClient integration', () => {
  beforeAll(async () => {
    server = await startMockServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should ping and receive websocket events', async () => {
    const client = new AriClient({
      host: '127.0.0.1',
      port: server.port,
      username: 'user',
      password: 'pass',
    });

    const ping = await client.asterisk.ping();
    expect(ping.asterisk_id).toBe('mock');

    const received: unknown[] = [];
    const connected = new Promise((r) => server.wss.once('connection', () => r(undefined)));
    await client.connectWebSocket(['testApp']);
    await connected;
    client.on('StasisStart', (e) => {
      received.push(e);
    });

    server.sendEvent(wsEvent);
    await new Promise((r) => setTimeout(r, 150));

    expect(received).toHaveLength(1);
    const first = received[0] as { channel: { id: string }; instanceChannel: unknown };
    expect(first.channel.id).toBe('channel-1');
    expect(first.instanceChannel).toBeDefined();
    expect(client.isWebSocketConnected()).toBe(true);

    await client.closeWebSocket();
    expect(client.isWebSocketConnected()).toBe(false);
    await client.destroy();
  });
});
