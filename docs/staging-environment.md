# Staging environment

The `staging` Wrangler environment uses separate EU resources:

- D1: `corpinot-staging`
- R2: `corpinot-staging`
- KV: `corpinot-staging-kv` and `corpinot-staging-cache`

The D1 migrations are applied through `020_post_revision_retention_index.sql`. The staging database currently has zero posts and users, and the R2 bucket has no objects. No production records or media were copied. The homepage can still show the code-defined presentation posts from `app/utils/presentationPosts.ts`.

Always pass both the source configuration and environment to Wrangler commands. Without `--config wrangler.jsonc`, the generated Nuxt configuration can select production bindings:

```sh
bunx wrangler d1 migrations list corpinot-staging --remote --config wrangler.jsonc --env staging
bunx wrangler deploy --config wrangler.jsonc --env staging --dry-run
```

The staging Worker is deployed at `staging-blog.corpinot.cc` behind the Cloudflare Access application `corpinot - staging blog`, which uses the existing `Cloudflare account members` allow policy. Its custom-domain route exists only in the `staging` environment, and `workers_dev` remains disabled. A separate `NUXT_AUTH_SECRET` is stored in Cloudflare; no secret is committed. Add a staging AI provider key only if AI requests are to be tested; the AI writer is disabled until then. Never copy production secrets into staging.
