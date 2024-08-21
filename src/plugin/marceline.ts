import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import send from '@fastify/send'
import { FlatDB } from './flatdb'
import { Endpoint, Form, View } from './types'
import { Prisma, PrismaClient } from '@prisma/client'

type Options = {
  root?: string,
  prisma: PrismaClient
}

type HookType = "onRequest" | "bodyModifier" | "postEffect"
type Hook = (req: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply | void> | FastifyReply | void
type TableName = Exclude<keyof PrismaClient, `$${string}`>

type AddHookSettings = { table?: TableName | TableName[] }

const marcelinePlugin = async (fastify: FastifyInstance, options: Options) => {
  
  const hooks: Record<HookType, Map<string, { hook: Hook, options: AddHookSettings }>> = 
    { onRequest: new Map(), bodyModifier: new Map(), postEffect: new Map() }
    
  const views = new FlatDB<View>({ path: process.cwd() + "/marceline/views" })
  await views.init()

  const forms = new FlatDB<Form>({ path: process.cwd() + "/marceline/forms" })
  await forms.init()
  
  const endpoints = new FlatDB<Endpoint>({ path: process.cwd() + "/marceline/endpoints" })
  await endpoints.init()

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
    fastify.register(route, { prefix: "/api/admin" })
  }  
  
  const registerHook = (name: string, type: HookType, hook: Hook, options: AddHookSettings = {}) => {
    if (hooks[type].has(name)) {
      return console.warn(`Hook ${name} already registered. Pick another name`)
    }
    hooks[type].set(name, { hook, options })
  }

  const getHooks = () => {
    const arr = []
    for (let [ type, map ] of Object.entries(hooks)) {
      for (let [ name, value ] of map) {
        arr.push({ type, name, options: value.options })
      }
    }
    return arr
  }

  return {
    views,
    forms,
    endpoints,
    registerHook,
    getHooks
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
