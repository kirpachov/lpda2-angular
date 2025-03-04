#!/bin/bash

# Script should be run from the root of the project.

echo "Will use the following configs:"
cat src/assets/config/config.prod.json

scripts/build.sh && scripts/push.sh