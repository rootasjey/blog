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

The staging hostname is `staging-blog.corpinot.cc`. A Cloudflare Access application named `corpinot - staging blog` protects this exact public hostname with the existing `Cloudflare account members` allow policy. The first Worker deployment was made with `routes: []` and `workers_dev: false`; a separate `NUXT_AUTH_SECRET` is now stored in Cloudflare. The Wrangler config now attaches the custom-domain route only to the `staging` environment; deploying that config will create the hostname’s DNS and certificate. `workers_dev` remains disabled. Add a staging AI provider key only if AI requests are to be tested; the AI writer is disabled until then. Never copy production secrets into staging.
