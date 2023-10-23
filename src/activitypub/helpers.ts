import { DIR, EXT, TIMEOUT } from "./values.ts"

export async function readInstances(): Promise<string[]> {
  return JSON.parse(await Deno.readTextFile(DIR + EXT))
}

export async function writeInstances(instances: string[]) {
  instances.sort()
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
  const node = await nodeInfo(instance)
  if(node) {
    let file = {}
    if(await exists(instance)) file = await readFile(instance)
    await writeFile(instance, { ...file, ...node, ...additional })
  }
}

async function nodeInfo(manifestDomain: string) {
  const url = `https://${manifestDomain}/.well-known/nodeinfo`
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), TIMEOUT)
    const nodeManifestData = await fetch(url, { signal: controller.signal })
    const nodeManifestInfo = await nodeManifestData.json()
    if(!nodeManifestInfo.links) return
    //console.log(`Found ${nodeManifestInfo?.links?.length} links for ${manifestDomain}`)
    const nodePath = nodeManifestInfo.links[0].href
    const nodeData = await fetch(nodePath, { signal: controller.signal })
    clearTimeout(id)
    const nodeInfo = await nodeData.json()
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
    }
  } catch(_) {
    console.error("[DISCOVER ERROR]", url)
  }
}

export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path)
    return true
  } catch(error) {
    if(error instanceof Deno.errors.NotFound) {
      return false
    }
    throw error
  }
}
