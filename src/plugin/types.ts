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

export type FormField = {
  format?: string,
  enum?: { id: string, title: string }[],
  fieldId?: string,
  name?: string, 
  placeholder?: string,
  fileField?: string,
  jsonField?: string,
  isCustom?: boolean,
  children?: FormField[]
}

export type Form = {
  id: string,
  name: string,
  systemTable: string,
  fields: FormField[]
}

export type MarcelineOptions = {
  prisma: PrismaClient,
  views: FlatDB<View>
}