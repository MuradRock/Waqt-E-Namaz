# AWS Deployment

The backend is a stateless Docker container designed to run on **ECS Fargate**
behind an **Application Load Balancer**, backed by **RDS Postgres (PostGIS)**
and secrets from **AWS Secrets Manager**. Structured logs go to **CloudWatch**.

## Recommended AWS topology

```
Internet
   │
   ▼
┌──────────────┐
│     ALB      │  HTTPS, ACM cert, routes /api/* to target group
└──────┬───────┘
       │
       ▼
┌──────────────┐   ┌────────────────────────┐
│ ECS Fargate  │──▶│ RDS Postgres + PostGIS │
│  (waqt-api)  │   │  (Multi-AZ optional)   │
└──────┬───────┘   └────────────────────────┘
       │
       ├──▶ Secrets Manager (DATABASE_URL, JWT_SECRET)
       ├──▶ CloudWatch Logs (/ecs/waqt-api)
       └──▶ S3 + CloudFront (tone assets, later)
```

## Environment (Secrets Manager)

Store a single JSON secret `waqt/api/prod` with:

```json
{
  "DATABASE_URL": "postgresql://waqt:...@waqt-db.xxxxx.rds.amazonaws.com:5432/waqt?sslmode=require",
  "JWT_SECRET": "at-least-32-random-bytes-base64",
  "JWT_EXPIRES_IN": "24h",
  "CORS_ORIGINS": "https://app.waqt.example.com",
  "LOG_LEVEL": "info"
}
```

In the ECS task definition, map each key under `secrets` (see `taskdef.json`).

## Enable PostGIS on RDS

After the RDS instance is created and reachable, run once as a superuser:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Then apply migrations from a bastion or via a one-off ECS task:

```bash
DATABASE_URL=... npx prisma migrate deploy
```

## Deploy flow (GitHub Actions or CodePipeline)

1. Build image → `docker build -f backend/Dockerfile --target prod backend`
2. Push to **ECR**
3. Update ECS service to the new image tag
4. ECS runs the container, ALB health-checks `/health`

## Task definition (reference)

See `infra/ecs/taskdef.json`.
