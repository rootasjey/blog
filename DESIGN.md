# Corpinot design system

## Direction

- Use [Core](https://core.primedirection.org/) as the primary visual reference for the public site: restrained neutral surfaces, clear type hierarchy, generous but consistent spacing, and deliberate interactions.
- Use Senna only as a secondary reference when Core does not show a needed pattern, such as the author profile composition.
- Keep Corpinot's existing typography, neutral palette, and purple accent. References guide composition and behavior; they are not copied as a new brand.
- Prefer shared tokens and existing components over page-specific visual values. Add a new component only when it captures behavior or structure reused in more than one place.

## Foundations

Shared colors, typography, radii, spacing, and motion live in `app/styles/site-global.css` under `@layer tokens`. The dark theme overrides semantic colors and inherits shape, spacing, and motion values.

| Role | Token | Value | Use |
| --- | --- | ---: | --- |
| Small icon container | `--site-radius-icon` | 8px | Compact square icon buttons |
| Tag | `--site-radius-tag` | 10px | Small topic and metadata chips |
| Control | `--site-radius-control` | 12px | Buttons, fields, menus, and compact controls |
| Inline media | `--site-radius-inline-media` | 12px | Images inside article/editor content |
| Card | `--site-radius-card` | 16px | Repeated content cards, author cards, and thumbnails |
| Panel | `--site-radius-panel` | 20px | Larger grouped surfaces, such as auth panels |
| Feature cover | `--site-radius-cover` | 26px | Article and page cover media |
| Pill | `--site-radius-pill` | 9999px | Circular avatars and intentionally pill-shaped controls |

Spacing tokens follow a 4px base scale (`--site-space-1` through `--site-space-16`). Motion uses `--site-motion-fast`, `--site-motion-standard`, and `--site-ease-standard`; respect `prefers-reduced-motion` for non-essential movement.

## Component roles and exceptions

- `AppHeader.vue` owns the shared site navigation and its interaction states.
- `PostShareActions.vue`, `TagsDirectory.vue`, and the post/project card components own their reusable feature controls and media treatments.
- Article covers use the feature-cover radius and clip their image to the same rounded frame. Inline article images use the smaller inline-media radius.
- Public list rows may stay square where their border or divider defines the row; do not round every image mechanically. Full-bleed article media remains edge-to-edge by design.
- Use the same semantic color and radius tokens in light and dark themes instead of introducing per-route copies.

## Adoption

The system is being applied incrementally to shared, high-visibility components. When editing an existing page, replace repeated literal values with the matching semantic token where the role is clear; keep intentionally different editorial treatments documented above.
