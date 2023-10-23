
const DIR = "../../data/activitypub/"
const EXT = ".json"

const instances = await Bun.file(DIR + EXT).json<string[]>()

const servers = await fetch("https://api.joinmastodon.org/servers")
for(const server of await servers.json()) {
  if(!instances.includes(server.domain)) {
    instances.push(server.domain)
    console.log(`ADDED ${server.domain}`)
  }
}

instances.sort()

for(const domain of instances) {
  console.log(`Fetching ${domain}...`)
  const node = await nodeInfo(domain)
  if(node) {
    Bun.write(DIR + domain + EXT, JSON.stringify(node))
  }
}

Bun.write(DIR + EXT, JSON.stringify(instances))

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
