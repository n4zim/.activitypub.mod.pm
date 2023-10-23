import { readdir } from "node:fs/promises"
import { discoverInstance } from "./api"
import { DIR, EXT } from "./values"

const instances = await Bun.file(DIR + EXT).json<string[]>()
const dir = await readdir(DIR)

const missing: { index: string[], file: string[] } = { index: [], file: [] }

for(const instance of instances) await checkJSON(instance)
for(const file of dir) checkJSONIndex(file)

for(const instance of missing.index) {
  console.log(`Missing ${EXT} index for ${instance}`)
  instances.push(instance)
}

if(missing.index.length !== 0) {
  instances.sort()
  await Bun.write(DIR + EXT, JSON.stringify(instances))
}

for(const instance of missing.file) {
  console.log(`Missing ${instance}${EXT} file, attempting to discover...`)
  await discoverInstance(instance)
}

async function checkJSON(instance: string) {
  if(!dir.includes(instance + EXT)) {
    if(!missing.file.includes(instance)) missing.file.push(instance)
  } else {
    const file = await Bun.file(DIR + instance + EXT).json()
    if(file?.links) {
      for(const link of file.links) {
        if(!instances.includes(link) && !missing.index.includes(link)) {
          missing.index.push(link)
        }
        if(!dir.includes(link + EXT) && !missing.file.includes(link)) {
          missing.file.push(link)
        }
      }
    }
  }
}

function checkJSONIndex(file: string) {
  const instance = file.slice(0, -EXT.length)
  if(instance === "") return
  if(!instances.includes(instance) && !missing.index.includes(instance)) {
    missing.index.push(instance)
  }
}
