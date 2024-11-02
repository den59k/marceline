import 'dotenv/config'
import fastify, { FastifyServerOptions } from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import { marceline } from '../plugin/marceline'
import { useAdminAuth } from './hooks/useAdminAuth'
import { generateHash, generateAccessToken } from './utils/hashPassword'
import { uid } from 'uid/secure'

const plugins = import.meta.glob<any>('./plugins/**/*.ts', { eager: true })
const routes = import.meta.glob<any>('./routes/**/*.ts', { eager: true })

export const createApp = async (opts?: FastifyServerOptions) => {

  const app = fastify(opts)
  for (let plugin of Object.values(plugins)) {
    if (typeof plugin.default !== "function") continue
    await app.register(plugin)
  }

  await app.register(fastifyMultipart, { limits: { fileSize: 1024 * 1024 * 200 }})

  await app.register(marceline, { 
    root: "/",
    prisma: app.prisma,
    title: "Админ-панель",
    auth: {
      onRequest: useAdminAuth
    },
    files: {
      systemTable: "file"
    }
  })

  app.marceline.addAuthMethod(async (req, reply) => {
    const { login, password } = req.body as any
    const user = await app.prisma.adminUser.findUnique({
      where: { login }
    })

    if (!user) return reply.code(403).send("Wrong credentials")

    const hash = await generateHash(password)
    if (!hash.equals(user.password)) return reply.code(403).send("Wrong credentials")

    if (!user.token) {
      const token = generateAccessToken()
      await app.prisma.adminUser.update({
        where: { id: user.id },
        data: { token }
      })
      user.token = token
    }

    return { accessToken: user.token }
  })

  const rootPassword = await generateHash("123123")
  await app.prisma.adminUser.upsert({
    where: { login: "root" },
    update: { login: "root", password: rootPassword },
    create: { login: "root", password: rootPassword }
  })

  app.marceline.registerHook("onRequest", "checkUserAccess", (req, reply) => {
    if (!req) return reply.code(403).send("Forbidden")
  })

  app.marceline.registerHook("fieldModifier", "hashPassword", async (req, reply) => {
    const password = req.currentField
    if (password === undefined || password === null) return
    req.currentField = await generateHash(password)
  })

  app.marceline.registerHook("bodyModifier", "generateUuid", async (req, reply) => {
    req.modifiedBody.uuid = uid()
  })

  app.marceline.registerHook("postEffect", "printConsole", async (req, reply) => {
    console.info(req.body)
  })
  
  app.marceline.registerHook("filter", "getAdminUserId", async (req, reply) => {
    req.where[req.fieldId] = req.adminUser.id
  })

  app.marceline.registerHook("responseModifier", "Update photos", async (req, reply) => {
    req.endpointResponse.photos = []
  }, { allow: "list", table: "user" })

  const routePrefix = "/api"
  for (let [ key, route ] of Object.entries(routes)) {
    if (typeof route.default !== "function") continue
    const path = key.slice("./routes/".length).split("/")
    const prefix = route.prefix ?? [ routePrefix, ...path.slice(0, -1) ].join("/")
    app.register(route, { prefix })
  }

  return app
}