#!/usr/bin/env bash
set -euo pipefail

# Sync ephemeral_events_web/ to the public repo: ephemeral-social/events
#
# Clones the public repo, syncs files from the monorepo subfolder,
# and pushes an incremental commit (preserving public repo history).
#
# Usage:
#   ./scripts/sync-to-public.sh                  # dry run (default)
#   ./scripts/sync-to-public.sh --push           # actually push
#   ./scripts/sync-to-public.sh --push -m "feat: add ticketing"

PUBLIC_REPO="https://github.com/ephemeral-social/events.git"
BRANCH="main"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"  # ephemeral_events_web/

DRY_RUN=true
COMMIT_MSG="Sync from monorepo"

while [[ $# -gt 0 ]]; do
  case $1 in
    --push) DRY_RUN=false; shift ;;
    --message|-m) COMMIT_MSG="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--push] [--message \"commit message\"]"
      echo "  --push     Actually push (default is dry run)"
      echo "  --message  Custom commit message (default: 'Sync from monorepo')"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Sanity checks
if [[ ! -f "$SOURCE_DIR/package.json" ]]; then
  echo "ERROR: Must run from ephemeral_events_web/ or its scripts/ dir"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "ERROR: Not authenticated with GitHub CLI. Run: gh auth login"
  exit 1
fi

echo "=== Syncing to public repo ==="
echo "Source:  $SOURCE_DIR"
echo "Target:  $PUBLIC_REPO ($BRANCH)"
echo "Mode:    $(if $DRY_RUN; then echo 'DRY RUN'; else echo 'LIVE PUSH'; fi)"
echo ""

# Create temp directory
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# Clone existing public repo to preserve history
echo "Cloning public repo..."
git clone -q --single-branch --branch "$BRANCH" "$PUBLIC_REPO" "$TMPDIR"
cd "$TMPDIR"

# Remove all tracked files (except .git) so we get a clean diff
# This ensures deleted files in the monorepo are also deleted in the public repo
git rm -rq --ignore-unmatch . 2>/dev/null || true
git checkout HEAD -- .git 2>/dev/null || true

# Copy files from monorepo (respecting exclusions)
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.svelte-kit' \
  --exclude='.wrangler' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='!.env.example' \
  --exclude='.dev.vars' \
  --exclude='.DS_Store' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  --exclude='blob-report' \
  --exclude='package-lock.json' \
  --exclude='.output' \
  --exclude='build' \
  --exclude='.interface-design' \
  --exclude='specs/expose' \
  --exclude='CLAUDE.md' \
  --exclude='.claude' \
  "$SOURCE_DIR/" "$TMPDIR/"

# Quick secrets check — abort if any obvious secrets slip through
if grep -rq "sk_live_\|sk_test_\|JWT_SECRET\|TWILIO_AUTH" --include="*.ts" --include="*.svelte" --include="*.toml" --include="*.json" "$TMPDIR/"; then
  echo "ERROR: Potential secrets detected! Aborting."
  echo "Run a manual review before syncing."
  exit 1
fi

# Stage all changes
git add -A

# Check if there are actual changes
if git diff --cached --quiet; then
  echo "No changes to sync. Public repo is already up to date."
  exit 0
fi

# Show summary
CHANGED=$(git diff --cached --stat | tail -1)
echo "Changes: $CHANGED"
echo ""

git commit -q -m "$COMMIT_MSG

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

if $DRY_RUN; then
  echo "DRY RUN complete. Changes above would be pushed."
  echo "Run with --push to actually push to $PUBLIC_REPO"
else
  git push origin "$BRANCH"
  echo "Pushed to $PUBLIC_REPO ($BRANCH)"
fi
