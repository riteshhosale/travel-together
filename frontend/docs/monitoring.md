# Monitoring & Observability

This document describes a minimal monitoring setup for Travel Together using Prometheus and Sentry.

## Prometheus scrape config (example)

Add a scrape job to your Prometheus configuration to collect metrics from the backend:

```yaml
scrape_configs:
  - job_name: 'travel-together-backend'
    metrics_path: /metrics
    static_configs:
      - targets: ['backend:5000']
    scrape_interval: 15s
    scrape_timeout: 10s
```

If running in Kubernetes, use `kube_sd_configs` or `service` discovery and annotate the service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: travel-together-backend
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/path: /metrics
    prometheus.io/port: '5000'
spec:
  selector:
    app: travel-together
  ports:
    - port: 5000
      targetPort: 5000
```

## Sentry

- Install Sentry SDKs and set `SENTRY_DSN` in your production environment.
- Backend: `@sentry/node` is already integrated; set `tracesSampleRate` appropriately (0.0 by default in the repo).
- Frontend: `@sentry/react` and `@sentry/tracing` are included; initialize in production only and set a sample rate.

## Alerting recommendations

- Create alerts for:
  - `error` spikes (Sentry + Prometheus derived errors)
  - High latency (value from custom histograms / HTTP request duration)
  - DB disconnects or readiness failing (`/api/ready` returning 503)
  - High memory or CPU usage

## Grafana dashboards

- Use a basic Node.js dashboard to visualize `process_*` and `travel_together_*` metrics collected by `prom-client`.
- Track request latency, error rate, heap usage, and active connections.

## HTTP metrics added

- The backend now records request durations in a histogram named `http_request_duration_seconds` with labels `method`, `route`, and `status`.
- This is exposed on `/metrics` along with default `prom-client` metrics. Use these metrics to build latency and P95/P99 dashboards.

## Deploy examples

- Kubernetes deployment with readiness/liveness probes and Prometheus annotations can be found in `deploy/backend-deployment.yaml`.
- A Prometheus scrape example is in `deploy/prometheus-scrape.yml`.

## Notes

- `/metrics` is enabled only when `prom-client` is installed. If you need more detailed HTTP metrics, consider instrumenting request durations with an Express middleware and a `Histogram` from `prom-client`.
- Ensure your monitoring stack can reach container network names used in `docker-compose` (e.g., `backend:5000`).
