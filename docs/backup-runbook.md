**Backup & Runbook — Travel Together**

This document describes the recommended backup strategy and incident runbook for the Travel Together project.

Backup strategy

- MongoDB (production):
  - Use managed backups (Atlas snapshots) or scheduled filesystem snapshots for self-hosted MongoDB.
  - Snapshot frequency: hourly for critical collections, daily for full cluster snapshots.
  - Retention: 30 days for hourly snapshots, 90 days for daily snapshots (adjust to policy).
  - Test restores monthly to a staging cluster.

- File uploads (images):
  - If using Cloudinary or S3, rely on provider's durability guarantees + enable object versioning where possible.
  - Periodically export object lists and metadata to cloud storage (daily).

- Configuration & secrets:
  - Keep a copy of non-sensitive configuration in the repo (example .env.example). Use a secret manager (Vault, AWS Secrets Manager, Azure Key Vault) for real secrets.

Restore procedures (high-level)

1. Identify the time range to restore (timestamp or oplog position).
2. For MongoDB Atlas: use Atlas UI or CLI to restore a snapshot to a new cluster or point-in-time restore to existing cluster's secondary.
3. For self-hosted: restore from filesystem snapshot or `mongorestore` from BSON dumps.
4. Validate data integrity in staging: run smoke tests and compare collection counts.
5. If restoring to production, schedule a maintenance window and ensure application is stopped or in read-only mode.

Runbook — outage scenarios

- API unavailable (app crashes or high error rate):
  - Step 1: Check process manager (systemd/docker/k8s) logs and restart service if transient.
  - Step 2: Check CPU/memory, disk usage, and open file descriptors.
  - Step 3: Inspect application logs / Sentry for last error events.
  - Step 4: If caused by DB connectivity, check MongoDB metrics and restore from secondary or failover.
  - Step 5: If cannot recover quickly, failover to a read-only replica or restore from backups to a new cluster.

- Data corruption or accidental deletion:
  - Step 1: Identify affected collections and time window.
  - Step 2: Perform a restore to a staging environment of the most recent snapshot prior to corruption.
  - Step 3: Extract correct data and import to production using `mongorestore` or scripted migration.

- Abuse or high traffic (DDoS/spike):
  - Step 1: Enable/scale rate-limiting temporarily, block offending IPs via WAF.
  - Step 2: Scale application horizontally (add instances) or enable CDN protections.

Contacts & escalation

- Team on-call: <your-oncall@example.com>
- PagerDuty/SMS: +1-555-000-0000 (replace with actual)
- GitHub repo: https://github.com/riteshhosale/travel-together-backend (issues & PRs)

Notes

- Regularly test backup and restore procedures. Backups that are never restored are unreliable.
- Keep runbook steps concise and up-to-date in this file.
