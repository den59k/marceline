import { FastifyInstance } from "fastify";

export default async (fastify: FastifyInstance, { onRequest }: any) => {

  if (onRequest) {
    fastify.addHook("onRequest", onRequest)
  }

  fastify.get("/hooks", async () => {
    const hooks: Record<string, any[]> = {}
    for (let [ key, value ] of Object.entries(fastify.marceline.hooks)) {
      hooks[key] = Array.from(value.entries()).map(item => ({ name: item[0], ...item[1] }))
    }
    return hooks
  })

}