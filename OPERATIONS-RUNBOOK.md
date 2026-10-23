# Tradovia operations runbook

This runbook covers the current Cloudflare production data path: Auth0 session → Worker API → D1 and private R2.

## Production data audit

Run this before releases that change authentication, persistence, imports, images, or billing:

```powershell
npm run ops:audit
```

The audit is read-only. It checks owner-safe relationships, missing profile/subscription rows, and invalid JSON payloads. It prints aggregate counts only and does not print user identifiers or payloads.

## Backup

Create a complete application-level snapshot:

```powershell
npm run ops:backup
```

The command exports the remote `tradovia-db` D1 schema and data separately so foreign-key tables can be recreated before rows are loaded. It then discovers every R2 object referenced by trade-image metadata or a profile avatar, downloads those objects, and hashes all files. A snapshot is usable only when it contains `COMPLETE` and `manifest.json`. Backups are written under `backups/`, which is excluded from Git because snapshots contain private user data.

This application-level backup deliberately excludes inaccessible orphan R2 objects. The API now removes image metadata and objects when a saved trade releases its last reference, and demo reset removes all known objects for that demo owner.

Store completed snapshots in an encrypted location with restricted access. Do not email them or commit them.

## Restore rehearsal

Restore a completed snapshot into an isolated local D1 database and verify checksums plus SQLite integrity:

```powershell
npm run ops:restore-drill -- backups/<timestamp>
```

The rehearsal never targets the remote database or production R2 bucket. It creates a temporary local Wrangler database under `.wrangler/`, checks the restored row counts and `PRAGMA integrity_check`, then removes only that verified temporary directory. R2 files are checksum-verified without uploading them.

## Production restore

Do not restore directly over the active production database. Create replacement D1/R2 resources, restore and verify them, deploy a staging Worker against the replacements, test login and owner isolation, then switch bindings in a controlled maintenance window. Keep the previous resources intact until the new deployment has been verified and rollback time has elapsed.

## Release gate

Before a paid launch:

1. `ops:audit` passes with zero relationship/JSON failures.
2. A fresh `ops:backup` finishes with a `COMPLETE` marker.
3. `ops:restore-drill` passes on that exact snapshot.
4. Authenticated cross-user isolation and private-image tests pass.
5. Monitoring, rate limiting, account export/deletion, and scheduled cleanup of expired sessions and abandoned uploads are enabled.
