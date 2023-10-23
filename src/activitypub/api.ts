import { DIR, EXT } from "./values"

export async function discoverInstance(instance: string, additional: any = {}) {
  const node = await nodeInfo(instance)
  if(node) {
    const nodeFile = Bun.file(DIR + instance + EXT)
    const file = (await nodeFile.exists()) ? (await nodeFile.json()) : {}
    Bun.write(DIR + instance + EXT, JSON.stringify({ ...file, ...node, ...additional }))
  }
}

async function nodeInfo(manifestDomain: string) {
  try {
    const nodeManifestData = await fetch(`https://${manifestDomain}/.well-known/nodeinfo`, {
      timeout: true,
    })
    const nodeManifestInfo = await nodeManifestData.json()
    if(!nodeManifestInfo.links) return
    const nodePath = nodeManifestInfo.links[0].href
    const nodeData = await fetch(nodePath)
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
  } catch (e) {
    console.error("[DISCOVER ERROR]", e)
  }
}
