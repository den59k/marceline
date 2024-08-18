import fs from 'fs'
import { join } from 'path'

type Options = {
  path: string
}

export class FlatDB <T extends { id: string }> {

  path: string
  items = new Map<string, T>()

  constructor(options: Options) {
    this.path = options.path
  }

  async init() {
    if (!fs.existsSync(this.path)) {
      await fs.promises.mkdir(this.path, { recursive: true })
      return
    }
    const files = await fs.promises.readdir(this.path)
    for (let file of files) {
      if (!file.endsWith(".json")) continue
      try {
        const data = JSON.parse(await fs.promises.readFile(join(this.path, file), "utf-8"))
        this.items.set(data.id, data)
      } catch(e) {
        console.warn(`Unable to parse file /${file}`)
      }
    }
  }

  createItem(item: T) {
    this.items.set(item.id, item)
    this.saveItem(item)
    return item
  }

  saveItem(item: T) {
    fs.writeFileSync(join(this.path, `${item.id}.json`), JSON.stringify(item, null, 2))
  }

  getItems() {
    return Array.from(this.items.values())
  }

  getItem(id: string) {
    return this.items.get(id)
  }

  hasItem(id: string) {
    return this.items.has(id)
  }

  findByKey<K extends keyof T>(key: K, value: T[K]) {
    for (let item of this.items.values()) {
      if (item[key] === value) return item
    }
  }

  delete(itemId: string) {
    this.items.delete(itemId)
    if (fs.existsSync(join(this.path, `${itemId}.json`))) {
      fs.unlinkSync(join(this.path, `${itemId}.json`))
    }
  }
}