#!/bin/sh
set -eu

case "${BACKUP_RETENTION_DAYS:-}" in
  ''|*[!0-9]*) echo "BACKUP_RETENTION_DAYS must be a positive integer" >&2; exit 1 ;;
esac
[ "${BACKUP_RETENTION_DAYS}" -gt 0 ] || { echo "BACKUP_RETENTION_DAYS must be greater than zero" >&2; exit 1; }

case "${BACKUP_INTERVAL_SECONDS:-}" in
  ''|*[!0-9]*) echo "BACKUP_INTERVAL_SECONDS must be a positive integer" >&2; exit 1 ;;
esac
[ "${BACKUP_INTERVAL_SECONDS}" -gt 0 ] || { echo "BACKUP_INTERVAL_SECONDS must be greater than zero" >&2; exit 1; }

mkdir -p /backups

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  partial_path="/backups/kkb-${timestamp}.dump.partial"
  final_path="/backups/kkb-${timestamp}.dump"

  if pg_dump --format=custom --file="${partial_path}"; then
    mv "${partial_path}" "${final_path}"
    touch /backups/last-success
    find /backups -maxdepth 1 -type f -name 'kkb-*.dump' -mtime "+${BACKUP_RETENTION_DAYS}" -delete
  else
    rm -f "${partial_path}"
    echo "Database backup failed at ${timestamp}" >&2
  fi

  sleep "${BACKUP_INTERVAL_SECONDS}"
done
