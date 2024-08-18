import { PrismaClient } from "@prisma/client"

const init = async () => {

  const prisma = new PrismaClient()
  await prisma.$connect()

  const login = "root"
  const password = Buffer.from("123123", "utf-8")

  const user = await prisma.adminUser.upsert({
    where: { login },
    update: { login, password },
    create: { login, password }
  })
  console.info (`User ${user.login} successfull created!`)
}

init()