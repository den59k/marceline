import { FastifyInstance, FastifyReply, FastifyRequest, onRequestHookHandler } from 'fastify'
import fp from 'fastify-plugin'
import { FlatDB } from './flatdb'
import { Endpoint, Form, View } from './types'
import { PrismaClient } from '@prisma/client'
import frontendRoute from './extraRoutes/frontend'
import endpointRoutes from './extraRoutes/endpointRoutes'

export type Options = {
  root?: string,
  title?: string,
  prisma?: PrismaClient,
  auth?: {
    onRequest: onRequestHookHandler
  },
  files?: {
    systemTable?: TableName
    filesDir?: string,
    prefix?: string
  }
}

type HookType = "onRequest" | "bodyModifier" | "postEffect" | "fieldModifier" | "filter" | "responseModifier"
type Hook = (req: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply | void> | FastifyReply | void
type TableName = Exclude<keyof PrismaClient, `$${string}`>

type AddHookSettings = { table?: TableName | TableName[], allow?: "list" | "object" | "all" }

type AuthHook = (req: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply | { accessToken: string, refreshToken?: string }>

const marcelinePlugin = async (fastify: FastifyInstance, options: Options) => {
  
  const hooks: Record<HookType, Map<string, { hook: Hook, options: AddHookSettings }>> = { 
    onRequest: new Map(), bodyModifier: new Map(), 
    postEffect: new Map(), fieldModifier: new Map(), 
    filter: new Map(), responseModifier: new Map() 
  }
    
  const views = new FlatDB<View>({ path: process.cwd() + "/marceline/views" })
  await views.init()

  const forms = new FlatDB<Form>({ path: process.cwd() + "/marceline/forms" })
  await forms.init()
  
  const endpoints = new FlatDB<Endpoint>({ path: process.cwd() + "/marceline/endpoints" })
  await endpoints.init()

  await fastify.register(frontendRoute, options)
  await fastify.register(endpointRoutes, { endpoints: endpoints.items.values() })

  const routes = import.meta.glob<any>('./routes/**/*.ts', { eager: true })
  for (let route of Object.values(routes)) {
    if (typeof route.default !== "function") continue
    await fastify.register(route, { prefix: "/api/admin", onRequest: options.auth?.onRequest, files: options.files })
  }  
  
  const registerHook = (type: HookType, name: string, hook: Hook, options: AddHookSettings = {}) => {
    if (hooks[type].has(name)) {
      return console.warn(`Hook ${name} already registered. Pick another name`)
    }
    hooks[type].set(name, { hook, options })
  }

  const applyHooks = async (type: HookType, hookList: string[], req: FastifyRequest, reply: FastifyReply): Promise<void | FastifyReply> => {
    for (let item of hookList) {
      const hook = hooks[type].get(item)
      if (!hook) {
        console.warn(`${type} hook "${item}" not found`)
        continue
      }
      const resp = await hook.hook(req, reply)
      if (typeof resp === "object" && resp === reply) {
        return resp
      }
    }
  }
  
  const executePostCallbacks = async (req: FastifyRequest, obj: any) => {
    if (!req.postCallbacks || req.postCallbacks.length === 0) return
    for (let callback of req.postCallbacks) {
      await callback(obj)
    }
  }

  let authMethod: AuthHook | null = null
  const addAuthMethod = (method: AuthHook) => {
    authMethod = method
  }
  
  const scripts: string[] = []
  const registerScript = (script: string) => {
    if (script.trimStart().startsWith("<")) {
      scripts.push(script)
    } else {
      const path = script
      if (path.endsWith(".css")) {
        scripts.push(`<link rel="stylesheet" href="${path}">`)
      } else {
        scripts.push(`<script src="${path}" type="module"></script>`)
      }
    }
  }

  fastify.post("/api/admin/login", async (req, reply) => {
    if (authMethod === null) return reply.code(403).send("Auth method is not defined")
    return await authMethod(req, reply)
  })

  fastify.post("/api/admin/logout", async (req, reply) => {
    
  })

  return {
    views,
    forms,
    endpoints,
    registerHook,
    applyHooks,
    hooks,
    addAuthMethod,
    executePostCallbacks,
    registerScript,
    scripts
  }
}

export const marceline = fp(async (fastify, options: Options) => {
  const plugin = await marcelinePlugin(fastify, options)
  fastify.decorate("marceline", plugin)
  fastify.decorateRequest("currentField")
  fastify.decorateRequest("modifiedBody")
  fastify.decorateRequest("endpointAction")
  fastify.decorateRequest("fieldId")
  fastify.decorateRequest("where")
  fastify.decorateRequest("endpointResponse")
  fastify.decorateRequest("postCallbacks")
})

export type MarcelinePlugin = Awaited<ReturnType<typeof marcelinePlugin>>

declare module 'fastify' {
  interface FastifyInstance {
    marceline: MarcelinePlugin
  }
  interface FastifyRequest {
    currentField: any
    modifiedBody: any
    endpointAction: "create" | "get" | "edit" | "delete" | "list"
    fieldId: string
    where: Record<string, any>
    endpointResponse: any
    postCallbacks: ((object: any) => void | Promise<void>)[]
  }
}
