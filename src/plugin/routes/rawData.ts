import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance } from "fastify";
import { getIdField } from "../utils/getIdField";
import { Prisma } from "@prisma/client";

const nameFields = [ "name", "title" ]

export default async (fastify: FastifyInstance, { onRequest }: any) => {

  if (onRequest) {
    fastify.addHook("onRequest", onRequest)
  }
  
  const querySchema = schema({ enableFilter: "boolean?" })
  const getRawDataSchema = schema({ systemTable: "string" })
  fastify.get("/raw-data/:systemTable", sc(getRawDataSchema, querySchema, "query"), async (req, reply) => {
    const { systemTable } = req.params as SchemaType<typeof getRawDataSchema>
    const { enableFilter } = req.query as SchemaType<typeof querySchema>

    const table = Prisma.dmmf.datamodel.models.find(item => item.name === systemTable)
    if (!table) return reply.code(400).send(`Table ${table} not found`)
    
    const idField = getIdField({ systemTable })

    const nameField = 
      table.fields.find(item => nameFields.includes(item.name)) ?? 
      table.fields.find(item => item.type === "String" && !item.isId) ??
      table.fields.find(item => item.kind === "scalar" && !item.isId)
    
    const select: Record<string, boolean> = {}
    select[idField.name] = true
    if (nameField) {
      select[nameField.name] = true
    }

    let where: any = undefined
    if (enableFilter) {
      if (idField.type === "Int") {
        where = { [idField.name]: { gt: 0 } }
      } else if (idField.type === "String") {
        where = { [idField.name]: { startsWith: "_" } }
      }
    }

    const resp = await (fastify as any).prisma[systemTable].findMany({
      select: select,
      orderBy: { [idField.name]: "asc" },
      where,
      take: 500
    })

    return resp
  })

}