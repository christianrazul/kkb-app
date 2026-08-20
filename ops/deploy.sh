#!/bin/sh
set -eu

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
project_dir="$(dirname -- "${script_dir}")"
cd "${project_dir}"

if [ ! -f .env ]; then
  echo "Missing ${project_dir}/.env" >&2
  exit 1
fi

set -- -f compose.yml -f compose.prod.yml
if [ -n "${SHARED_PROXY_NETWORK:-}" ] || awk -F= '$1 == "SHARED_PROXY_NETWORK" && length($2) > 0 { found=1 } END { exit !found }' .env; then
  set -- "$@" -f compose.shared-proxy.yml
fi

docker compose "$@" config >/dev/null
docker compose "$@" pull
docker compose "$@" up -d --remove-orphans

attempt=1
while [ "${attempt}" -le 36 ]; do
  if curl --fail --silent --show-error --max-time 5 https://kkb-app.space/health >/dev/null; then
    docker compose "$@" ps
    echo "KKB is healthy at https://kkb-app.space"
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 5
done

docker compose "$@" ps
docker compose "$@" logs --tail=100 backend web
echo "Deployment did not become healthy within three minutes" >&2
exit 1
