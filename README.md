# Marceline

A backend framework for fast backend application creation with auto-generation of admin panel.

It's basically a plugin for fastify that plugs into your prisma schema and creates a UI interface to interact with the data. All you have to do is customize the necessary forms and tables and your admin panel is ready to go

## Required stack for use with this platform:

* Fastify

* Prisma

* Vue3 (if you want to write add-ons to the interface)

## Usage 

Before launching, write schema.prisma so that the plugin can capture your database structure.

```
import fastify from 'fastify'
import { marceline } from 'marceline'
import { PrismaClient } from '@prisma/client'

const launchApp = () => {
  const app = fastify()

  const prisma = new PrismaClient()
  await prisma.$connect()
  app.decorate('prisma', prisma)

  await app.register(marceline, { root: '/admin/' })

  await app.listen({ port: 3000 })
}

launchApp()

```

Run this code and open browser page http://localhost:3000/admin/ - your admin panel is ready