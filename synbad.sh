#!/bin/bash
set -eo pipefail

npx tsc
node ./dist/source/index.js "$@"
