import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance } from "fastify";
import { Prisma } from "prisma/prisma-client";
import { FlatDB } from "../flatdb";
import { getUniqueName } from "../utils/getUniqueName";

export default async (fastify: FastifyInstance) => {

  fastify.get("/api/admin/tables", async () => {
    return {
      models: Prisma.dmmf.datamodel.models
    }
  })

  const params = schema({ viewId: "string" })
  /** Get available views */
  fastify.get("/api/admin/views", async () => {
    return fastify.marceline.views.getItems()
  })

  /** Create new view */
  const createTableSchema = schema({ name: "string", systemTable: "string", columns: { type: "array?" } })
  fastify.post("/api/admin/views", sc(createTableSchema, "body"), async (req, reply) => {
    const { name, systemTable, columns } = req.body as SchemaType<typeof createTableSchema>
    
    if (!Prisma.dmmf.datamodel.models.find(item => item.name === systemTable)) {
      return reply.code(400).send(`Table ${systemTable} not found`)
    }
    
    const id = getUniqueName(systemTable, (name: string) => !fastify.marceline.views.hasItem(name))
    const view = fastify.marceline.views.createItem({ id, name, systemTable, columns: columns ?? [] })
    return view
  })

  /** Edit view */
  fastify.post("/api/admin/views/:viewId", sc(params, createTableSchema), async (req, reply) => {
    const { viewId } = req.params as SchemaType<typeof params>
    const { name, systemTable, columns } = req.body as SchemaType<typeof createTableSchema>

    const item = fastify.marceline.views.getItem(viewId)
    if (!item) return reply.code(400).send(`View ${viewId} not found`)
    
    Object.assign(item, { name, systemTable, columns })
    fastify.marceline.views.saveItem(item)
  })

}