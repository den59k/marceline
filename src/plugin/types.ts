import { PrismaClient } from "prisma/prisma-client"
import { FlatDB } from "./flatdb"

export type ViewColumn = {
  name: string,
  systemColumn: string,
  format?: string
}

export type View = {
  id: string,
  name: string,
  systemTable: string,
  columns: ViewColumn[]
}

export type MarcelineOptions = {
  prisma: PrismaClient,
  views: FlatDB<View>
}