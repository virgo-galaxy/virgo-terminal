export type LogRequest = { method: string; path: string; status: number; durationMs: number; detail?: string };

export const successfulRequests = [
  { method: 'GET', path: '/api/health', status: 200, durationMs: 3 },
  { method: 'GET', path: '/api/projects', status: 200, durationMs: 16 },
  { method: 'POST', path: '/api/jobs', status: 202, durationMs: 38 },
  { method: 'GET', path: '/api/jobs/104', status: 200, durationMs: 22 },
  { method: 'PATCH', path: '/api/projects/12', status: 204, durationMs: 29 },
] as const satisfies readonly LogRequest[];

export const failedRequests = [
  { method: 'GET', path: '/api/projects/87', status: 404, durationMs: 10, detail: 'Project not found' },
  { method: 'POST', path: '/api/jobs', status: 429, durationMs: 8, detail: 'Rate limited' },
  { method: 'GET', path: '/api/jobs/104', status: 503, durationMs: 125, detail: 'Upstream unavailable' },
] as const satisfies readonly LogRequest[];
