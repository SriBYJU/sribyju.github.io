#!/usr/bin/env bash
set -euo pipefail

SITE="${SCHOLARK_PRODUCTION_URL:-https://sribyju.github.io/}"
SHA="${GITHUB_SHA:-manual-audit}"
OUT="${SCHOLARK_AUDIT_OUT:-/tmp/scholark-production-audit}"
BUILD='5152'
mkdir -p "$OUT"

wait_for_release() {
  for attempt in $(seq 1 90); do
    local index_html loader v3 v53 v53css v512 health_code reliability_code polish_code robots_code sitemap_code
    index_html="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}?sha=${SHA}" 2>/dev/null || true)"
    loader="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}scholark-feature-loader.js?sha=${SHA}" 2>/dev/null || true)"
    v3="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}scholark-v3.js?sha=${SHA}" 2>/dev/null || true)"
    v53="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}scholark-v53.js?sha=${SHA}" 2>/dev/null || true)"
    v53css="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}scholark-v53.css?sha=${SHA}" 2>/dev/null || true)"
    v512="$(curl --fail --location --silent --show-error --connect-timeout 15 --max-time 30 "${SITE}scholark-v512.css?sha=${SHA}" 2>/dev/null || true)"
    health_code="$(curl --location --silent --output "$OUT/health.js" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}scholark-ai-health.js?sha=${SHA}" || true)"
    reliability_code="$(curl --location --silent --output "$OUT/reliability.js" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}scholark-ai-reliability.js?sha=${SHA}" || true)"
    polish_code="$(curl --location --silent --output "$OUT/ui-polish.js" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}scholark-ai-ui-polish.js?sha=${SHA}" || true)"
    robots_code="$(curl --location --silent --output "$OUT/robots-wait.txt" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}robots.txt?sha=${SHA}" || true)"
    sitemap_code="$(curl --location --silent --output "$OUT/sitemap-wait.xml" --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "${SITE}sitemap.xml?sha=${SHA}" || true)"
    if grep -Fq "scholark-v3.js?build=${BUILD}" <<<"$index_html" \
      && grep -q 'ai-107' <<<"$loader" \
      && grep -q 'scholark-ai-reliability.js' <<<"$loader" \
      && grep -q 'scholark-ai-ui-polish.js' <<<"$loader" \
      && grep -q 'afterCinematicReady' <<<"$loader" \
      && grep -q 'bounded-timeout' <<<"$loader" \
      && grep -q 'aiBootScheduledAt' <<<"$loader" \
      && grep -Fq "const BUILD='${BUILD}';" <<<"$v3" \
      && grep -Fq 'const cloud=' <<<"$v53" \
      && grep -Fq 'cloud(7,' <<<"$v53" \
      && grep -Fq '.sk6-cloud{' <<<"$v53css" \
      && grep -Fq '.sk6-portal-ring{' <<<"$v53css" \
      && ! grep -Fq 'Desktop S-portal cohesion repair' <<<"$v512" \
      && [ "$health_code" = '200' ] \
      && [ "$reliability_code" = '200' ] \
      && [ "$polish_code" = '200' ] \
      && [ "$robots_code" = '200' ] \
      && [ "$sitemap_code" = '200' ] \
      && cmp -s robots.txt "$OUT/robots-wait.txt" \
      && cmp -s sitemap.xml "$OUT/sitemap-wait.xml"; then
      printf '%s\n' "$index_html" > "$OUT/live-index-wait.html"
      printf '%s\n' "$loader" > "$OUT/loader.js"
      printf '%s\n' "$v3" > "$OUT/v3-wait.js"
      printf '%s\n' "$v53" > "$OUT/v53-wait.js"
      printf '%s\n' "$v53css" > "$OUT/v53-wait.css"
      printf '%s\n' "$v512" > "$OUT/v512-wait.css"
      echo "Production cinematic build ${BUILD} fully rolled out on attempt ${attempt}." | tee "$OUT/deployment.txt"
      return 0
    fi
    sleep 10
  done
  echo "GitHub Pages did not expose the complete cinematic build ${BUILD} within the audit window." >&2
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
  scholark-v53.js \
  scholark-v53.css \
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
grep -Fq "scholark-v3.js?build=${BUILD}" "$OUT/live-index.html"
grep -q 'scholark-ai-practice.js' "$OUT/loader.js"
grep -q 'scholark-ai-health.js' "$OUT/loader.js"
grep -q 'scholark-ai-reliability.js' "$OUT/loader.js"
grep -q 'scholark-ai-ui-polish.js' "$OUT/loader.js"
grep -q 'afterCinematicReady' "$OUT/loader.js"
grep -q 'bounded-timeout' "$OUT/loader.js"
grep -q 'aiBootScheduledAt' "$OUT/loader.js"
grep -Fq "const BUILD='${BUILD}';" "$OUT/scholark-v3.js"

# The rich desktop cinematic must match the original V5.3/V5.12 contract.
grep -Fq 'const cloud=' "$OUT/scholark-v53.js"
grep -Fq 'cloud(7,' "$OUT/scholark-v53.js"
grep -Fq 'Array.from({length:10}' "$OUT/scholark-v53.js"
grep -Fq 'sk6-ring-d' "$OUT/scholark-v53.js"
grep -Fq '.sk6-cloud{' "$OUT/scholark-v53.css"
grep -Fq '.sk6-portal-ring{' "$OUT/scholark-v53.css"
grep -Fq '.sk6-wave-scene' "$OUT/scholark-v53.css"
grep -Fq '.sk6-orbit-scene' "$OUT/scholark-v53.css"
if grep -Fq 'Desktop S-portal cohesion repair' "$OUT/scholark-v512.css"; then
  echo 'The simplified desktop S override is still present in production.' >&2
  exit 1
fi

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
echo "cinematic_build ${BUILD}" | tee -a "$OUT/http-report.txt"
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
echo 'Production HTTP/network/SEO/reliability/full-cinematic audit passed.' | tee -a "$OUT/http-report.txt"
