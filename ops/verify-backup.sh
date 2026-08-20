#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /absolute/path/to/kkb-backup.dump" >&2
  exit 1
fi

backup_path="$1"
case "${backup_path}" in
  /*) ;;
  *) echo "Backup path must be absolute" >&2; exit 1 ;;
esac

if [ ! -f "${backup_path}" ] || [ -L "${backup_path}" ]; then
  echo "Backup must be a regular file, not a symbolic link" >&2
  exit 1
fi

case "${backup_path}" in
  *.dump) ;;
  *) echo "Backup file must end in .dump" >&2; exit 1 ;;
esac

container_name="kkb-backup-verify-$$"
cleanup() {
  docker stop "${container_name}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --detach --rm \
  --name "${container_name}" \
  --tmpfs /var/lib/postgresql/data \
  --env POSTGRES_PASSWORD=kkb-backup-verification \
  --volume "${backup_path}:/backup.dump:ro" \
  postgres:17-alpine >/dev/null

attempt=1
while [ "${attempt}" -le 30 ]; do
  if docker exec "${container_name}" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

if [ "${attempt}" -gt 30 ]; then
  echo "Temporary PostgreSQL did not become ready" >&2
  exit 1
fi

docker exec "${container_name}" createdb -U postgres kkb_verify
docker exec "${container_name}" pg_restore -U postgres --dbname=kkb_verify --no-owner --no-acl /backup.dump
migration_count="$(docker exec "${container_name}" psql -U postgres -d kkb_verify -v ON_ERROR_STOP=1 -Atc \
  "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '2' AND success")"
if [ "${migration_count}" -ne 1 ]; then
  echo "Backup does not contain the current Flyway V2 schema" >&2
  exit 1
fi

echo "Backup restored successfully in an isolated temporary database"
