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

    const id = getIdField({ systemTable: tableName })
    if (Array.isArray(req.body)) {
      const action = fastify.marceline.bulkActions[tableName as Prisma.ModelName]?.[actionName]
      if (!action) {
        return reply.code(400).send({ error: { actionName: { message: `Bulk Action ${actionName} for table ${tableName} not found` } } })
      }
  
      const items = await (fastify as any).prisma[tableName].findMany({
        where: { [id.name]: { in: (req.body as any) } }
      })
      if (items.length === 0) {
        return reply.code(400).send({ error: { [id.name]: { message: `Items with ids ${(req.body as any).join(',')} not found` } }})
      } 
  
      return await action.callback(items)

    } else {
      const action = fastify.marceline.actions[tableName as Prisma.ModelName]?.[actionName]
      if (!action) {
        return reply.code(400).send({ error: { actionName: { message: `Action ${actionName} for table ${tableName} not found` } } })
      }
  
      const item = await (fastify as any).prisma[tableName].findUnique({
        where: { [id.name]: (req.body as any)[id.name] }
      })
      if (!item) return reply.code(400).send({ error: { [id.name]: { message: `Item with id ${(req.body as any)[id.name]} not found` } }})
  
      return await action.callback(item)
    }
  })

}