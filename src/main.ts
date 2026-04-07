#!/usr/bin/env node

import { defineCommand, runMain } from "citty"

import { auth } from "./auth"
import { start } from "./start"

const main = defineCommand({
  meta: {
    name: "copilot-api-docker",
    description: "GitHub Copilot API proxy - Docker optimized",
  },
  subCommands: { auth, start },
})

await runMain(main)
