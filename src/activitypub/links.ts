import { discoverInstance } from "./api"
import { DIR, EXT } from "./values"

const NOW = new Date()

for(const domain of await readInstances()) {
  await scanInstance(domain)
}

async function scanInstance(instance: string) {
  const filePath = DIR + instance + EXT
  const file = Bun.file(filePath)
  if(!await file.exists()) return
  let fileJson = await file.json()

  const links: string[] = fileJson.links || []
  let linksUpdated = false

  let statuses = await fetchStatuses(instance)
  if(statuses.length === 0) return

  let page = 1
  while(true) {
    let skip = false
    for(const status of statuses) {
      if(
        status.date.getFullYear() === NOW.getFullYear()
        && status.date.getMonth() === NOW.getMonth()
        && status.date.getDate() === NOW.getDate()
      ) {
        if(!links.includes(status.hostname) && status.hostname !== instance) {
          links.push(status.hostname)
          linksUpdated = true
        }
      } else {
        skip = true
        break
      }
    }
    if(skip) break
    statuses = await fetchStatuses(instance, statuses.length, ++page)
    if(statuses.length === 0) break
  }

  if(links.length === 0) return

  if(linksUpdated) {
    await discoverInstance(instance, { links })
  }

  const instances = await readInstances()
  let instancesUpdated = false
  for(const link of links) {
    if(!instances.includes(link)) {
      instances.push(link)
      instancesUpdated = true
    }
  }
  if(instancesUpdated) {
    instances.sort()
    await Bun.write(DIR + EXT, JSON.stringify(instances))
  }
}

function readInstances() {
  return Bun.file(DIR + EXT).json<string[]>()
}

async function fetchStatuses(domain: string, offset: number = 0, page: number = 1) {
  const url = `https://${domain}/api/v1/trends/statuses${offset ? `?offset=${offset * page}` : ""}`
  console.log(`Fetching ${url}...`)
  try {
    const response = await fetch(url)
    const json = await response.json()
    return json.map((status: any) => ({
      date: new Date(status.created_at),
      hostname: new URL(status.url).hostname,
    }))
  } catch(e) {
    console.error(e)
    return []
  }
}
