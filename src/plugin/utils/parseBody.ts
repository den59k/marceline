import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Form, FormField } from "../types";
import { getIdField } from "./getIdField";
import { Prisma } from "@prisma/client";

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

     if (item.format === "multiselect" && item.relationType && Array.isArray(value)) {
      if (!req.postCallbacks) req.postCallbacks = []
      
      const idField = getIdField({ systemTable: item.relationType })
      const sourceTable = Prisma.dmmf.datamodel.models.find(table => table.name === form.systemTable)!

      if (item.relationBridgeType) {
        req.postCallbacks.push(async (obj) => {

          const relationTable = Prisma.dmmf.datamodel.models.find(table => table.name === item.relationBridgeType)!
          const sourceRelationField = sourceTable.fields.find(field => field.name === item.fieldId)!.relationName!
          const relationField = relationTable.fields.find(field => field.relationName === sourceRelationField)!    
          const oppositeField = relationTable.fields.find(field => field.name === item.relationBridgeFieldId)!

          const data = Object.fromEntries(relationField.relationFromFields!.map((item, index) => 
            [ item, obj[relationField.relationToFields![index]] ]))

          const existingItems = await (fastify as any).prisma[item.relationBridgeType!].findMany({
            where: data
          })

          const set = new Set(existingItems.map((item: any) => item[ oppositeField.relationFromFields![0] ]))
          const newItemIds = []
          for (let item of value) {
            if (set.has(item[idField.name])) {
              set.delete(item[idField.name])
            } else {
              newItemIds.push(item[idField.name])
            }
          }
          if (set.size > 0) {
            await (fastify as any).prisma[item.relationBridgeType!].deleteMany({
              where: {
                ...data,
                [ oppositeField.relationFromFields![0] ]: { in: Array.from(set.values()) }
              }
            })
          }

          if (newItemIds.length > 0) {
            await (fastify as any).prisma[item.relationBridgeType!].createMany({
              data: newItemIds.map(itemId => ({
                ...data,
                [ oppositeField.relationFromFields![0] ]: itemId
              }))
            })
          }
        })
        continue
      }
      req.postCallbacks.push(async (obj) => {
        const relationTable = Prisma.dmmf.datamodel.models.find(table => table.name === item.relationType)!
        const sourceRelationField = sourceTable.fields.find(field => field.name === item.fieldId)!.relationName!
        const relationField = relationTable.fields.find(item => item.relationName === sourceRelationField)!
  
        const data = Object.fromEntries(relationField.relationFromFields!.map((item, index) => 
          [ item, obj[relationField.relationToFields![index]] ]))
        const nullData = Object.fromEntries(relationField.relationFromFields!.map((item, index) => 
          [ item, null ]))

        if (value.length > 0) {
          await (fastify as any).prisma[item.relationType!].updateMany({
            data,
            where: { [idField.name]: { in: value.map((item: any) => item[idField.name]) } }
          })
        }
        if (!relationField.isRequired) {
          await (fastify as any).prisma[item.relationType!].updateMany({
            data: nullData,
            where: { 
              [idField.name]: { notIn: value.map((item: any) => item[idField.name]) } ,
              ...data
            }
          })
        }
      })
      continue
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
      _body[item.aliasFieldId ?? item.fieldId] = value
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