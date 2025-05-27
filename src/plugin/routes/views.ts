import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance } from "fastify";
import { getUniqueName } from "../utils/getUniqueName";
import { Prisma } from "@prisma/client";

export default async (fastify: FastifyInstance, { onRequest }: any) => {

  if (onRequest) {
    fastify.addHook("onRequest", onRequest)
  }

  fastify.get("/tables", async () => {
    return {
      models: Prisma.dmmf.datamodel.models,
      enums: Prisma.dmmf.datamodel.enums
    }
  })

  const params = schema({ viewId: "string" })
  /** Get available views */
  fastify.get("/views", async () => {
    const views = fastify.marceline.views.getItems()
    views.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return views
  })

  fastify.get("/views/:viewId", async (req) => {
    const { viewId } = req.params as SchemaType<typeof params>
    return fastify.marceline.views.getItem(viewId) ?? null
  })

  /** Create new view */
  const createTableSchema = schema({ 
    name: "string", 
    systemTable: "string",
    columns: { type: "array?" }, 
    actions: { type: "array?", items: "string" }, 
    icon: "string?", 
    data: "object?" 
  })
  fastify.post("/views", sc(createTableSchema, "body"), async (req, reply) => {
    const { name, systemTable, columns } = req.body as SchemaType<typeof createTableSchema>
    
    if (!Prisma.dmmf.datamodel.models.find(item => item.name === systemTable)) {
      return reply.code(400).send(`Table ${systemTable} not found`)
    }
    
    const id = getUniqueName(systemTable, (name: string) => !fastify.marceline.views.hasItem(name))
    const view = fastify.marceline.views.createItem({ id, name, systemTable, columns: columns ?? [], 
      data: { create: { enabled: false }, edit: { enabled: false }, delete: { enabled: false } } 
    })
    return view
  })

  /** Edit view */
  fastify.post("/views/:viewId", sc(params, createTableSchema), async (req, reply) => {
    const { viewId } = req.params as SchemaType<typeof params>
    const { name, systemTable, columns, icon, data, actions } = req.body as SchemaType<typeof createTableSchema>

    const item = fastify.marceline.views.getItem(viewId)
    if (!item) return reply.code(400).send(`View ${viewId} not found`)
    
    Object.assign(item, { name, systemTable, columns, icon, data, actions })

    fastify.marceline.views.saveItem(item)
  })

}