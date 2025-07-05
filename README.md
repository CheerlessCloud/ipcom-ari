# @ipcom/asterisk-ari

A modern JavaScript/TypeScript library for interacting with the Asterisk REST Interface (ARI).

## Features

- Complete Asterisk ARI support
- Written in TypeScript with full type support
- WebSocket support for real-time events
- Automatic reconnection management
- Simplified channel and playback handling
- ESM and CommonJS support
- Complete type documentation

## Installation

```bash
npm install @ipcom/asterisk-ari
```

## Basic Usage

### Initial Setup

```typescript
import { AriClient } from '@ipcom/asterisk-ari';

const client = new AriClient({
    host: 'localhost',      // Asterisk host
    port: 8088,            // ARI port
    username: 'username',   // ARI username
    password: 'password',   // ARI password
    secure: false          // Use true for HTTPS/WSS
});
```
### Custom Logging

You can inject your own logger implementing the `Logger` interface. When omitted, the client uses `console` by default.

```typescript
const logger = {
  log: (...args: unknown[]) => console.log("[custom]", ...args),
  warn: (...args: unknown[]) => console.warn("[custom]", ...args),
  error: (...args: unknown[]) => console.error("[custom]", ...args)
};

const client = new AriClient({
  host: "localhost",
  port: 8088,
  username: "user",
  password: "pass",
  logger,
});
```


### WebSocket Connection

```typescript
// Connect to WebSocket to receive events
await client.connectWebSocket(['myApp']); // 'myApp' is your application name

// Listen for specific events
client.on('StasisStart', event => {
    console.log('New channel started:', event.channel.id);
});

client.on('StasisEnd', event => {
    console.log('Channel ended:', event.channel.id);
});

// Listen for DTMF events
client.on('ChannelDtmfReceived', event => {
    console.log('DTMF received:', event.digit);
});

// Subscribe to WebSocket connection events
client.on('connected', () => {
    console.log('WebSocket connected');
});

client.on('reconnected', info => {
    console.log('WebSocket reconnected:', info);
});

client.on('disconnected', () => {
    console.log('WebSocket disconnected');
});

client.on('reconnectFailed', err => {
    console.error('WebSocket reconnect failed:', err);
});

client.on('error', err => {
    console.error('WebSocket error:', err);
});

// Close WebSocket connection
client.closeWebSocket();
```

## Event Instances

### Channel, Bridge and Playback Instances in Events

When working with WebSocket events, you get access to both the raw event data and convenient instance objects that allow direct interaction with the channel or playback:

```typescript
client.on('StasisStart', async event => {
    // event.channel contains the raw channel data
    console.log('New channel started:', event.channel.id);

    // event.instanceChannel provides a ready-to-use ChannelInstance
    const channelInstance = event.instanceChannel;

    // You can directly interact with the channel through the instance
    await channelInstance.answer();
    await channelInstance.play({ media: 'sound:welcome' });
});

client.on('BridgeCreated', async event => {
    // event.bridge contains the raw bridge data
    console.log('Bridge created:', event.bridge.id);

    // event.instanceBridge provides a ready-to-use BridgeInstance
    const bridgeInstance = event.instanceBridge;

    // Direct control through the instance
    await bridgeInstance.add({ channel: ['channel-id-1', 'channel-id-2'] });
});

// Similarly for playback events
client.on('PlaybackStarted', async event => {
  // event.playback contains the raw playback data
  console.log('Playback ID:', event.playback.id);

  // event.instancePlayback provides a ready-to-use PlaybackInstance
  const playbackInstance = event.instancePlayback;
  
  // Direct control through the instance
  await playbackInstance.control('pause');
});
```

This approach provides two key benefits:
1. No need to manually create instances using `client.Channel()` or `client.Playback()`
2. Direct access to control methods without additional setup

### Comparing Approaches

Traditional approach:
```typescript
client.on('StasisStart', async event => {
  // Need to create channel instance manually
  const channel = client.Channel(event.channel.id);
  await channel.answer();
});
```

Using instance from event:
```typescript
client.on('StasisStart', async event => {
  // Instance is already available
  await event.instanceChannel.answer();
});
```

This feature is particularly useful when handling multiple events and needing to perform actions on channels or playbacks immediately within event handlers.

### Channel Handling

```typescript
// Create a channel instance
const channel = client.Channel();

// Originate a call
await channel.originate({
  endpoint: 'PJSIP/1000',
  extension: '1001',
  context: 'default',
  priority: 1
});

// Answer a call
await channel.answer();

// Play audio
const playback = await channel.play({
  media: 'sound:welcome'
});

// Hangup the channel
await channel.hangup();
```

### Playback Handling

