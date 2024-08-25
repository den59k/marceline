import { FastifyInstance } from "fastify";

export default async (fastify: FastifyInstance, { onRequest }: any) => {

  if (onRequest) {
    fastify.addHook("onRequest", onRequest)
  }

  fastify.get("/hooks", async () => {
    return fastify.marceline.getHooks()
  })

}