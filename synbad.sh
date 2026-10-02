#!/bin/bash
set -eo pipefail

rm -rf dist
npx tsc
node ./dist/source/index.js "$@"
