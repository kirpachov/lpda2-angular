#!/bin/bash

# Script should be run from the root of the project.

# echo "Ensure you have extracted the locales with 'ng extract-i18n' and you have the latest version of the locales inside 'locales' folder."

if [[ ! -f src/assets/config/config.prod.json ]]; then
  echo "src/assets/config/config.prod.json does not exist. This file will replace config.json in production, so you'll need it."
  exit 1
fi

rm -rf dist/lpda2/*

ng build --localize -c production && \
  cp -r dist/lpda2/it/* dist/lpda2/ && \
  ./scripts/adjust-configs.sh && \
  echo "Done."