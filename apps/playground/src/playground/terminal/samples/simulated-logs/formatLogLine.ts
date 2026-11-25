import { failedRequests, successfulRequests, type LogRequest } from './fixtures';

export function formatLogLine(sequence: number, time = new Date()) {
  const failed = sequence % 9 === 0;
  const samples = failed ? failedRequests : successfulRequests;
  const index = failed ? sequence / 9 : sequence - 1;
  const { method, path, status, durationMs, detail }: LogRequest = samples[index % samples.length] ?? samples[0];
  const timestamp = `${time.toTimeString().slice(0, 8)}.${String(time.getMilliseconds()).padStart(3, '0')}`;
  const level = status >= 500 ? '\x1b[91mERROR\x1b[0m' : status >= 400 ? '\x1b[33mWARN \x1b[0m' : '\x1b[32mINFO \x1b[0m';
  const latency = `${durationMs + Math.floor(Math.random() * 12)}ms`.padStart(5);
  const message = detail ? `  ${detail}` : '';
  return `${timestamp}  ${level}  ${method.padEnd(5)}  ${path.padEnd(17)}  ${status}  ${latency}${message}\r\n`;
}
