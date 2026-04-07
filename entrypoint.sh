#!/bin/sh
if [ $# -eq 0 ]; then
  exec bun run src/main.ts start
else
  exec bun run src/main.ts "$@"
fi