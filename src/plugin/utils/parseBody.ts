import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Form, FormField } from "../types";

export const parseBody = async (fastify: FastifyInstance, req: FastifyRequest, reply: FastifyReply, form: Form, body: any) => {
  
  const _body: Record<string, any> = {}

  const fields = getFlatFields(form.fields)

  for (let item of fields) {
    if (!item.fieldId) continue
    
    let value = body[item.fieldId]

    if (item.modifiers && item.modifiers.length > 0) {
      req.currentField = value
      const resp = await fastify.marceline.applyHooks("fieldModifier", item.modifiers, req, reply)
      if (typeof resp === "object" && resp === reply) {
        return resp
      }
      value = req.currentField
    }

    if (item.jsonField) {
      if (!_body[item.jsonField]) {
        _body[item.jsonField] = {}
      }
      if (item.fieldId in body) {
        _body[item.jsonField][item.fieldId] = value
      }
      continue
    }

    if (item.fieldId in body) {
      _body[item.fieldId] = value
    }
    if (item.fileField && item.fileField in body) {
      if (item.format === "files-group") {
        _body[item.fieldId] = body[item.fileField].map((item: any) => item.id)
      } else {
        _body[item.fieldId] = body[item.fileField]?.id ?? null
      }
    }
  }

  req.modifiedBody = _body
  if (form.bodyModifiers && form.bodyModifiers.length > 0) {
    const resp = await fastify.marceline.applyHooks("bodyModifier", form.bodyModifiers, req, reply)
    if (typeof resp === "object" && resp === reply) {
      return resp
    }
  }
}

const getFlatFields = (form: Form["fields"]): FormField[] => {
  const arr: FormField[] = []
  for (let item of form) {
    if (item.children) {
      arr.push(...getFlatFields(item.children))
    } else {
      arr.push(item)
    }
  }
  return arr
}

export const traverseFormFields = (form: Form["fields"], callback: (item: FormField) => void) => {
  for (let item of form) {
    if (item.children) {
      traverseFormFields(item.children, callback)
    } else {
      callback(item)
    }
  }
}