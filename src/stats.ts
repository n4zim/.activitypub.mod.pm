import { exists, readFile, readInstances } from "./helpers.ts"

const instances = await readInstances()

let open = 0, links = 0
let softwares: { [key: string]: number } = {}
let users: { [instance: string]: number } = {}

for(const instance of instances) {
  if(!await exists(instance)) continue
  const file = await readFile(instance)
  if(file.total.users) users[instance] = file.total.users
  if(file.open) open += 1
  if(file.links) links += file.links.length
  if(file.software.name) {
    if(!softwares[file.software.name]) softwares[file.software.name] = 0
    softwares[file.software.name] += 1
  }
}

for(const software in softwares) {
  const ratio = Math.round(softwares[software] / instances.length * 100)
  if(ratio < 1) delete softwares[software]
}
softwares = Object.fromEntries(Object.entries(softwares).sort(([,a],[,b]) => b-a))

const totalUsers = Object.values(users).reduce((a, b) => a + b, 0)

for(const instance in users) {
  const ratio = Math.round(users[instance] / totalUsers * 100)
  if(ratio < 1) delete users[instance]
}
users = Object.fromEntries(Object.entries(users).sort(([,a],[,b]) => b-a))

console.log("#", instances.length, "instances")
console.log("#", totalUsers, "users")
console.log("#", (open / instances.length * 100).toFixed(2), "% open")
console.log("#", (links / instances.length).toFixed(2), "links per instance")
console.log("\n#", "softwares:", JSON.stringify(softwares))
console.log("\n#", "users:", JSON.stringify(users))
