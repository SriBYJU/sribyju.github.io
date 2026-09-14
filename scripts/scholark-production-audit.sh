#!/usr/bin/env bash
set -euo pipefail

SITE="${SCHOLARK_PRODUCTION_URL:-https://sribyju.github.io/}"
SHA="${GITHUB_SHA:-manual-audit}"
OUT="${SCHOLARK_AUDIT_OUT:-/tmp/scholark-production-audit}"
mkdir -p "$OUT"

wait_for_release() {
  for attempt in $(seq 1 90); do
    local loader v3 health_code reliability_code polish_code robots_code sitemap_code
    loader="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}scholark-feature-loader.js?sha=${SHA}" 2>/dev/null || true)"
    v3="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}scholark-v3.js?sha=${SHA}" 2>/dev/null || true)"
    health_code="$(curl --location --silent --output "$OUT/health.js" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}scholark-ai-health.js?sha=${SHA}" || true)"
    reliability_code="$(curl --location --silent --output "$OUT/reliability.js" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}scholark-ai-reliability.js?sha=${SHA}" || true)"
    polish_code="$(curl --location --silent --output "$OUT/ui-polish.js" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}scholark-ai-ui-polish.js?sha=${SHA}" || true)"
    robots_code="$(curl --location --silent --output "$OUT/robots-wait.txt" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}robots.txt?sha=${SHA}" || true)"
    sitemap_code="$(curl --location --silent --output "$OUT/sitemap-wait.xml" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}sitemap.xml?sha=${SHA}" || true)"
    if grep -q 'ai-107' <<<"$loader" \
      && grep -q 'scholark-ai-reliability.js' <<<"$loader" \
      && grep -q 'scholark-ai-ui-polish.js' <<<"$loader" \
      && grep -q 'afterCinematicReady' <<<"$loader" \
      && grep -q 'bounded-timeout' <<<"$loader" \
      && grep -q 'aiBootScheduledAt' <<<"$loader" \
      && grep -Fq "const BUILD='5151';" <<<"$v3" \
      && [ "$health_code" = '200' ] \
      && [ "$reliability_code" = '200' ] \
      && [ "$polish_code" = '200' ] \
      && [ "$robots_code" = '200' ] \
      && [ "$sitemap_code" = '200' ] \
      && cmp -s robots.txt "$OUT/robots-wait.txt" \
      && cmp -s sitemap.xml "$OUT/sitemap-wait.xml"; then
      printf '%s\n' "$loader" > "$OUT/loader.js"
      printf '%s\n' "$v3" > "$OUT/v3-wait.js"
      echo "Production AI/SEO/reliability/cinematic release detected on attempt ${attempt}." | tee "$OUT/deployment.txt"
      return 0
    fi
    sleep 10
  done
  echo 'GitHub Pages did not expose the expected AI/SEO/reliability/cinematic release within the audit window.' >&2
  return 1
}

check_asset() {
  local asset="$1" code target
  target="$OUT/${asset//\//_}"
  code="$(curl --location --silent --output "$target" --write-out '%{http_code}' --connect-timeout 15 --max-time 45 "${SITE}${asset}?sha=${SHA}")"
  echo "${asset} ${code}" | tee -a "$OUT/http-report.txt"
  test "$code" = '200'
}

wait_for_release
: > "$OUT/http-report.txt"

for asset in \
  index.html \
  scholark-v3.js \
  scholark-v512.css \
  scholark-feature-loader.js \
  scholark-ai-algorithms.js \
  scholark-ai-core.js \
  scholark-ai-agents.js \
  scholark-ai-context.js \
  scholark-ai-reliability.js \
  scholark-ai-bridge.js \
  scholark-ai-dashboard.js \
  scholark-ai-ui.js \
  scholark-ai-ui-polish.js \
  scholark-ai-practice.js \
  scholark-ai-practice-ui.js \
  scholark-ai-health.js \
  scholark-ai.css \
  scholark-ai-dashboard.css \
  scholark-ai-practice.css \
  robots.txt \
  sitemap.xml; do
  check_asset "$asset"
done

curl --fail --location --silent --show-error "${SITE}?sha=${SHA}" > "$OUT/live-index.html"
grep -q 'scholark-feature-loader.js' "$OUT/live-index.html"
grep -q 'scholark-v3.js' "$OUT/live-index.html"
grep -q 'scholark-ai-practice.js' "$OUT/loader.js"
grep -q 'scholark-ai-health.js' "$OUT/loader.js"
grep -q 'scholark-ai-reliability.js' "$OUT/loader.js"
grep -q 'scholark-ai-ui-polish.js' "$OUT/loader.js"
grep -q 'afterCinematicReady' "$OUT/loader.js"
grep -q 'bounded-timeout' "$OUT/loader.js"
grep -q 'aiBootScheduledAt' "$OUT/loader.js"
grep -Fq "const BUILD='5151';" "$OUT/scholark-v3.js"
grep -q 'Desktop S-portal cohesion repair' "$OUT/scholark-v512.css"

grep -Fq 'Sitemap: https://sribyju.github.io/sitemap.xml' "$OUT/robots.txt"
grep -Fq '<loc>https://sribyju.github.io/</loc>' "$OUT/sitemap.xml"
cmp -s robots.txt "$OUT/robots.txt"
cmp -s sitemap.xml "$OUT/sitemap.xml"

canonical_count="$(grep -Eic "rel=[\"']canonical[\"']" "$OUT/live-index.html" || true)"
echo "canonical_tags ${canonical_count}" | tee -a "$OUT/http-report.txt"
if [ "$canonical_count" -lt 1 ]; then
  echo 'Canonical link tag missing from production index.' >&2
  exit 1
fi

echo "production_url ${SITE}" | tee -a "$OUT/http-report.txt"
echo "git_sha ${SHA}" | tee -a "$OUT/http-report.txt"

runtime_sources="$(cat "$OUT/scholark-ai-core.js" "$OUT/scholark-ai-reliability.js")"
if grep -Eqi 'api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|api\.together\.xyz|api\.fireworks\.ai|api\.groq\.com|api\.replicate\.com' <<<"$runtime_sources"; then
  echo 'Paid model-provider endpoint detected in production AI runtime.' >&2
  exit 1
fi

grep -q 'Llama-3.2-1B-Instruct-q4f16_1-MLC' "$OUT/scholark-ai-reliability.js"
grep -q "\['standard', 'rescue', 'low'\]" "$OUT/scholark-ai-reliability.js"
grep -q 'last resort' "$OUT/scholark-ai-ui-polish.js"
grep -q 'setTextIfChanged' "$OUT/scholark-ai-ui-polish.js"
grep -q 'schedulePolish' "$OUT/scholark-ai-ui-polish.js"

echo 'Production AI runtime contains no configured paid inference endpoint.' | tee -a "$OUT/http-report.txt"
echo 'Production HTTP/network/SEO/reliability/cinematic audit passed.' | tee -a "$OUT/http-report.txt"
