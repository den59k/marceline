import { request } from "./request";

export type Form = {
  id: string,
  name: string,
  systemTable: string,
  idField: string,
  fields: FormItem[]
}

export type FormItem = {
  format?: string,
  enum?: { id: string, title: string }[],
  fieldId?: string,
  name?: string, 
  placeholder?: string,
  fileField?: string,
  jsonField?: string,
  isCustom?: boolean,
  modifiers?: string[],
  relationType?: string,
  aliasFieldId?: string,
  children?: FormItem[]
}

export const formsApi = {
  getAll: () => request<Form[]>("/api/admin/forms"),
  getForm: (formId: string | null) => request<Form>(`/api/admin/forms/${formId}`),

  createForm: (values: any) => request("/api/admin/forms", values),
  updateForm: (formId: string, values: any) => request(`/api/admin/forms/${formId}`, values),
  deleteForm: (formId: string) => request(`/api/admin/forms/${formId}`, {}, { method: "DELETE" })
}