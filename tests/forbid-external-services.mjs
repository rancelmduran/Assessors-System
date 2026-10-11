// Offline verification only. Blocks SMTP, Redis, Cloudflare, databases and all other remote traffic.
import net from 'node:net';
import tls from 'node:tls';
import { syncBuiltinESMExports } from 'node:module';
const loopback = host => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
const denied = () => { throw new Error('OFFLINE_EXTERNAL_CONNECTION_FORBIDDEN'); };
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (!loopback(url.hostname) || url.protocol !== 'http:') return denied();
  return originalFetch(input, options);
};
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const value = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = typeof value === 'object' ? value.host : typeof args[1] === 'string' ? args[1] : 'localhost';
  const port = typeof value === 'object' ? value.port : value;
  if (!loopback(host || 'localhost') || [25, 465, 587, 5432, 6543, 6379].includes(Number(port))) return denied();
  return connect.apply(this, args);
};
tls.connect = denied;
syncBuiltinESMExports();
