# MarketEarth — Civic Ledger

MarketEarth is a community-economy application built on the Internet Computer. Me-Coins represent earned contributions; We-Coins represent governance participation.

## Architecture

- `src/frontend`: React, TypeScript, Vite and Tailwind; dashboard, work, staking and proposals.
- `src/backend`: Motoko canister, authorization and economy/governance APIs.
- `src/backend/dist`: generated backend artifacts; regenerate using the established toolchain.
- `test`: backend test infrastructure.
- `DESIGN.md`: existing visual language.
- `SECURITY.md`: responsible disclosure policy.

## Development

Use Node.js and pnpm compatible with the repository, plus the Motoko/Mops and Caffeine tooling required by the project.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm --dir src/frontend test
pnpm build
pnpm test:backend
```

For changes to the backend interface, run the configured backend build and `pnpm bindgen` before frontend validation. See `AGENTS.md` for existing tooling instructions. These commands are documented from the repository and have not been independently executed during this cleanup.

## Platform roadmap

Preserve existing identity, governance, and token semantics. Keep exchange contracts separately testable. Add AI and document services behind an authenticated server-side gateway; never expose provider credentials to browser code. Scope document retrieval to authorized users and workspaces. AI output must not authorize financial transactions.

Production deployment requires passing builds and tests, verification of published assets, authorization review, and explicit deployment configuration. This repository is not represented as production-ready by this document.
