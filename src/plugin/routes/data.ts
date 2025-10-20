import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { attachFiles, generateSelect } from "../utils/generateSelect";
import { parseBody, traverseFormFields } from "../utils/parseBody";
import { getIdField, parseIdField } from "../utils/getIdField";
import { Form, FormField, View } from "../types";
import { Prisma } from "@prisma/client";
import { getSearchFeed } from "../utils/getSearchFeed";
import { capitalize } from "../utils/lang";

interface FastifyRequestExt extends FastifyRequest {
  view: View,
}

const PAGE_SIZE = 20

export default async (fastify: FastifyInstance, { onRequest, files, advancedSearch }: any) => {

  if (advancedSearch) {
    // @ts-ignore
    await fastify.prisma.$executeRaw`
  CREATE OR REPLACE FUNCTION find_in_array(A text, B text[]) 
  RETURNS BOOL AS $$
  DECLARE
      found BOOL := TRUE;
      element TEXT;
  BEGIN
    FOREACH element IN ARRAY B LOOP
      IF POSITION(element IN a) = 0 THEN
          RETURN FALSE;
      END IF;
    END LOOP;

    RETURN TRUE;
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;
    `
  }

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

    const tableName = capitalize(view.systemTable) as Prisma.ModelName
    const actions = view.actions?.map(key => fastify.marceline.actions[tableName]?.[key]).filter(item => !!item) ?? []

    req.view = { ...view, idField: getIdField(view)?.name, actions } as any
  })

  const filesReg = /file/i
  const systemTable = files?.systemTable?.toLowerCase()
  const filesTable = Prisma.dmmf.datamodel.models.find(item => {
    if (systemTable) {
      return item.name.toLowerCase() === systemTable
    } else {
      return filesReg.test(item.name)
    }
  })

  const getDataQuery = schema({ page: "number?", search: "string?" })
  /** Get data */
  fastify.get("/data/:viewId/items", sc(params, getDataQuery, "query"), async (_req, reply) => {
    const req = _req as FastifyRequestExt
    const { page, search, ...otherParams } = req.query as SchemaType<typeof getDataQuery>

    let createForm: Form | null = null, editForm: Form | null = null
    if (req.view.data.create.enabled && req.view.data.create.form) {
      createForm = fastify.marceline.forms.getItem(req.view.data.create.form) ?? null
    }
    if (req.view.data.edit.enabled && req.view.data.edit.form) {
      editForm = fastify.marceline.forms.getItem(req.view.data.edit.form) ?? null
    }

    const postCallbacks: ((item: any) => void)[] = []
    const select = generateSelect(req.view.columns, postCallbacks)
    const fileFields: FormField[] = []

    if (editForm) {
      // Add some select fields for object edit feature
      traverseFormFields(editForm.fields, (field) => {
        if (field.jsonField) {
          select[field.jsonField] = true
        } else if (field.fieldId && field.format === 'subitems') {
          select[field.fieldId] = {
            select: Object.fromEntries(field.columns.filter(item => item.enabled !== false).map(item => [ item.fieldId, true ]))
          }
        } else if (field.fieldId && field.relationBridgeFieldId) {
          const relationTable = Prisma.dmmf.datamodel.models.find(item => item.name === field.relationType!)!
          const keys = [ "name", "surname", "email", "id", "uuid" ].filter(fieldId => relationTable.fields.find(item => item.name === fieldId))
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
        } else if (field.fileIdField) {
          select[field.fileIdField] = true
          fileFields.push(field)
        } else if (field.fieldId && field.format !== 'password') {
          select[field.fieldId] = true
        }
      })
    }

    const idField = getIdField(req.view)
    if (select) {
      select[idField.name] = true
    }

    const systemTable = Prisma.dmmf.datamodel.models.find(item => item.name === req.view.systemTable)!
    const where: Record<string, any> = {}
    if (req.view.filters) {
      for (let filter of req.view.filters) {
        const value = (otherParams as any)[filter.systemColumn] ?? filter.value
        const viewColumn = systemTable.fields.find(item => item.name === filter.systemColumn)
        if (filter.format === 'const' && value) {
          where[filter.systemColumn] = filter.value
        }
        if (filter.format === 'select' && value) {
          where[filter.systemColumn] = parseIdField(viewColumn!, value)
        }
      }
    }

    let totalItems = 0

    if (search) {
      const feed = getSearchFeed(search)

      const sqlArr = []
      for (let field of systemTable.fields) {
        if (field.kind !== 'scalar' && field.kind !== "enum") continue
        const viewColumn = req.view.columns.find(item => item.systemColumn === field.name)
        if (!viewColumn) continue
        let item = ""
        if (field.type === 'Int' || field.type === 'BigInt' || field.kind === "enum") {
          item = `"${field.name}"::text`
        }
        if (field.type === "String") {
          item = `lower("${field.name}")`
        }
        if (!item) continue
        if (!field.isRequired) {
          item = `COALESCE(${item}, '')`
        }
        sqlArr.push("' ' || " + item)
      }

      let resp: { id: number }[] = []
      if (advancedSearch) {

        const feedVariables = feed.map((_, index) => '$'+(index+1)).join(", ")
        // @ts-ignore
        resp = await fastify.prisma.$queryRawUnsafe(`
        select ${getIdField(req.view).name} from "${req.view.systemTable}" where find_in_array(${sqlArr.join(" || ")}, ARRAY[${feedVariables}])
        `, ...feed)
      } else {
        // @ts-ignore
        resp = await fastify.prisma.$queryRawUnsafe(`
        select ${getIdField(req.view).name} from "${req.view.systemTable}" where ${sqlArr.join(" || ")} like $1
        `, `%${search.toLowerCase()}%`)
      }
      where[getIdField(req.view).name] = { in: resp.map(item => item.id) }
      totalItems = resp.length
      // totalItems = resp[0].count
    } else {
      totalItems = await (fastify as any).prisma[req.view.systemTable].count({ where })
    }

    if (totalItems === 0) {
      return {
        createForm,
        editForm,
        view: req.view,
        data: [],
        totalPages: 0
      }
    }

    const sortBy = req.view.sortBy

    const resp = await (fastify as any).prisma[req.view.systemTable].findMany({
      select,
      orderBy: sortBy? { [sortBy.replace(/[-+]/,"")]: sortBy.startsWith("-")? "desc": "asc" }: { [idField.name]: "asc" },
      take: PAGE_SIZE,
      where,
      skip: (page ?? 0) * PAGE_SIZE
    })

    if (fileFields.length > 0 && filesTable) {
      await attachFiles((fastify as any).prisma, filesTable.name, resp, fileFields as any[])
    }

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

    if (form.postEffects && form.postEffects.length > 0) {
      await fastify.marceline.applyHooks("postEffect", form.postEffects, req, reply)
    }

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

    if (form.postEffects && form.postEffects.length > 0) {
      await fastify.marceline.applyHooks("postEffect", form.postEffects, req, reply)
    }

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