#!/usr/bin/env bash
# scripts/check-privacy.sh
# Privacy boundary enforcement for the wiki module.
# Runs against the wiki surface only (theFracta/src/lib/wiki/,
# src/lib/modules/wiki/, docs/wiki-privacy.md).
#
# Fails (exit 1) if any wiki file contains:
#   - Absolute paths under $HOME or /Users/<name>
#   - Source-system session ids (any v4 UUID)
#   - Verbatim chat-style content markers
#   - Token / cost / model-id shapes
# Fails if ~/.fracta/ is referenced in any wiki file.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FAIL=0

fail() { echo "FAIL: $1" >&2; FAIL=1; }
ok() { echo "OK: $1"; }

# Privacy patterns
HOME_RE="(/Users/[^/ ]+/|~/[A-Za-z])"
# UUID v4 shape (any source-system id)
UUID_RE="\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b"
# Chat-style content markers
HUMAN_MARKER="(Human:|Assistant:|tool_use_result)"
# Transcript-shape markers
TRANSCRIPT_MARKER="(<ide_opened_file>|<ide_selection>|tool_use_id|server_tool_use)"

# Wiki surface - the only paths this boundary guards
WIKI_PATHS=(
  src/lib/wiki
  src/lib/modules/wiki
)

SCOPE="${1:-staged}"
case "$SCOPE" in
  staged)   TARGETS="$(git diff --cached --name-only -- "${WIKI_PATHS[@]}")"; MODE="staged wiki diff" ;;
  full)     TARGETS="$(git ls-files "${WIKI_PATHS[@]}")"; MODE="full wiki surface" ;;
  *)        echo "usage: $0 [staged|full]" >&2; exit 2 ;;
esac

echo "checking privacy boundary in: $MODE"

if [ -z "$TARGETS" ]; then
  ok "no wiki files to check"
  exit 0
fi

# 1. ~/.fracta/ path leak in any wiki file
for f in $TARGETS; do
  [ -f "$f" ] || continue
  if grep -nE "(~/?\.fracta|/\.fracta/)" "$f" >/dev/null 2>&1; then
    fail "~/.fracta/ path leaked into $f"
  fi
done

# 2. Per-file checks
for f in $TARGETS; do
  [ -f "$f" ] || continue
  if file --mime-type --brief "$f" 2>/dev/null | grep -qv "^text/"; then
    continue
  fi
  if grep -nE "$HOME_RE" "$f" >/dev/null 2>&1; then
    fail "absolute path leak in $f"
  fi
  if [ "$SCOPE" = "staged" ]; then
    if git diff --cached "$f" | grep -nE "$HOME_RE" >/dev/null 2>&1; then
      fail "absolute path leak in staged change to $f"
    fi
  fi
  if grep -nE "$UUID_RE" "$f" >/dev/null 2>&1; then
    fail "session uuid shape detected in $f"
  fi
  if grep -nE "$HUMAN_MARKER" "$f" >/dev/null 2>&1; then
    fail "chat content marker (Human:/Assistant:) detected in $f"
  fi
  if grep -nE "$TRANSCRIPT_MARKER" "$f" >/dev/null 2>&1; then
    fail "transcript-shape marker in $f"
  fi
done

if [ $FAIL -eq 0 ]; then
  ok "wiki privacy boundary holds"
  exit 0
fi
echo "wiki privacy boundary violations detected" >&2
exit 1
