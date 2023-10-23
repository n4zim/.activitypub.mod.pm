import { discoverInstance, readDir, readFile, readInstances, writeInstances } from "./helpers.ts"
import { EXT } from "./values.ts"

const instances = await readInstances()
const dir = await readDir()

const missing: { index: string[], file: string[] } = { index: [], file: [] }

for(const instance of instances) {
  if(!dir.includes(instance)) {
    if(!missing.file.includes(instance)) missing.file.push(instance)
  } else {
    const file = await readFile(instance)
    if(file?.links) {
      for(const link of file.links) {
        if(!instances.includes(link) && !missing.index.includes(link)) {
          missing.index.push(link)
        }
        if(!dir.includes(link) && !missing.file.includes(link)) {
          missing.file.push(link)
        }
      }
    }
  }
}

for(const file of dir) {
  if(!instances.includes(file) && !missing.index.includes(file)) {
    missing.index.push(file)
  }
}

for(const instance of missing.index) {
  console.log(`Missing ${EXT} index for ${instance}`)
  instances.push(instance)
}

if(missing.index.length !== 0) await writeInstances(instances)

for(const instance of missing.file) {
  console.log(`Missing ${instance}${EXT} file, attempting to discover...`)
  await discoverInstance(instance)
}
