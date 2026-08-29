# Fracta

Fracta is one desktop application in one window with two toggled modes:

- **Knowledge** ports Fractapad's local Markdown and knowledge workflows
  without its upstream update or branding tethers.
- **Observatory** preserves RepoGraph's code graph and daily activity surfaces
  while using Fractorches as the canonical agent-session backend, owned as a
  sidecar process by the desktop app.

## Commands

```sh
pnpm install        # once
pnpm sidecar        # build the Fractorches sidecar binary (needs Go)
pnpm tauri dev      # desktop application, self-owned backend
pnpm dev            # web dev server only
pnpm check          # svelte-check
pnpm test           # frontend unit tests
```

The behavior contract is in [`PRODUCT.md`](PRODUCT.md), the implementation
contract is in [`PRODUCT-TECH.md`](PRODUCT-TECH.md), and active records start at
[`docs/index.md`](docs/index.md).
