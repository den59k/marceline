import { FastifyInstance } from "fastify";
import send from '@fastify/send'
import { resolve } from 'path'
import fs from 'fs'
import { Options } from "../marceline";

export default async (fastify: FastifyInstance, options: Options) => {

  const frontendPath = import.meta.env.DEV? 
    (process.cwd()+"/dist/frontend"): 
    ((globalThis.__dirname ?? import.meta.dirname) + "/../frontend")

  const rootPath = (options.root ?? "/")

  if (rootPath !== "/") {
    fastify.get(rootPath.slice(0, -1), (req, reply) => {
      return reply.redirect(rootPath, 303)
    })
  }

  fastify.get(rootPath+"*", async (req, reply) => {
    if (import.meta.env.DEV) {
      return reply.callNotFound()
    }

    if (req.url.includes("..")) return reply.code(403).send("Forbidden")

    if (req.method !== "GET" || req.url.startsWith("/api")) {
      return reply.code(404).send({ error: `Route ${req.method}:${req.url} not found` })
    }

    // Send index.html file on root
    if (!req.url.includes(".")) {
      let content = await fs.promises.readFile(frontendPath+"/index.html", "utf-8")
      if (rootPath !== '/') { 
        content = content.replace(`<base href="/" >`, `<base href="${rootPath}">`)
      }
      if (options.title) {
        content = content.replace("<title>Marceline</title>", `<title>${options.title}</title>`)
      }
      
      const scripts = fastify.marceline.scripts.map(path => path.endsWith(".css")? 
        `<link rel="stylesheet" href="${path}">`: 
        `<script src="${path}" type="module"></script>`
      ).join("\n")

      if (scripts) {
        content = content.replace("</head>", `${scripts}\n</head>`)
      }

      return reply.headers({ "content-type": "text/html", "content-length": content.length }).send(content)
    }

    const path = resolve(frontendPath, req.url.slice(rootPath.length)) 
    const { statusCode, headers, stream, type, metadata } = await send(req.raw, path, { index: false })

    if (type === "error" || type === "directory") {
      if ("error" in metadata) console.error(metadata.error)
      return reply.code(statusCode).send({ error: `Route ${req.method}:${req.url} not found` })
    }

    return reply.code(statusCode).headers(headers).send(stream)
  })

}