#!/bin/bash
set -eo pipefail

rm -rf dist
npx tsc
# Copy eval assets (e.g. images) into dist alongside the compiled evals
cp evals/image/*.png dist/evals/image/
node ./dist/source/index.js "$@"
