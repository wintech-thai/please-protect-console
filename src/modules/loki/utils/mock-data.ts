import type { LokiLogEntry } from "../components/loki-log-table";
import type { VolumeDataPoint } from "../components/loki-volume-chart";

function randomLevel(): LokiLogEntry["level"] {
  const r = Math.random();
  if (r < 0.65) return "info";
  if (r < 0.80) return "debug";
  if (r < 0.92) return "warn";
  return "error";
}

const LOG_LINES = [
  'End processing HTTP request after 78.222ms - 200',
  'Received HTTP response headers after 77.862ms - 200',
  'System.Net.Http.HttpClient.Default.ClientHandler[101] Sending HTTP request POST http://logstash-auditlog.logstash-auditlog.svc.cluster.local:8080/',
  'System.Net.Http.HttpClient.Default.LogicalHandler[101] Start processing HTTP request POST http://logstash-auditlog.logstash-auditlog.svc.cluster.local:8080/',
  'Microsoft.AspNetCore.Hosting.Diagnostics[1] Request starting HTTP/1.1 GET http://0.0.0.0:80/health - - -',
  'Microsoft.AspNetCore.Routing.EndpointMiddleware[0] Executing endpoint \'/health\'',
  'Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker[1] Route matched with {action = "Get", controller = "Health"}',
  'Microsoft.AspNetCore.Mvc.Infrastructure.ObjectResultExecutor[1] Executing ObjectResult, writing value of type \'Microsoft.AspNetCore.Mvc.HealthCheckResult\'',
  'Microsoft.AspNetCore.Hosting.Diagnostics[2] Request finished HTTP/1.1 GET http://0.0.0.0:80/health - 200 - application/json;charset=utf-8 12.3456ms',
  '{"level":"info","msg":"processing request","method":"POST","path":"/api/v1/users","duration":"45ms","status":200}',
  '{"level":"warn","msg":"slow query detected","query":"SELECT * FROM orders","duration":"2345ms","threshold":"1000ms"}',
  '{"level":"error","msg":"connection refused","host":"redis-master.redis.svc.cluster.local","port":6379,"retries":3}',
  'Executing DbCommand [Parameters=[@p0=\'user-123\'], CommandType=\'Text\', CommandTimeout=\'30\'] SELECT * FROM users WHERE id = @p0',
  'Executed DbCommand (12ms) [Parameters=[@p0=\'user-123\'], CommandType=\'Text\', CommandTimeout=\'30\']',
  'Token validation succeeded for user user@example.com',
  'Cache miss for key: session:abc123def456, fetching from database',
  'Background job completed: SendEmailJob, duration: 234ms, status: success',
  'Rate limit exceeded for IP 192.168.1.100, endpoint: /api/v1/search',
  'Kubernetes liveness probe: GET /health 200 OK (2ms)',
  'Kubernetes readiness probe: GET /ready 200 OK (1ms)',
];

const PODS = [
  'pp-api-7d9f8b6c5-xk2p9',
  'pp-api-7d9f8b6c5-mn4q7',
  'pp-api-7d9f8b6c5-rj8w3',
  'pp-api-server-01-6c8d9f-abc12',
];

const CONTAINERS = ['pp-api', 'pp-api-server', 'sidecar-proxy'];

function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '').substring(0, 23);
}

function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
}

export function generateMockLogs(count = 80): LokiLogEntry[] {
  const now = Date.now();
  const logs: LokiLogEntry[] = [];

  for (let i = 0; i < count; i++) {
    const offsetMs = (count - i) * 800 + Math.random() * 400;
    const date = new Date(now - offsetMs);
    const level = randomLevel();
    const pod = PODS[Math.floor(Math.random() * PODS.length)];
    const container = CONTAINERS[Math.floor(Math.random() * CONTAINERS.length)];
    const line = LOG_LINES[Math.floor(Math.random() * LOG_LINES.length)];

    logs.push({
      id: `log-${i}-${Date.now()}`,
      timestamp: date.toISOString(),
      timestampDisplay: formatDisplayTime(date),
      level,
      line,
      labels: {
        namespace: 'pp-development',
        app: 'pp-api',
        container,
        pod,
        stream: 'stdout',
        node: 'pp-api-server-01',
      },
    });
  }

  return logs;
}

export function generateMockVolumeData(points = 48): VolumeDataPoint[] {
  const now = Date.now();
  const intervalMs = 60 * 1000; // 1 minute intervals
  const data: VolumeDataPoint[] = [];

  for (let i = points; i >= 0; i--) {
    const date = new Date(now - i * intervalMs);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // Simulate realistic log volume with some spikes
    const base = 200 + Math.random() * 300;
    const spike = Math.random() < 0.1 ? Math.random() * 800 : 0;
    const count = Math.round(base + spike);

    data.push({ time: timeStr, count });
  }

  return data;
}
