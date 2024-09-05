import { PrismaClient } from "@prisma/client"
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
  idField?: string,
  data: {
    create: { enabled: boolean, form?: string | null },
    edit: { enabled: boolean, form?: string | null },
    delete: { enabled: boolean },
  }
  columns: ViewColumn[],
  order?: number
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
  children?: FormField[],
  modifiers?: string[],
  aliasFieldId?: string,
}

export type Form = {
  id: string,
  name: string,
  systemTable: string,
  fields: FormField[],
  bodyModifiers?: string[]
}

export type Endpoint = {
  id: string,
  path: string,
  systemTable: string
  data: EndpointEntry[]
}

type Fields = { [key: string]: boolean | Fields }

export type EndpointEntry = {
  id: string, 
  hooks: Record<string, string[]>, 
  enabled?: boolean, 
  form?: string,
  fields: Fields, 
  filters?: { id: string, param?: string, field?: string }[]
}

export type MarcelineOptions = {
  prisma: PrismaClient,
  views: FlatDB<View>
}