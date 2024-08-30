import { FastifyInstance, FastifyReply, FastifyRequest, onRequestHookHandler } from 'fastify'
import fp from 'fastify-plugin'
import send from '@fastify/send'
import { FlatDB } from './flatdb'
import { Endpoint, Form, View } from './types'
import { PrismaClient } from '@prisma/client'
import { resolve } from 'path'
import fs from 'fs'

type Options = {
  root?: string,
  prisma?: PrismaClient,
  auth?: {
    onRequest: onRequestHookHandler
  }
}

type HookType = "onRequest" | "bodyModifier" | "postEffect"
type Hook = (req: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply | void> | FastifyReply | void
type TableName = Exclude<keyof PrismaClient, `$${string}`>

type AddHookSettings = { table?: TableName | TableName[] }

type AuthHook = (req: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply | { accessToken: string, refreshToken?: string }>

const marcelinePlugin = async (fastify: FastifyInstance, options: Options) => {
  
  const hooks: Record<HookType, Map<string, { hook: Hook, options: AddHookSettings }>> = 
    { onRequest: new Map(), bodyModifier: new Map(), postEffect: new Map() }
    
  const views = new FlatDB<View>({ path: process.cwd() + "/marceline/views" })
  await views.init()

  const forms = new FlatDB<Form>({ path: process.cwd() + "/marceline/forms" })
  await forms.init()
  
  const endpoints = new FlatDB<Endpoint>({ path: process.cwd() + "/marceline/endpoints" })
  await endpoints.init()

  const frontendPath = (globalThis.__dirname ?? import.meta.dirname) + "/../frontend"
  const rootPath = (options.root ?? "/")

  if (rootPath !== "/") {
    fastify.get(rootPath.slice(0, -1), (req, reply) => {
      return reply.redirect(rootPath, 303)
    })
  }

  fastify.get(rootPath+"*", async (req, reply) => {
    if (import.meta.env.DEV) {
      return reply.callNotFound()
    }

    if (req.url.includes("..")) return reply.code(403).send("Forbidden")

    // Send index.html file on root
    if (!req.url.includes(".")) {
      let content = await fs.promises.readFile(frontendPath+"/index.html", "utf-8")
      if (rootPath !== '/') { 
        content = content.replace(`<base href="/" >`, `<base href="${rootPath}">`)
      }
      return reply.headers({ "content-type": "text/html", "content-length": content.length }).send(content)
    }

    const path = resolve(frontendPath, req.url.slice(rootPath.length)) 
    const { statusCode, headers, stream, type, metadata } = await send(req.raw, path, { index: false })

    if (type === "error" || type === "directory") {
      if ("error" in metadata) console.error(metadata.error)
      return reply.code(statusCode).send({ error: `Route ${req.method}:${req.url} not found` })
    }

    return reply.code(statusCode).headers(headers).send(stream)
  })

  const routes = import.meta.glob<any>('./routes/**/*.ts', { eager: true })
  for (let route of Object.values(routes)) {
    if (typeof route.default !== "function") continue
    fastify.register(route, { prefix: "/api/admin", onRequest: options.auth?.onRequest })
  }  
  
  const registerHook = (name: string, type: HookType, hook: Hook, options: AddHookSettings = {}) => {
    if (hooks[type].has(name)) {
      return console.warn(`Hook ${name} already registered. Pick another name`)
    }
    hooks[type].set(name, { hook, options })
  }

  let authMethod: AuthHook | null = null
  const addAuthMethod = (method: AuthHook) => {
    authMethod = method
  }

  fastify.post("/api/admin/login", async (req, reply) => {
    if (authMethod === null) return reply.code(403).send("Auth method is not defined")
    return await authMethod(req, reply)
  })

  fastify.post("/api/admin/logout", async (req, reply) => {
    
  })

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
    getHooks,
    addAuthMethod
  }
}

export const marceline = fp(async (fastify, options: Options) => {
  const plugin = await marcelinePlugin(fastify, options)
  fastify.decorate("marceline", plugin)
})

export type MarcelinePlugin = Awaited<ReturnType<typeof marcelinePlugin>>

declare module 'fastify' {
  interface FastifyInstance {
    marceline: MarcelinePlugin
  }
}
