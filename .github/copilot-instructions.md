# Copilot Instructions

These instructions apply to all code-change requests in this repository.

## Unit tests

For any code change, add or update unit tests to cover the new or modified functionality. Ensure that all tests pass successfully before finalizing the code change.

## Required Validation

For every request that changes code, run and report the results of:

- `npm run test`
- `npm run typecheck`
- `npm run lint`

Run checks in the correct package directory (`client`, `server`, or `shared`) based on the files changed.

## Shell and OS and cli tools

- Assume Windows with PowerShell.
- Use PowerShell-safe command syntax.
- available cli tools
  - rg
  - jq
- When changing directories in one command, use PowerShell style, for example:
  - `Set-Location .\server; npm run typecheck`

## Response Requirements

For code changes, include in the final response:

- What was changed
- Which files were edited
- Validation outcomes for tests, typecheck, and lint
- If any required check was not run, explain why and provide the exact command to run
