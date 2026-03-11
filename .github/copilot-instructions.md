# Copilot Instructions

These instructions apply to all code-change requests in this repository.

## Required Validation

For every request that changes code, run and report the results of:

- `npm run tests` (if missing in the target package, run `npm run test`)
- `npm run typecheck`
- `npm run lint`

Run checks in the correct package directory (`client`, `server`, or `shared`) based on the files changed.

## Shell and OS

- Assume Windows with PowerShell.
- Use PowerShell-safe command syntax.
- When changing directories in one command, use PowerShell style, for example:
  - `Set-Location .\server; npm run typecheck`

## Response Requirements

For code changes, include in the final response:

- What was changed
- Which files were edited
- Validation outcomes for tests, typecheck, and lint
- If any required check was not run, explain why and provide the exact command to run
