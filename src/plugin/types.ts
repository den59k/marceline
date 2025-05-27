import { PrismaClient } from "@prisma/client"
import { FlatDB } from "./flatdb"

export type ViewColumn = {
  name: string,
  systemColumn: string,
  format?: string
}

export type ViewFilter = {
  systemColumn: string, 
  format: string, 
  value?: any
}

export type View = {
  id: string,
  name: string,
  systemTable: string,
  idField?: string,
  actions?: string[],
  data: {
    create: { enabled: boolean, form?: string | null },
    edit: { enabled: boolean, form?: string | null },
    delete: { enabled: boolean },
  }
  columns: ViewColumn[],
  filters?: ViewFilter[],
  order?: number
}

export type FormField = {
  format?: string,
  enum?: { id: string, title: string }[],
  fieldId?: string,
  name?: string, 
  placeholder?: string,
  fileIdField?: string,
  jsonField?: string,
  isCustom?: boolean,
  children?: FormField[],
  modifiers?: string[],
  relationType?: string,
  aliasFieldId?: string,
  relationBridgeType?: string,
  relationBridgeFieldId?: string
  value?: any
  columns: Array<{ enabled: boolean, fieldId: string }>
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