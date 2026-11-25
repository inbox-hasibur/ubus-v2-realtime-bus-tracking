# Agent Instructions

Follow these rules whenever making changes to this repository.

## Git & GitHub Workflow

1. **Always push changes to the `upgrade` branch**
   - Every time you finish making changes in the codebase, verify the build/checks pass, then stage, commit, and push them to `origin/upgrade`.
   - **Never** merge or push directly to `main` unless explicitly asked by the user.

2. **Merging & Production Deployment**
   - Only merge `upgrade` into `main` when the user explicitly instructs you to merge into `main`.
   - If the user asks to **deploy / make live in production** (e.g. "production e live koro", "push to production"), automatically:
     1. Commit and push all changes to `upgrade`.
     2. Merge `upgrade` into `main`.
     3. Push `main` to `origin` so the production deployment triggers.

3. **Commit Message Rules (Strict)**
   - **Never** use colons (`:`) in commit messages.
   - **Never** use conventional-commit prefixes or AI-style tags such as `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `build`, or `perf`.
   - Write short, natural, human-style commit messages of **2 to 5 words** that clearly describe what changed.
   - **Good examples:**
     - `login and registration`
     - `update bus schedule ui`
     - `add driver cockpit page`
     - `fix map marker position`
     - `add changelog and readme`
   - **Bad examples (do NOT use):**
     - `feat: add login and registration`
     - `fix(map): resolve marker bug`
     - `chore: update documentation`

## Code Quality

- Run `npx tsc --noEmit` (or `npm run lint` / `npm run build`) before committing to ensure there are no TypeScript or build errors.
- Keep existing comments and unrelated code intact.
