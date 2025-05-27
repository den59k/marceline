import { Prisma } from '@prisma/client'
import { FastifyInstance } from 'fastify'
import { getIdField } from '../utils/getIdField'

export default async (fastify: FastifyInstance, { onRequest }: any) => {

  if (onRequest) {
    fastify.addHook("onRequest", onRequest)
  }

  fastify.get("/actions/:tableName", async (req) => {
    const { tableName } = req.params as any
    const actions = fastify.marceline.actions[tableName as Prisma.ModelName]

    if (!actions) return []

    return Object.entries(actions).map(([key, item]) => ({ id: key, title: item.title ?? key }))
  })

  fastify.post("/actions/:tableName/:actionName", async (req, reply) => {
    const { tableName, actionName } = req.params as any

    const action = fastify.marceline.actions[tableName as Prisma.ModelName]?.[actionName]
    if (!action) {
      return reply.code(400).send({ error: { actionName: { message: `Action ${actionName} for table ${tableName} not found` } } })
    }

    const id = getIdField({ systemTable: tableName })
    const item = await (fastify as any).prisma[tableName].findUnique({
      where: { [id.name]: (req.body as any)[id.name] }
    })
    if (!item) return reply.code(400).send({ error: { [id.name]: { message: `Item with id ${(req.body as any)[id.name]} not found` } }})

    return await action.callback(item)
  })

}