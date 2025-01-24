import { Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import fs from 'fs'
import path from "path";
import { uid } from "uid/secure";

export default async (fastify: FastifyInstance, { onRequest, files }: any) => {

  if (onRequest) {
    fastify.addHook("onRequest", onRequest)
  }

  fastify.addContentTypeParser("*", (req, payload, done) => {
    const chunks: Buffer[] = []
    payload.on('data', chunk => {
      chunks.push(chunk)
    });
    payload.on('end', () => {
      done(null, Buffer.concat(chunks));
    });
    payload.on('error', err => {
      done(err);
    });
  })

  const filesReg = /file/i
  const sizeReg = /size/i
  const nameReg = /name/i

  const systemTable = files?.systemTable?.toLowerCase()
  const filesTable = Prisma.dmmf.datamodel.models.find(item => {
    if (systemTable) {
      return item.name.toLowerCase() === systemTable
    } else {
      return filesReg.test(item.name)
    }
  })

  let folderCreate = false
  const filesDir = path.resolve(files?.filesDir ?? "uploads")

  let prefix = files?.prefix ?? ""
  if (!prefix.endsWith("/")) prefix = prefix + "/"

  fastify.post("/upload-file", async (req, reply) => {
    if (!filesTable) return reply.code(400).send("Uploading files not supported. Suitable table for files not found")
    
    if (!folderCreate) {
      folderCreate = true
      await fs.promises.mkdir(filesDir, { recursive: true })
    }

    const filename = req.headers["x-file-name"] ?? ""
    const extension = filename.slice(filename.lastIndexOf(".")+1)
    const uuid = uid(20)
    const fileName = uuid + (extension? "."+extension: extension)
    await fs.promises.writeFile(path.join(filesDir, fileName), req.body as Buffer)

    const insertObject: any = {
      id: uuid,
      src: prefix + fileName,
    }
    const sizeField = filesTable.fields.find(field => sizeReg.test(field.name) && field.kind === 'scalar')
    if (sizeField) {
      insertObject[sizeField.name] = (req.body as Buffer).length
    }
    const nameField = filesTable.fields.find(field => nameReg.test(field.name) && field.kind === 'scalar')
    if (nameField) {
      insertObject[nameField.name] = filename
    }

    await (fastify as any).prisma[filesTable.name!].create({ data: insertObject })
    
    return insertObject
  })

}