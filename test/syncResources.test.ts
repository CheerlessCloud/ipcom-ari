import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AriClient } from '../src/index.js';
import { startMockServer } from './helpers/mockServer.ts';

let server: Awaited<ReturnType<typeof startMockServer>>;

describe('Channel and bridge operations', () => {
  beforeAll(async () => {
    server = await startMockServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('handles external media and bridge management', async () => {
    const client = new AriClient({
      host: '127.0.0.1',
      port: server.port,
      username: 'user',
      password: 'pass',
    });

    const ext = await client.channels.createExternalMedia({
      app: 'ext',
      external_host: '127.0.0.1',
      format: 'slin16',
    });
    expect(ext.id).toBe('ext-chan-1');

    const bridge = await client.bridges.createBridge({ type: 'mixing', bridgeId: 'bridge-1' });
    expect(bridge.id).toBe('bridge-1');

    await client.bridges.addChannels('bridge-1', { channel: ext.id });
    await client.bridges.removeChannels('bridge-1', { channel: ext.id });
    await client.bridges.destroy('bridge-1');
    await client.destroy();
  });
});
