import 'dotenv/config'
import fastify, { FastifyServerOptions } from 'fastify'
import marceline from '../plugin/marceline'

const plugins = import.meta.glob<any>('./plugins/**/*.ts', { eager: true })
const routes = import.meta.glob<any>('./routes/**/*.ts', { eager: true })

export const createApp = async (opts?: FastifyServerOptions) => {

  const app = fastify(opts)
  for (let plugin of Object.values(plugins)) {
    if (typeof plugin.default !== "function") continue
    await app.register(plugin)
  }

  app.register(marceline, { 
    root: "/",
    prisma: app.prisma
  })

  const routePrefix = "/api"
  for (let [ key, route ] of Object.entries(routes)) {
    if (typeof route.default !== "function") continue
    const path = key.slice("./routes/".length).split("/")
    const prefix = route.prefix ?? [ routePrefix, ...path.slice(0, -1) ].join("/")
    app.register(route, { prefix })
  }

  return app
}