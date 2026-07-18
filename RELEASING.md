# Releasing

The MIT packages (`@localeguard/core`, `@localeguard/cli`) publish to npm via
Changesets. `@localeguard/action` is `private` (distributed through GitHub, not
npm) and `@localeguard/web` is ignored — Changesets versions but never publishes
either.

## One-time setup
- [ ] Add repo secret `NPM_TOKEN` (npm automation token with publish rights to the `@localeguard` scope).
- [ ] Confirm the `@localeguard` org exists on npm and your account can publish to it.
- [ ] Verify `.changeset/config.json` has `"access": "public"` (scoped packages default to restricted).

## Per release
1. [ ] Land your changes on a branch with a changeset: `pnpm changeset` → pick packages + bump type → write the summary.
2. [ ] Open a PR. CI must be green (`pnpm check` → EXIT 0).
3. [ ] Merge to `main`. The **Release** workflow opens/updates a **Version Packages** PR.
4. [ ] Review the Version PR: version bumps + generated CHANGELOG entries look right.
5. [ ] Merge the Version PR. The workflow re-runs `pnpm check`, then `pnpm release` publishes to npm.
6. [ ] Verify on npm: `npm view @localeguard/core version` / `@localeguard/cli`.
7. [ ] `npx @localeguard/cli check ./fixtures/i18next --source en --format i18next` from a clean dir to smoke-test the published artifact.

## GitHub Action release (separate)
The Action runs from the **committed** `packages/action/dist/index.cjs` (see the
`.gitignore` exception), so a release means rebuilding and committing that bundle:
1. [ ] `pnpm --filter @localeguard/action build`
2. [ ] Commit the updated `packages/action/dist/`.
3. [ ] Tag a Marketplace version and move the major tag: `git tag -f v1 && git push -f origin v1` (plus the immutable `v1.x.y` tag).

## Manual fallback (if the workflow is unavailable)
```bash
pnpm check          # must be EXIT 0
pnpm changeset version
git commit -am "chore: version packages"
pnpm release        # build + changeset publish
```
