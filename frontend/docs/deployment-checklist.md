# Deployment Checklist

This checklist helps prepare the Travel Together service for production deployment.

- [ ] Update environment variables: ensure `NODE_ENV=production`, `PORT`, `MONGO_URI`, `JWT_SECRET`, `SENTRY_DSN` (if used), `CLIENT_URL`.
- [ ] Ensure secrets are stored in a secure secret manager (Vault/Secrets Manager) or CI/CD environment variables.
- [ ] Run tests and build locally:
  - Backend: `cd backend && npm test && npm run build` (if applicable)
  - Frontend: `cd frontend/client && npm test && npm run build`
- [ ] Confirm `docker-compose.yml` and Dockerfiles use production images and non-root users where possible.
- [ ] Configure healthchecks:
  - Liveness: call `/api/health` (returns 200 when process alive)
  - Readiness: call `/api/ready` (returns 200 when DB reachable)
  - Metrics: `/metrics` (Prometheus metrics) — enabled when `prom-client` is installed

Docker healthcheck example (add to the backend service in `docker-compose.yml`):

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/ready"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

Kubernetes readiness/liveness probe example:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 15
  periodSeconds: 20

readinessProbe:
  httpGet:
    path: /api/ready
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 10
```

- [ ] Configure Prometheus scrape for `/metrics` if using Prometheus.
- [ ] Add monitoring/alerting rules (Sentry, Prometheus Alertmanager) for:
  - high error rate
  - high latency
  - DB disconnects
  - high memory or CPU usage
- [ ] Enable access logging and centralized logs (e.g., CloudWatch/ELK/Datadog) and ensure Sentry DSN is set.
- [ ] Run a graceful shutdown test (SIGTERM) and confirm workers drain and connections close.
- [ ] Post-deploy smoke test: register/login, create trip, send a message, view feed.

Notes:
- The app exposes `/api/health`, `/api/ready`, and `/metrics` (when enabled). Use these endpoints for orchestration and monitoring.
- If running behind a load balancer or platform (Vercel, Heroku, Kubernetes), ensure platform routing and timeouts are configured.
