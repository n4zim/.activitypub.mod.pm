import { chunkPromises, discoverInstance, readInstances, writeInstances } from "./helpers.ts"

const instances = await readInstances()

const servers = await fetch("https://api.joinmastodon.org/servers")
for(const server of await servers.json()) {
  if(!instances.includes(server.domain)) {
    instances.push(server.domain)
    console.log(`ADDED ${server.domain}`)
  }
}

await chunkPromises(instances.map(instance => () => {
  //console.log(`Fetching ${instance}...`)
  return discoverInstance(instance)
}))

await writeInstances(instances)
