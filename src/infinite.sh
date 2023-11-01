#!/bin/bash

LOOP_NUMBER=1

while true; do
  echo "Loop $LOOP_NUMBER"
  deno run --allow-all repair.ts
  deno run --allow-all links.ts
  LOOP_NUMBER=$((LOOP_NUMBER+1))
done
