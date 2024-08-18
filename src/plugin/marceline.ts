import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import send from '@fastify/send'
import { FlatDB } from './flatdb'
import { View } from './types'
import { PrismaClient } from 'prisma/prisma-client'

type Options = {
  root?: string,
  prisma: PrismaClient
}

const marcelinePlugin = async (fastify: FastifyInstance, options: Options) => {

  const views = new FlatDB<View>({ path: process.cwd() + "/marceline/views" })
  await views.init()

  const frontendPath = process.cwd() + "/dist/frontend"
  fastify.get((options.root ?? "/")+"*", async (req, reply) => {

    if (import.meta.env.DEV) {
      return reply.callNotFound()
    }

    const path = req.url.includes(".")? (frontendPath+req.url): frontendPath+ "/index.html"
    const { statusCode, headers, stream, type } = await send(req.raw, path, { index: false })
    
    if (type === "error" || type === "directory") {
      return reply.code(statusCode).send({ error: `Route ${req.method}:${req.url} not found` })
    }

    return reply.code(statusCode).headers(headers).send(stream)
  })

  const routes = import.meta.glob<any>('./routes/**/*.ts', { eager: true })
  for (let route of Object.values(routes)) {
    if (typeof route.default !== "function") continue
    fastify.register(route)
  }  

  return {
    views
  }
}

export default fp(async (fastify, options: Options) => {
  const plugin = await marcelinePlugin(fastify, options)
  fastify.decorate("marceline", plugin)
})

declare module 'fastify' {
  interface FastifyInstance {
    marceline: Awaited<ReturnType<typeof marcelinePlugin>>
  }
}
