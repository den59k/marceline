import { sc, schema, SchemaType } from "compact-json-schema";
import { FastifyInstance } from "fastify";
import { MarcelineOptions } from "../types";
import { generateSelect } from "../utils/generateSelect";

export default async (fastify: FastifyInstance) => {

  const params = schema({ viewId: "string" })
  
  /** Get data */
  fastify.get("/api/data/:viewId", sc(params), async (req, reply) => {
    const { viewId } = req.params as SchemaType<typeof params>
    const view = fastify.marceline.views.getItem(viewId)

    if (!view) return reply.code(400).send(`View ${viewId} not found`)

    const select = generateSelect(view.columns)

    const resp = await (fastify.prisma as any)[view.systemTable].findMany({
      select
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
      view,
      data: resp
    }
  })

}