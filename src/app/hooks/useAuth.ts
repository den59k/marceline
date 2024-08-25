import { onRequestAsyncHookHandler } from "fastify"

export const useAuth: onRequestAsyncHookHandler = async function (req, reply) {
  const str = req.headers["authorization"]?.split(" ")
  if (!str || str.length !== 2 || str[0] !== "Bearer") return reply.code(403).send("Authorization required")
  
  const accessToken = str[1]
  if (!accessToken) return reply.code(403).send("Authorization required")
  
  try {
    const resp = await this.jwt.verifyAndDecode(accessToken)
    req.adminUser = { id: resp.id }
  } catch(e) {
    console.warn(e)
    return reply.code(403).send("Wrong authorization token")
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    adminUser: { id: number }
  }
}

export {}