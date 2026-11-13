# Staging environment

The `staging` Wrangler environment uses separate EU resources:

- D1: `corpinot-staging`
- R2: `corpinot-staging`
- KV: `corpinot-staging-kv` and `corpinot-staging-cache`

The D1 migrations are applied through `020_post_revision_retention_index.sql`. No production records or media were copied.

Always pass both the source configuration and environment to Wrangler commands. Without `--config wrangler.jsonc`, the generated Nuxt configuration can select production bindings:

```sh
bunx wrangler d1 migrations list corpinot-staging --remote --config wrangler.jsonc --env staging
bunx wrangler deploy --config wrangler.jsonc --env staging --dry-run
```

The staging environment currently has no HTTP route (`routes: []`, `workers_dev: false`). Keep it that way until a staging hostname is selected and protected with Cloudflare Access. Before an HTTP deployment, set the staging `NUXT_PUBLIC_SITE_URL` and `NUXT_AUTH_ORIGIN`, provision a separate `NUXT_AUTH_SECRET`, and add a staging AI provider key if AI requests are to be tested. The AI writer is disabled until then. Never copy production secrets into staging.