```typescript
// Create a playback instance
const playback = client.Playback();

// Monitor playback events
playback.on('PlaybackStarted', event => {
  console.log('Playback started:', event.playback.id);
});

playback.on('PlaybackFinished', event => {
  console.log('Playback finished:', event.playback.id);
});

// Control playback
await playback.control('pause');  // Pause
await playback.control('unpause'); // Resume
await playback.control('restart'); // Restart
await playback.stop();            // Stop
```

### Bridge Handling

```typescript
// Create a bridge instance
const bridge = client.Bridge();

// Create a new bridge with specific settings
await bridge.getDetails();

// Add channels to the bridge
await bridge.add({
  channel: ['channel-id-1', 'channel-id-2']
});

// Remove channels from the bridge
await bridge.remove({
  channel: ['channel-id-1']
});

// Play audio on the bridge
const playback = await bridge.playMedia({
  media: 'sound:announcement',
  lang: 'en'
});

// Stop playback on the bridge
await bridge.stopPlayback(playback.id);

// Set video source
await bridge.setVideoSource('video-channel-id');

// Clear video source
await bridge.clearVideoSource();
```

### Specific Channel Monitoring

```typescript
// Create an instance for a specific channel
const channel = client.Channel('channel-id');

// Monitor specific channel events
channel.on('ChannelStateChange', event => {
  console.log('Channel state changed:', event.channel.state);
});

channel.on('ChannelDtmfReceived', event => {
  console.log('DTMF received on channel:', event.digit);
});

// Get channel details
const details = await channel.getDetails();
console.log('Channel details:', details);

// Handle channel variables
await channel.getVariable('CALLERID');
await channel.setVariable('CUSTOM_VAR', 'value');
```

### Channel Playback Handling

```typescript
// Play audio on a specific channel
const channel = client.Channel('channel-id');
const playback = await channel.play({
  media: 'sound:welcome',
  lang: 'en'
});

// Monitor specific playback
playback.on('PlaybackStarted', event => {
  console.log('Playback started on channel');
});

// Control playback
await channel.stopPlayback(playback.id);
await channel.pausePlayback(playback.id);
await channel.resumePlayback(playback.id);
```

### Bridge Event Monitoring

```typescript
// Create an instance for a specific bridge
const bridge = client.Bridge('bridge-id');

// Monitor bridge events
bridge.on('BridgeCreated', event => {
  console.log('Bridge created:', event.bridge.id);
});

bridge.on('BridgeDestroyed', event => {
  console.log('Bridge destroyed:', event.bridge.id);
});

bridge.on('BridgeMerged', event => {
  console.log('Bridge merged:', event.bridge.id);
});

// Get bridge details
const details = await bridge.get();
console.log('Bridge details:', details);

// Monitor channel events in bridge
bridge.on('ChannelEnteredBridge', event => {
  console.log('Channel entered bridge:', event.channel.id);
});

bridge.on('ChannelLeftBridge', event => {
  console.log('Channel left bridge:', event.channel.id);
});
```

## Error Handling

```typescript
try {
  await client.connectWebSocket(['myApp']);
} catch (error) {
  console.error('Error connecting to WebSocket:', error);
}

// Using with async/await
try {
  const channel = client.Channel();
  await channel.originate({
    endpoint: 'PJSIP/1000'
  });
} catch (error) {
  console.error('Error originating call:', error);
}
```

## TypeScript Support

The library provides complete type definitions for all operations:

```typescript
import type {
    Channel,
    Bridge,
    ChannelEvent,
    BridgeEvent,
    WebSocketEvent
} from '@ipcom/asterisk-ari';

// Types will be available for use
const handleChannelEvent = (event: ChannelEvent) => {
  const channelId: string = event.channel.id;
};

// Types will be available for use
const handleBridgeEvent = (event: BridgeEvent) => {
    const bridgeId: string = event.bridge.id;
};
```

## Additional Features

The library provides access to many other ARI features:

- Endpoint handling
- Sound manipulation
- Application control
- Asterisk system information
- And much more...

## Advanced Examples

### Bridge Creation and Channel Management

```typescript
// Create and manage a bridge
const bridge = await client.bridges.createBridge({
    type: 'mixing',
    name: 'myBridge'
});

// Add channels to bridge
await client.bridges.addChannels(bridge.id, {
    channel: ['channel-id-1', 'channel-id-2']
});
```

### Recording Management

```typescript
// Start recording on a channel
const channel = client.Channel('channel-id');
await channel.record({
    name: 'recording-name',
    format: 'wav',
    maxDurationSeconds: 60,
    beep: true
});
```

### External Media

```typescript
// Create external media channel
const channel = await client.channels.createExternalMedia({
    app: 'myApp',
    external_host: 'media-server:8088',
    format: 'slin16'
});
```

## API Reference

For complete API documentation, please refer to the TypeScript types and interfaces exported by the package.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache-2.0

