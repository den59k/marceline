import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance } from "fastify";
import { getUniqueName } from "../utils/getUniqueName";
import { Prisma } from "@prisma/client";

export default async (fastify: FastifyInstance) => {

  const params = schema({ formId: "string" })
  /** Get available views */
  fastify.get("/forms", async () => {
    return fastify.marceline.forms.getItems()
  })

  fastify.get("/forms/:formId", sc(params), async (req) => {
    const { formId } = req.params as SchemaType<typeof params>
    return fastify.marceline.forms.getItem(formId)
  })

  /** Create new view */
  const createTableSchema = schema({ name: "string", systemTable: "string", fields: { type: "array?" } })
  fastify.post("/forms", sc(createTableSchema, "body"), async (req, reply) => {
    const { name, systemTable, fields } = req.body as SchemaType<typeof createTableSchema>
    
    if (!Prisma.dmmf.datamodel.models.find(item => item.name === systemTable)) {
      return reply.code(400).send(`Table ${systemTable} not found`)
    }
    
    const id = getUniqueName(systemTable, (name: string) => !fastify.marceline.forms.hasItem(name))
    const view = fastify.marceline.forms.createItem({ id, name, systemTable, fields: fields ?? [] })
    return view
  })

  /** Edit view */
  fastify.post("/forms/:formId", sc(params, createTableSchema), async (req, reply) => {
    const { formId } = req.params as SchemaType<typeof params>
    const { name, systemTable, fields } = req.body as SchemaType<typeof createTableSchema>

    const item = fastify.marceline.forms.getItem(formId)
    if (!item) return reply.code(400).send(`View ${formId} not found`)
    
    Object.assign(item, { name, systemTable, fields })
    fastify.marceline.forms.saveItem(item)
  })

}