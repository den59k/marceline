import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { generateSelect } from "../utils/generateSelect";
import { parseBody, traverseFormFields } from "../utils/parseBody";
import { getIdField, parseIdField } from "../utils/getIdField";
import { Form, View } from "../types";
import { Prisma } from "@prisma/client";

interface FastifyRequestExt extends FastifyRequest {
  view: View,
}

const PAGE_SIZE = 20

export default async (fastify: FastifyInstance, { onRequest }: any) => {

  if (onRequest) {
    fastify.addHook("onRequest", onRequest)
  }

  const params = schema({ viewId: "string" })

  fastify.decorateRequest("view", null)
  
  fastify.addHook("onRequest", async (_req, reply) => {
    const req = _req as FastifyRequestExt
    const { viewId } = req.params as SchemaType<typeof params>

    const view = fastify.marceline.views.getItem(viewId)
    if (!view) return reply.code(400).send(`View ${viewId} not found`)

    req.view = view
  })

  const getDataQuery = schema({ page: "number?" })
  /** Get data */
  fastify.get("/data/:viewId/items", sc(params, getDataQuery, "query"), async (_req, reply) => {
    const req = _req as FastifyRequestExt
    const { page } = req.query as SchemaType<typeof getDataQuery>

    let createForm: Form | null = null, editForm: Form | null = null
    if (req.view.data.create.enabled && req.view.data.create.form) {
      createForm = fastify.marceline.forms.getItem(req.view.data.create.form) ?? null
    }
    if (req.view.data.edit.enabled && req.view.data.edit.form) {
      editForm = fastify.marceline.forms.getItem(req.view.data.edit.form) ?? null
    }

    const postCallbacks: ((item: any) => void)[] = []
    const select = generateSelect(req.view.columns, postCallbacks)
    if (editForm) {
      traverseFormFields(editForm.fields, (field) => {
        if (field.jsonField) {
          select[field.jsonField] = true
        } else if (field.fieldId && field.relationBridgeFieldId) {
          const table = Prisma.dmmf.datamodel.models.find(item => item.name === field.relationType!)!
          const keys = [ "name", "surname", "email", "id", "uuid" ].filter(fieldId => table.fields.find(item => item.name === fieldId))
          select[field.fieldId] = {
            select: { 
              [field.relationBridgeFieldId]: {
                select: Object.fromEntries(keys.map(item => [ item, true ]))
              } 
            },
            take: 100
          }
          postCallbacks.push(item => {
            item[field.fieldId!] = item[field.fieldId!].map((item: any) => item[field.relationBridgeFieldId!])
          })
        } else if (field.aliasFieldId) {
          select[field.aliasFieldId] = true 
        } else if (field.fieldId && field.format !== 'password') {
          select[field.fieldId] = true
        }
      })
    }

    const idField = getIdField(req.view)
    if (select) {
      select[idField.name] = true
    }

    const resp = await (fastify as any).prisma[req.view.systemTable].findMany({
      select,
      orderBy: { [idField.name]: "asc" },
      take: PAGE_SIZE,
      skip: (page ?? 0) * PAGE_SIZE
    })
    
    const totalItems = await (fastify as any).prisma[req.view.systemTable].count({ 
    })

    if (resp.length > 0 && postCallbacks.length > 0) {
        for (let item of resp) {
          for (let callback of postCallbacks) {
            callback(item)
          }
        }
    }

    return {
      createForm,
      editForm,
      view: req.view,
      data: resp,
      totalPages: Math.ceil(totalItems / PAGE_SIZE)
    }
  })

  /** Add element */
  fastify.post("/data/:viewId/items", sc(params), async (_req, reply) => {
    const req = _req as FastifyRequestExt
    const body = req.body as any

    let form: Form | null = null
    if (req.view.data.create.enabled && req.view.data.create.form) {
      form = fastify.marceline.forms.getItem(req.view.data.create.form) ?? null
    }
    if (!form) return reply.code(400).send(`Method "create" for view ${req.view.id} is not supported`)

    const idField = getIdField(req.view)
    const resp = await parseBody(fastify, req, reply, form, body)
    if (typeof resp === "object" && resp === reply) return resp

    const newObject = await (fastify as any).prisma[req.view.systemTable].create({
      select: { [idField.name]: true },
      data: req.modifiedBody
    })
    await fastify.marceline.executePostCallbacks(req, newObject)
    return newObject
  })

  const itemParams = schema({ viewId: "string", itemId: "string" })
  /** Update element */
  fastify.post("/data/:viewId/items/:itemId", sc(itemParams), async (_req, reply) => {
    const req = _req as FastifyRequestExt
    const body = req.body as any
    const { itemId } = req.params as SchemaType<typeof itemParams>

    let form: Form | null = null
    if (req.view.data.edit.enabled && req.view.data.edit.form) {
      form = fastify.marceline.forms.getItem(req.view.data.edit.form) ?? null
    }
    if (!form) return reply.code(400).send(`Method "edit" for view ${req.view.id} is not supported`)

    const idField = getIdField(req.view)

    const resp = await parseBody(fastify, req, reply, form, body)
    if (typeof resp === "object" && resp === reply) return resp

    const newObject = await (fastify as any).prisma[req.view.systemTable].update({
      select: { [idField.name]: true },
      where: { [idField.name]: parseIdField(idField, itemId) },
      data: req.modifiedBody
    })
    await fastify.marceline.executePostCallbacks(req, newObject)
    return newObject
  })

  /** Delete elements */
  fastify.delete("/data/:viewId/items/:itemId", sc(itemParams), async (_req, reply) => {
    const req = _req as FastifyRequestExt
    const { itemId } = req.params as SchemaType<typeof itemParams>
    
    if (!req.view.data.delete.enabled) return reply.code(400).send(`Method "delete" for view ${req.view.id} is not supported`)

    const idField = getIdField(req.view)
    await (fastify as any).prisma[req.view.systemTable].deleteMany({
      where: { 
        [idField.name]: { in: itemId.split(",").map(itemId => parseIdField(idField, itemId))  } 
      }
    })
  })

}