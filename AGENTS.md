# Agent Instructions

Follow these rules whenever making changes to this repository.

## Git & GitHub Workflow

1. **Always push changes to GitHub**
   - Every time you finish making changes in the codebase, stage, commit, and push them to the remote repository (`origin`) after verifying the build/checks pass.

2. **Commit Message Rules (Strict)**
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
