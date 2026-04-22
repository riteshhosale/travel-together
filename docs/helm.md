# Helm chart for Travel Together

A minimal Helm chart is included at `deploy/helm/travel-together`.

Install (example):

```bash
helm upgrade --install travel-together deploy/helm/travel-together \
  --set image.repository=ghcr.io/your-org/travel-together-backend \
  --set image.tag=sha-abcdef
```

Values of interest:
- `image.repository` and `image.tag` — set to the image published by CI
- `readinessProbe.path` and `livenessProbe.path`
- `resources` — CPU/memory requests and limits

Prometheus
- The chart annotates pods for Prometheus scraping by default (see `values.yaml`).
 
Grafana Helm chart
- A Grafana Helm chart is available at `deploy/helm/grafana`. Install it to provision Grafana and the dashboard in-cluster:

```bash
helm upgrade --install grafana deploy/helm/grafana \
  --set adminPassword='YOUR_PASSWORD' \
  --set prometheus.url='http://prometheus:9090'
```

The chart creates a ConfigMap with provisioning files and dashboard and mounts it into the Grafana pod.

Grafana
- A simple dashboard is available at `deploy/grafana/travel-together-backend-dashboard.json`.
