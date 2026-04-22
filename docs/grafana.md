# Grafana provisioning

This repo includes files to provision Grafana with a Prometheus datasource and a dashboard for the backend.

Files:
- `deploy/grafana/provisioning/datasources/datasource.yml` — declares a Prometheus datasource (default URL: `http://prometheus:9090`).
- `deploy/grafana/provisioning/dashboards/dashboard.yml` — provider that loads dashboards from `/var/lib/grafana/dashboards`.
- `deploy/grafana/dashboards/travel-together-backend-dashboard.json` — the dashboard JSON for backend metrics.

How to use with the official Grafana Docker image:

- Mount provisioning and dashboards into the Grafana container:

```yaml
volumes:
  - ./deploy/grafana/provisioning:/etc/grafana/provisioning:ro
  - ./deploy/grafana/dashboards:/var/lib/grafana/dashboards:ro
```

- Start Grafana (example with Docker Compose):

```yaml
services:
  grafana:
    image: grafana/grafana:9.0.0
    ports:
      - '3000:3000'
    volumes:
      - ./deploy/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./deploy/grafana/dashboards:/var/lib/grafana/dashboards:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=changeme
```

Notes:
- Replace the Prometheus URL in `datasource.yml` with your Prometheus service URL if different.
- Alternatively, use the Grafana sidecar pattern (prometheus-community/kube-prometheus-stack or grafana sidecar) to manage dashboards via ConfigMaps in Kubernetes.

Kubernetes deploy

You can apply the provisioning and dashboard via ConfigMap and a Grafana Deployment in-cluster. Example manifests are in `deploy/grafana/k8s`:

- `deploy/grafana/k8s/grafana-configmap.yml` — ConfigMap containing provisioning files and dashboard JSON
- `deploy/grafana/k8s/grafana-deployment.yaml` — Grafana Deployment that mounts the ConfigMap
- `deploy/grafana/k8s/grafana-service.yaml` — ClusterIP Service for Grafana

Example apply:

```bash
# Create admin password secret (choose a strong password)
kubectl create secret generic grafana-admin --from-literal=admin-password='changeme' -n monitoring

# Apply ConfigMap and resources
kubectl apply -f deploy/grafana/k8s -n monitoring
```

Notes:
- Ensure Prometheus is accessible at the URL configured in the datasource (default `http://prometheus:9090`). If Prometheus runs in another namespace, update `deploy/grafana/k8s/grafana-configmap.yml` datasource URL accordingly.
- For production use, consider using a Helm chart or the kube-prometheus-stack which provides Grafana with sidecar support for dashboards.
