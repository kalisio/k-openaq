#!/usr/bin/env bash
set -euo pipefail

# run locations job
krawler ./jobfile.locations.js
# run measurements job
export LOOKBACK_PERIOD="P1D"
krawler ./jobfile.measurements.js
