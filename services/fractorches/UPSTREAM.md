# Fractorches upstream provenance

This directory is an imported snapshot of the stable Fractorches service
(`agentsview`) used by Fracta's Observatory. The upstream project is
published by Kenn Software LLC at <https://github.com/kenn-io/agentsview> and
is licensed under the MIT License; the upstream `LICENSE` file is preserved in
this import.

## Snapshot

- Source revision: unavailable. The supplied source snapshot contains no
  usable Git metadata, so no commit or tag is claimed.
- Imported: 2026-08-29.
- Imported files: 2,372 regular files.
- Content manifest: `sha256:64d02b1b8e182208973844c64548286d247715e192fed7135f2f31fe30d5d9d8`.

The content-manifest hash is the SHA-256 digest of the UTF-8 manifest formed
from every imported regular file except this provenance document. Each record
contains the file's SHA-256 digest, two spaces, and its POSIX-relative path,
terminated by a newline. Records are sorted bytewise by relative path before
the manifest itself is hashed. This definition is independent of checkout
path, filesystem traversal order, and file timestamps.

## Import boundary

The service source, tests, build configuration, frontend source, embedded
fallback assets, and documentation required to build and operate Fractorches
are retained. The import intentionally omits transient or local-only content:

- Git and agent/tool metadata (`.git`, `.agents`, `.claude`, `.impeccable`,
  `.roborev`, `.superpowers`, `docs/superpowers`, and worktree state).
- OS metadata, dependency installations, frontend/build output, caches,
  generated documentation assets, and temporary output.
- Local data directories, session directories, extracted SSH keys, and the
  upstream desktop launchd plist containing a machine-specific path.
- The upstream changelog, which contains a contributor's personal identity,
  is omitted because it is not required to build or operate the service.

Two minimal sanitizations were applied to the imported snapshot: the upstream
`docs/superpowers` process material was removed because it is not required to
build or operate the service, and contributor-specific home-directory paths in
four test files and comments were replaced with the synthetic `/Users/example`
path.
These edits do not change production behavior or test semantics. The
Fractorches service remains the canonical implementation for archive, parsing,
query, usage, analytics, search, and sync behavior; RepoGraph API endpoints are
intentionally not part of this import.
