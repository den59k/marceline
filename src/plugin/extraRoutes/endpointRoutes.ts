import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Endpoint, EndpointEntry } from "../types";
import { getIdField, parseIdField } from "../utils/getIdField";
import { parseBody } from "../utils/parseBody";
import { Prisma } from "@prisma/client";

const getSelect = (fields?: EndpointEntry["fields"]): Record<string, any> | undefined => { 
  if (!fields) return undefined

  return Object.fromEntries(Object.entries(fields).map(item => [ 
    item[0], 
    typeof item[1] === "boolean"? item[1]: { select: getSelect(item[1]) } 
  ]))
}

const getWhere = async (fasitfy: FastifyInstance, req: FastifyRequest, reply: FastifyReply, systemTable: string, filters: EndpointEntry["filters"]) => {
  if (!filters) return undefined
  req.where = {}
  const table = Prisma.dmmf.datamodel.models.find(item => item.name === systemTable)
  if (!table) throw new Error(`Table ${table} not found`)

  for (let filter of filters) {
    if (filter.id === 'param' && filter.param && filter.field) {
      const value = (req.params as any)[filter.param]
      const field = table.fields.find(item => item.name === filter.field)
      if (!field) throw new Error(`Field ${field} not found in table ${systemTable}`)
      req.where[filter.field] = parseIdField(field, value)
    } else {
      const hook = fasitfy.marceline.hooks.filter.get(filter.id)
      if (!hook) {
        console.warn(`Hook ${hook} not found`)
        continue
      }
      if (!filter.field) continue

      req.fieldId = filter.field
      const resp = await hook.hook(req, reply)
      if (typeof resp === "object" && resp === reply) return resp
    }
  }
}

export default async (fastify: FastifyInstance, options: { endpoints: Iterable<Endpoint> }) => {

  for (let item of options.endpoints) {
    for (let entry of item.data) {
      if (entry.enabled === false) continue
      if (entry.id === "list") {
        fastify.get(item.path, async (req, reply) => {

          req.endpointAction = "list"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            const resp = await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
            if (typeof resp === "object" && resp === reply) return resp      
          }

          const select = getSelect(entry.fields)
          const _resp = await getWhere(fastify, req, reply, item.systemTable, entry.filters) ?? {}
          if (typeof _resp === "object" && _resp === reply) return _resp

          const resp = await (fastify as any).prisma[item.systemTable].findMany({
            select,
            where: req.where
          })

          if (entry.hooks.responseModifier && entry.hooks.responseModifier.length > 0) {
            req.endpointResponse = resp
            const _resp = await fastify.marceline.applyHooks("responseModifier", entry.hooks.responseModifier, req, reply)
            if (typeof _resp === "object" && _resp === reply) return _resp
            return req.endpointResponse
          }
            
          return resp
        })

      } else if (entry.id === "get") {
        fastify.get(item.path+"/:itemId", async (req, reply) => {

          req.endpointAction = "get"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            const resp = await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
            if (typeof resp === "object" && resp === reply) return resp      
          }

          const select = getSelect(entry.fields)

          const _resp = await getWhere(fastify, req, reply, item.systemTable, entry.filters) ?? {}
          if (typeof _resp === "object" && _resp === reply) return _resp

          const idField = getIdField(item)
          const resp = await (fastify as any).prisma[item.systemTable].findUnique({
            select,
            where: { id: parseIdField(idField, (req as any).params.itemId), ...req.where }
          })

          if (resp && entry.hooks.responseModifier && entry.hooks.responseModifier.length > 0) {
            req.endpointResponse = resp
            const _resp = await fastify.marceline.applyHooks("responseModifier", entry.hooks.responseModifier, req, reply)
            if (typeof _resp === "object" && _resp === reply) return _resp
            return req.endpointResponse
          }

          return resp
        })

      } else if (entry.id === "create" && entry.form) {
        fastify.post(item.path, async (req, reply) => { 
          req.endpointAction = "create"
          if (entry.hooks.onRequest && entry.hooks.onRequest.length > 0) {
            const resp = await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
            if (typeof resp === "object" && resp === reply) return resp      
          }

          if (typeof req.body !== "object") return reply.code(400).send({ error: "Body must be an object" })

          const form = fastify.marceline.forms.getItem(entry.form!)
          if (!form) return reply.code(500).send("Contact with administrator. Error: Form not found")

          const resp = await parseBody(fastify, req, reply, form, req.body)
          if (typeof resp === "object" && resp === reply) return resp      
          
          if (entry.hooks.bodyModifier && entry.hooks.bodyModifier.length > 0) {
            const resp = await fastify.marceline.applyHooks("bodyModifier", entry.hooks.bodyModifier, req, reply)
            if (typeof resp === "object" && resp === reply) return resp      
          }

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
            const resp = await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
            if (typeof resp === "object" && resp === reply) return resp      
          }

          if (typeof req.body !== "object") return reply.code(400).send({ error: "Body must be an object" })

          const form = fastify.marceline.forms.getItem(entry.form!)
          if (!form) return reply.code(500).send("Contact with administrator. Error: Form not found")
            
          const resp = await parseBody(fastify, req, reply, form, req.body)
          if (typeof resp === "object" && resp === reply) return resp  

          if (entry.hooks.bodyModifier && entry.hooks.bodyModifier.length > 0) {
            const resp = await fastify.marceline.applyHooks("bodyModifier", entry.hooks.bodyModifier, req, reply)
            if (typeof resp === "object" && resp === reply) return resp
          }

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
            const resp = await fastify.marceline.applyHooks("onRequest", entry.hooks.onRequest, req, reply)
            if (typeof resp === "object" && resp === reply) return resp      
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