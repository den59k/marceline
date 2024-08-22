import { Prisma } from "@prisma/client";
import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance } from "fastify";
import { getUniqueName } from "../utils/getUniqueName";

export default async (fastify: FastifyInstance) => {

  fastify.get("/endpoints", async () => {
    return fastify.marceline.endpoints.getItems()
  })

  const params = schema({ itemId: "string" })
  fastify.get("/endpoints/:itemId", sc(params), async (req) => {
    const { itemId } = req.params as SchemaType<typeof params>
    return fastify.marceline.endpoints.getItem(itemId) ?? null
  })

  const createTableSchema = schema({ path: "string", systemTable: "string", data: { type: "array" } })
  /** Create new endpoint */
  fastify.post("/endpoints", async (req, reply) => {
    const { path, systemTable, data } = req.body as SchemaType<typeof createTableSchema>

    if (!Prisma.dmmf.datamodel.models.find(item => item.name === systemTable)) {
      return reply.code(400).send(`Table ${systemTable} not found`)
    }

    const id = getUniqueName(systemTable, (name: string) => !fastify.marceline.endpoints.hasItem(name))
    const newItem = fastify.marceline.endpoints.createItem({ id, path, systemTable, data })

    return newItem
  })

  /** Update endpoint */
  fastify.post("/endpoints/:itemId", async (req, reply) => {

    const { itemId } = req.params as SchemaType<typeof params>
    const { path, systemTable, data } = req.body as SchemaType<typeof createTableSchema>
      
    const item = fastify.marceline.endpoints.getItem(itemId)
    if (!item) return reply.code(400).send(`Endpoint ${itemId} not found`)
    
    Object.assign(item, { path, systemTable, data })
    fastify.marceline.endpoints.saveItem(item)
  })

}