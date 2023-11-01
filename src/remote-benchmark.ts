import { EXT } from "./values.ts"

const files = await getFile("") as string[]

let now = Date.now()
await Promise.all(files.map(async (file, i) => {
  await getFile(file)
  //console.log("#", i + "/" + files.length, totalTime(now))
}))
console.log("#", files.length, "files in", totalTime(now), "seconds without LFS")

now = Date.now()
await Promise.all(files.map(file => getFile(file)))
console.log("#", files.length, "files in", totalTime(now), "seconds with LFS")

function totalTime(start: number) {
  return (Date.now() - start) / 1000
}

async function getFile(name: string/*, lfs = false*/) {
  const url = /*lfs
    ? ("https://media.githubusercontent.com/media/n4zim/.mod.pm/lfs/data/activitypub/" + name + EXT + "?download=")
    : (*/"https://raw.githubusercontent.com/n4zim/.activitypub.mod.pm/main/data/" + name + EXT/*)*/
  //console.log("#", url)
  const response = await fetch(url)
  if(!response.ok) return
  return response.json()
}
