import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance, FastifyReply } from "fastify";
import { generateSelect } from "../utils/generateSelect";
import { parseBody } from "../utils/parseBody";
import { getIdField, parseIdField } from "../utils/getIdField";
import { pick } from "vuesix";
import { Form, View } from "../types";

declare module 'fastify' {
	interface FastifyRequest {
		view: View,
    form: Form | null
	}
}

export default async (fastify: FastifyInstance) => {

  const params = schema({ viewId: "string" })

  fastify.decorateRequest("view", null)
  fastify.decorateRequest("form", null)
  
  fastify.addHook("onRequest", async (req, reply) => {
    const { viewId } = req.params as SchemaType<typeof params>

    const view = fastify.marceline.views.getItem(viewId)
    if (!view) return reply.code(400).send(`View ${viewId} not found`)

    if (view.data.create.enabled && view.data.create.form) {
      const form = fastify.marceline.forms.getItem(view.data.create.form)
      req.form = form ?? null
    }

    req.view = view
  })

  /** Get data */
  fastify.get("/data/:viewId/items", sc(params), async (req, reply) => {
    const select = generateSelect(req.view.columns)
    const idField = getIdField(req.view)
    const resp = await (fastify.prisma as any)[req.view.systemTable].findMany({
      select,
      orderBy: { [idField.name]: "asc" }
    })

    if (resp.length > 0 && "_count" in resp[0]) {
      for (let item of resp) {
        if (item._count) {
          Object.assign(item, item._count)
          delete item._count
        }
      }
    }

    return {
      form: req.form,
      view: req.view,
      data: resp
    }
  })

  /** Add element */
  fastify.post("/data/:viewId/items", sc(params), async (req, reply) => {
    const body = req.body as any
    if (!req.form) return reply.code(400).send(`Method "create" for view ${req.view.id} is not supported`)

    const idField = getIdField(req.view)
    const newBody = parseBody(req.form, body)

    const resp = await (fastify.prisma as any)[req.view.systemTable].create({
      data: newBody
    })

    return pick(resp, idField.name)
  })

  const itemParams = schema({ viewId: "string", itemId: "string" })
  /** Update element */
  fastify.post("/data/:viewId/items/:itemId", sc(itemParams), async (req, reply) => {
    const body = req.body as any
    const { itemId } = req.params as SchemaType<typeof itemParams>
    if (!req.form) return reply.code(400).send(`Method "update" for view ${req.view.id} is not supported`)

    const idField = getIdField(req.view)

    const newBody = parseBody(req.form, body)

    const resp = await (fastify.prisma as any)[req.view.systemTable].update({
      where: { [idField.name]: parseIdField(idField, itemId) },
      data: newBody
    })

    return pick(resp, idField.name)
  })

  /** Delete element */
  fastify.delete("/data/:viewId/items", sc(itemParams), async (req, reply) => {
    const { itemId } = req.params as SchemaType<typeof itemParams>
    if (!req.view.data.delete.enabled) return reply.code(400).send(`Method "delete" for view ${req.view.id} is not supported`)

    const idField = getIdField(req.view)
    await (fastify.prisma as any)[req.view.systemTable].delete({
      where: { [idField.name]: parseIdField(idField, itemId) }
    })
  })
}