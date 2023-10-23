import { discoverInstance, exists, readFile, readInstances, writeInstances } from "./helpers.ts"
import { TIMEOUT } from "./values.ts"

const MIN = 200
const NOW = new Date()

for(const domain of await readInstances()) await scanInstance(domain)

async function scanInstance(instance: string) {
  if(!await exists(instance)) return
  const fileJson = await readFile(instance)

  if(MIN && typeof fileJson.links !== "undefined") return
  const links: string[] = fileJson.links || []
  let linksUpdated = false

  let statuses = await fetchStatuses(instance)
  if(statuses.length === 0) return

  let page = 1
  while(true) {
    let skip = false
    for(const status of statuses) {
      if(
        (MIN && page <= MIN) || (!MIN
          && status.date.getFullYear() === NOW.getFullYear()
          && status.date.getMonth() === NOW.getMonth()
          && status.date.getDate() === NOW.getDate()
        )
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

  if(linksUpdated) await discoverInstance(instance, { links })

  const instances = await readInstances()
  let instancesUpdated = false
  for(const link of links) {
    if(!instances.includes(link)) {
      instances.push(link)
      instancesUpdated = true
    }
  }
  if(instancesUpdated) await writeInstances(instances)
}

async function fetchStatuses(domain: string, offset = 0, page = 1) {
  const url = `https://${domain}/api/v1/trends/statuses${offset ? `?offset=${offset * page}` : ""}`
  console.log(`Fetching ${url}...`)
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), TIMEOUT)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    const json = await response.json()
    return json.map((status: any) => ({
      date: new Date(status.created_at),
      hostname: new URL(status.url).hostname,
    }))
  } catch(_) {
    //console.error(e)
    return []
  }
}
