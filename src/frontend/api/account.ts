import { request } from "./request";

export const accountApi = {
  login: (values: any) => request("/api/admin/login", values),
  logout: () => request("/api/admin/logout", {})
}