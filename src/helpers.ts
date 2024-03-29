import { SKIP_LIST } from "./skip.ts"
import { CONCURRENCY, DIR, EXT, TIMEOUT } from "./values.ts"

export async function readInstances(): Promise<string[]> {
  return JSON.parse(await Deno.readTextFile(DIR + EXT))
}

export async function writeInstances(instances: string[]) {
  const users: { [key: string]: number } = {}
  for(const instance of instances) {
    try {
      const file = await readFile(instance)
      users[instance] = file?.total?.users || 0
    } catch(_error) {
      console.log("Ignored instance update for", instance)
      //console.error("[WRITE INSTANCES ERROR]", error)
      users[instance] = 0
    }
  }
  instances.sort((a, b) => users[b] - users[a])
  await Deno.writeTextFile(DIR + EXT, JSON.stringify(instances))
}

export async function readDir(): Promise<string[]> {
  const files = []
  for await (const file of Deno.readDir(DIR)) {
    const name = file.name.slice(0, -EXT.length)
    if(name === "") continue
    files.push(name)
  }
  return files
}

export async function readFile(instance: string): Promise<any> {
  return JSON.parse(await Deno.readTextFile(DIR + instance + EXT))
}

export async function writeFile(instance: string, data: any) {
  await Deno.writeTextFile(DIR + instance + EXT, JSON.stringify(data))
}

export async function discoverInstance(instance: string, additional: any = {}) {
  if(SKIP_LIST.includes(instance)) return
  const node = await nodeInfo(instance)
  if(node) {
    let file = {}
    if(await exists(instance)) file = await readFile(instance)
    await writeFile(instance, { ...file, ...node, ...additional })
  }
}

async function nodeInfo(manifestDomain: string) {
  const url = `https://${manifestDomain}/.well-known/nodeinfo`
  let aborted = false
  try {
    const controller = new AbortController()
    const id = setTimeout(() => {
      aborted = true
      controller.abort()
    }, TIMEOUT)
    const nodeManifestData = await fetch(url, { signal: controller.signal })
    const nodeManifestInfo = await nodeManifestData.json()
    if(!nodeManifestInfo.links) return
    //console.log(`Found ${nodeManifestInfo?.links?.length} links for ${manifestDomain}`)
    const nodePath = nodeManifestInfo.links[0].href
    const nodeData = await fetch(nodePath, { signal: controller.signal })
    const nodeInfo = await nodeData.json()

    let mastodonInfo
    if(nodeInfo?.software?.name === "mastodon") {
      const mastodonData = await fetch("https://" + manifestDomain + "/api/v2/instance", {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      })
      mastodonInfo = await mastodonData.json()
    }
    clearTimeout(id)

    return {
      open: nodeInfo?.openRegistrations,
      total: {
        users: nodeInfo?.usage?.users?.total,
        posts: nodeInfo?.usage?.localPosts,
      },
      hostname: new URL(nodePath).hostname,
      software: {
        name: nodeInfo?.software?.name,
        version: nodeInfo?.software?.version,
      },
      name: mastodonInfo?.title || nodeInfo?.metadata?.nodeName,
      description: mastodonInfo?.description || nodeInfo?.metadata?.description,
      languages: mastodonInfo?.languages || nodeInfo?.metadata?.languages,
    }
  } catch(_error) {
    if(aborted) {
      console.log("/!\\ Aborted instance discovery for", url)
    } else {
      console.error("Error discovering", url)
      appendFailedDiscovery(manifestDomain)
    }
  }
}

export async function exists(instance: string): Promise<boolean> {
  try {
    await Deno.stat(DIR + instance + EXT)
    return true
  } catch(error) {
    if(error instanceof Deno.errors.NotFound) {
      return false
    }
    throw error
  }
}

export async function chunkPromises(promises: (() => Promise<void>)[]) {
  for(let i = 0; i < promises.length; i += CONCURRENCY) {
    console.log(`Executing ${i + 1}-${i + CONCURRENCY + 1} of ${promises.length} promises...`)
    await Promise.all(promises.slice(i, i + CONCURRENCY).map(promise => promise()))
  }
}

function appendFailedDiscovery(instance: string) {
  let fails = JSON.parse(Deno.readTextFileSync("fails.json"))
  if(typeof fails[instance] === "undefined") {
    fails = Object.keys(fails).sort().reduce((obj, key) => {
      obj[key] = instance === key ? 0 : fails[key]
      return obj
    }, {})
  }
  fails[instance]++
  Deno.writeTextFileSync("fails.json", JSON.stringify(fails))
}
