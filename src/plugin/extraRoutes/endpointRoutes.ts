import { FastifyInstance } from "fastify";
import { Endpoint } from "../types";
import { getIdField, parseIdField } from "../utils/getIdField";
import { parseBody } from "../utils/parseBody";


export default async (fastify: FastifyInstance, options: { endpoints: Iterable<Endpoint> }) => {

  for (let item of options.endpoints) {
    for (let entry of item.data) {
      if (entry.enabled === false) continue
      if (entry.id === "list") {
        fastify.get(item.path, async (req, reply) => {
          req.endpointAction = "list"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
          }
          const resp = await (fastify as any).prisma[item.systemTable].findMany({})
          return resp
        })

      } else if (entry.id === "get") {
        fastify.get(item.path+"/:itemId", async (req, reply) => {
          req.endpointAction = "get"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
          }
          const idField = getIdField(item)
          const resp = await (fastify as any).prisma[item.systemTable].findUnique({
            where: { id: parseIdField(idField, (req as any).params.itemId) }
          })
          return resp
        })

      } else if (entry.id === "create" && entry.form) {
        fastify.post(item.path, async (req, reply) => { 
          req.endpointAction = "create"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
          }

          if (typeof req.body !== "object") return reply.code(400).send({ error: "Body must be an object" })

          const form = fastify.marceline.forms.getItem(entry.form!)
          if (!form) return reply.code(500).send("Contact with administrator. Error: Form not found")

          const resp = await parseBody(fastify, req, reply, form, req.body)
          if (typeof resp === "object" && resp === reply) return resp            

          const idField = getIdField(item)
          const newObject = await (fastify as any).prisma[item.systemTable].create({
            select: { [idField.name]: true },
            data: req.modifiedBody
          })
          Object.assign(req.modifiedBody, newObject)

          if (entry.hooks.postEffect && entry.hooks.postEffect.length > 0) {
            await fastify.marceline.applyHooks("postEffect", entry.hooks.postEffect, req, reply)
          }
          return newObject
        })

      } else if (entry.id === "edit" && entry.form) {
        fastify.post(item.path+"/:itemId", async (req, reply) => { 
          req.endpointAction = "edit"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
          }

          if (typeof req.body !== "object") return reply.code(400).send({ error: "Body must be an object" })

          const form = fastify.marceline.forms.getItem(entry.form!)
          if (!form) return reply.code(500).send("Contact with administrator. Error: Form not found")
            
          const resp = await parseBody(fastify, req, reply, form, req.body)
          if (typeof resp === "object" && resp === reply) return resp  

          const idField = getIdField(item)
          const newObject = await (fastify as any).prisma[item.systemTable].update({
            select: { [idField.name]: true },
            data: req.modifiedBody,
            where: { id: parseIdField(idField, (req as any).params.itemId) }
          })
          Object.assign(req.modifiedBody, newObject)

          if (entry.hooks.postEffect && entry.hooks.postEffect.length > 0) {
            await fastify.marceline.applyHooks("postEffect", entry.hooks.postEffect, req, reply)
          }
          return newObject
        })

      } else if (entry.id === "delete") {
        fastify.delete(item.path+"/:itemId", async (req, reply) => { 
          req.endpointAction = "delete"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
          }

          const idField = getIdField(item)
          await (fastify as any).prisma[item.systemTable].delete({
            where: { id: parseIdField(idField, (req as any).params.itemId) }
          })

          if (entry.hooks.postEffect && entry.hooks.postEffect.length > 0) {
            await fastify.marceline.applyHooks("postEffect", entry.hooks.postEffect, req, reply)
          }
        })
      }
    }
  }
} 