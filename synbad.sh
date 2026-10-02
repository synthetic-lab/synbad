#!/bin/bash
set -eo pipefail

rm -rf dist
npx tsc
cp -r static dist/static
node ./dist/source/index.js "$@"
