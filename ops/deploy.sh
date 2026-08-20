#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
project_dir="$(dirname -- "${script_dir}")"
cd "${project_dir}"

if [ ! -f .env ]; then
  echo "Missing ${project_dir}/.env" >&2
  exit 1
fi

docker compose -f compose.yml -f compose.prod.yml config >/dev/null
docker compose -f compose.yml -f compose.prod.yml pull
docker compose -f compose.yml -f compose.prod.yml up -d --remove-orphans

attempt=1
while [ "${attempt}" -le 36 ]; do
  if curl --fail --silent --show-error --max-time 5 https://kkb-app.space/health >/dev/null; then
    docker compose -f compose.yml -f compose.prod.yml ps
    echo "KKB is healthy at https://kkb-app.space"
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 5
done

docker compose -f compose.yml -f compose.prod.yml ps
docker compose -f compose.yml -f compose.prod.yml logs --tail=100 backend web
echo "Deployment did not become healthy within three minutes" >&2
exit 1
