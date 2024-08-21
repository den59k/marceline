import { FastifyInstance } from "fastify";

export default async (fastify: FastifyInstance) => {

  fastify.get("/hooks", async () => {
    return fastify.marceline.getHooks()
  })

}