# Catalog Deletion / Archival Pre-Flight Checklist

Complete and commit this file BEFORE executing any archival or deletion script.
No script that writes status=ARCHIVED or deletes Tour rows may run without this signed off.

---

## 1. Environment Confirmation

- [ ] I have confirmed that DATABASE_URL in `.env.local` points to: ________________
- [ ] I can confirm this is NOT the live production database / this IS an isolated copy: YES / NO
- [ ] If using production: I have taken a fresh backup within the last 24 hours (see step 3).

## 2. Scope Confirmation

- [ ] I have run `node scripts/audit_and_preview_legacy_tours.cjs` and reviewed the report.
- [ ] Report location: `docs/engineering/LEGACY_CATALOG_AUDIT_REPORT.json`
- [ ] Count of tours to be archived (status -> ARCHIVED): ____
- [ ] Count of tours to remain untouched (have bookings): ____
- [ ] I confirm ZERO tours with active Booking records are in the archival list.

## 3. Backup Confirmation

- [ ] I have run `node scripts/backup_db.js` immediately before executing the archival script.
- [ ] Backup file saved at: `scripts/backups/db_backup_pre_archival_<timestamp>.json`
- [ ] File size is non-zero and appears reasonable: YES / NO
- [ ] I have verified the backup is readable by running:
      `node -e "require('fs').statSync('scripts/backups/<file>'); console.log('OK')"`

## 4. Restore Procedure Confirmed

- [ ] `scripts/restore_tours_from_backup.js --file <backup> --dry-run` completed without errors.
- [ ] I understand that restoring requires pointing DATABASE_URL at an isolated test environment first.
- [ ] Restore dry-run output: (paste or attach)

## 5. Replacement Workflow Readiness

- [ ] The new tour authoring workflow (28-section importer + media library) is functional.
- [ ] At least one replacement tour has been created and verified in the admin panel.
- [ ] Admin team has been notified of the archival window.

## 6. Sign-Off

Completed by: ________________  Date: ________________

> After completing all checkboxes, commit this file with a message like:
> `fix: complete deletion checklist before catalog archival <date>`
