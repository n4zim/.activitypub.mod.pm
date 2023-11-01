import { discoverInstance, readInstances, writeInstances } from "./helpers.ts"

const instances = await readInstances()

const servers = await fetch("https://api.joinmastodon.org/servers")
for(const server of await servers.json()) {
  if(!instances.includes(server.domain)) {
    instances.push(server.domain)
    console.log(`ADDED ${server.domain}`)
  }
}

/*for(const instance of instances) {
  console.log(`Fetching ${instance}...`)
  await discoverInstance(instance)
}*/

await Promise.all(instances.map(async instance => {
  console.log(`Fetching ${instance}...`)
  await discoverInstance(instance)
}))

await writeInstances(instances)
