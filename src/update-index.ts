import { readInstances, writeInstances } from "./helpers.ts"

await writeInstances(await readInstances())
