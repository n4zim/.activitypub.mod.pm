import { exists, readFile, readInstances } from "./helpers.ts"

const instances = await readInstances()

let open = 0, links = 0, posts = 0, users = 0
let softwares: { [key: string]: number } = {}
let usersByInstance: { [instance: string]: number } = {}
let postsByInstance: { [instance: string]: number } = {}

const isOpen: string[] = []

for(const instance of instances) {
  if(!await exists(instance)) continue
  const file = await readFile(instance)
  if(file.total?.users) {
    const value = Number(file.total.users)
    usersByInstance[instance] = value
    users += value
  }
  if(file.total?.posts) {
    const value = Number(file.total.posts)
    postsByInstance[instance] = value
    posts += value
  }
  if(file.open) {
    open += 1
    isOpen.push(instance)
  }
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

for(const instance in usersByInstance) {
  const ratio = Math.round(usersByInstance[instance] / users * 100)
  if(ratio < 1) delete usersByInstance[instance]
}
usersByInstance = Object.fromEntries(Object.entries(usersByInstance).sort(([,a],[,b]) => b-a))

for(const instance in postsByInstance) {
  const ratio = Math.round(postsByInstance[instance] / posts * 100)
  if(ratio < 1) delete postsByInstance[instance]
}
postsByInstance = Object.fromEntries(Object.entries(postsByInstance).sort(([,a],[,b]) => b-a))

let file = `
# ActivityPub data (activitypub.mod.pm/n4zim)

## Latest stats

### Global data
- **${instances.length}** total instances
- **${users}** total users
- **${posts}** total posts
- **${(open / instances.length * 100).toFixed(2)}%** of instances are open
- **${links}** in average per instance links with other instances

### Total users (for instances with more than 1% of total users)
| Instance | Users | Posts | Open |
| -------- | ----- | ----- | ---- |
${Object.entries(usersByInstance).map(([instance, users]) => `| ${instance} | **${users}** | ${postsByInstance[instance] || "?"} | ${isOpen.includes(instance) ? "✅" : "❌"} |`).join("\n")}

### Total posts (for instances with more than 1% of total posts)
| Instance | Posts | Users | Open |
| -------- | ----- | ----- | ---- |
${Object.entries(postsByInstance).map(([instance, posts]) => `| ${instance} | ${posts} | ${usersByInstance[instance] || "?"} | ${isOpen.includes(instance) ? "✅" : "❌"} |`).join("\n")}

### Softwares used
| Software | Instances |
| -------- | --------- |
${Object.entries(softwares).map(([name, instances]) => `| ${name} | ${instances} |`).join("\n")}
`

await Deno.writeTextFile("../README.md", file)
