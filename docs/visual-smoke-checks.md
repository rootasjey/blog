# Local visual smoke checks

Run `bun run visual:check` while the Corpinot development server is available on port 3000.

The script uses fixed desktop and mobile viewports and checks the home page, post list, project list, tags directory, and an article in dark and light themes. It checks a few global style contracts, then saves full-page screenshots in a temporary directory for review. These checks catch broad CSS failures; they are not pixel-diff baselines and do not replace a visual review.

The authenticated editor check is skipped unless `VISUAL_COOKIE_HEADER` is set to a valid local session cookie header. Keep the value in the shell environment and never put it in source control or command output.

To inspect screenshots, use the temporary directory printed by the command. When a design is deliberately changed, review the screenshots before updating any future visual baseline.
