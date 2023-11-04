import { discoverInstance, readInstances, writeInstances } from "./helpers.ts"

const instances = await readInstances()

const servers = await Deno.readTextFile("import.txt")

for(const server of servers.split("\n")) {
  if(instances.includes(server)) continue
  discoverInstance(server)
}

await writeInstances(instances)
