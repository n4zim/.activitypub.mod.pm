import { exists, readFile, readInstances } from "./helpers.ts"

const instances = await readInstances()

let open = 0, links = 0, posts = 0, users = 0
let softwares: { [key: string]: number } = {}
let usersByInstance: { [instance: string]: number } = {}
let postsByInstance: { [instance: string]: number } = {}

const usersBySoftware: { [software: string]: number } = {}
const descriptions: { [instance: string]: string } = {}
const languages: { [instance: string]: string[] } = {}
const isOpen: string[] = []

for(const instance of instances) {
  if(!await exists(instance)) continue
  const file = await readFile(instance)
  if(file.total?.users) {
    const value = Number(file.total.users)
    usersByInstance[instance] = value
    if(value > 0) users += value
  }
  if(file.total?.posts) {
    const value = Number(file.total.posts)
    postsByInstance[instance] = value
    if(value > 0) posts += value
  }
  if(file.open) {
    open += 1
    isOpen.push(instance)
  }
  if(file.links) links += file.links.length
  if(file.software.name) {
    if(!softwares[file.software.name]) softwares[file.software.name] = 0
    softwares[file.software.name] += 1
    if(file.total?.users) {
      if(!usersBySoftware[file.software.name]) usersBySoftware[file.software.name] = 0
      usersBySoftware[file.software.name] += Number(file.total.users)
    }
  }
  if(file.description) descriptions[instance] = file.description
  if(file.languages) languages[instance] = file.languages
}

/*for(const software in softwares) {
  const ratio = Math.round(softwares[software] / instances.length * 100)
  if(ratio < 1) delete softwares[software]
}*/
softwares = Object.fromEntries(Object.entries(softwares).sort(([,a],[,b]) => (usersBySoftware[b] || 0) - (usersBySoftware[a] || 0)))

/*for(const instance in usersByInstance) {
  const ratio = Math.round(usersByInstance[instance] / users * 100)
  if(ratio < 1) delete usersByInstance[instance]
}*/
usersByInstance = Object.fromEntries(Object.entries(usersByInstance).sort(([,a],[,b]) => b-a))

/*for(const instance in postsByInstance) {
  const ratio = Math.round(postsByInstance[instance] / posts * 100)
  if(ratio < 1) delete postsByInstance[instance]
}*/
postsByInstance = Object.fromEntries(Object.entries(postsByInstance).sort(([,a],[,b]) => b-a))

function formatNumber(number: number | string): string {
  if(typeof number === "string") return number
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

function formatLink(link: string): string {
  return `[${link}](https://${link})`
}

function formatDescription(description: string): string {
  if(!description) return "?"
  return description.replace(/(\r\n|\n|\r)/gm, " ")
}

let file = `
# ActivityPub data (activitypub.mod.pm/n4zim)

## Summary
- [Latest stats](#latest-stats)
  - [Global data](#global-data)
  - [Softwares used](#softwares-used)
  - [Total users](#total-users)

## Latest stats

### Global data
- **${formatNumber(instances.length)}** total instances
- **${formatNumber(users)}** total users
- **${formatNumber(posts)}** total posts
- **${(open / instances.length * 100).toFixed(2)}%** instances are open
- **${formatNumber((links / instances.length).toFixed(2))}** average links with other instances

### Softwares used
| Software | Users | Instances |
| -------- | ----- | --------- |
${Object.entries(softwares).map(([name, instances]) => `| ${name} | **${formatNumber(usersBySoftware[name] || "?")}** | ${formatNumber(instances)} |`).join("\n")}

### Total users
| Instance | Users | Posts | Open | Description | Languages |
| -------- | ----- | ----- | ---- | ----------- | --------- |
${Object.entries(usersByInstance).map(([instance, users]) => `| ${formatLink(instance)} | **${formatNumber(users)}** | ${formatNumber(postsByInstance[instance] || "?")} | ${isOpen.includes(instance) ? "✅" : "❌"} | ${formatDescription(descriptions[instance])} | ${languages[instance]?.join(", ") || "?"} |`).join("\n")}

### Total posts
| Instance | Posts | Users | Open | Description | Languages |
| -------- | ----- | ----- | ---- | ----------- | --------- |
${Object.entries(postsByInstance).map(([instance, posts]) => `| ${formatLink(instance)} | **${formatNumber(posts)}** | ${formatNumber(usersByInstance[instance] || "?")} | ${isOpen.includes(instance) ? "✅" : "❌"} | ${formatDescription(descriptions[instance])} | ${languages[instance]?.join(", ") || "?"} |`).join("\n")}
`

await Deno.writeTextFile("../README.md", file)
