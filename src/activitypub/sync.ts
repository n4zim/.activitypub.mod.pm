import { discoverInstance } from "./api"
import { DIR, EXT } from "./values"

const instances = await Bun.file(DIR + EXT).json<string[]>()

const servers = await fetch("https://api.joinmastodon.org/servers")
for(const server of await servers.json()) {
  if(!instances.includes(server.domain)) {
    instances.push(server.domain)
    console.log(`ADDED ${server.domain}`)
  }
}

instances.sort()

for(const instance of instances) {
  console.log(`Fetching ${instance}...`)
  discoverInstance(instance)
}

Bun.write(DIR + EXT, JSON.stringify(instances))
