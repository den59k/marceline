import { defineStore } from "pinia";
import { makeRequest } from "vuesix";
import { viewsApi } from "../api/views";
import { HTTPError, setJwt } from "../api/request";
import { ref } from "vue";

const tokenKey = "marceline__accessToken"

export const useAccountStore = defineStore("account", () => {

  const status = ref<"init" | "authorized" | "not-authorized">("init")

  const init = async () => {
    const accessToken = window.localStorage.getItem(tokenKey)
    if (!accessToken) {
      status.value = "not-authorized"
      return
    }
    setJwt(accessToken)
    try {
      await makeRequest(viewsApi.getViews)
      status.value = "authorized"
    } catch(e) {
      if (e instanceof HTTPError && e.statusCode === 403) {
        status.value = "not-authorized"
        // window.localStorage.removeItem(tokenKey)
      } else {
        throw e
      }
    }
  }

  const authorize = (tokens: { accessToken: string, refreshToken?: string }) => {
    setJwt(tokens.accessToken)
    window.localStorage.setItem(tokenKey, tokens.accessToken)
    status.value = "authorized"
  }

  const logout = async () => {
    window.localStorage.removeItem(tokenKey)
    status.value = "not-authorized"
  }

  return {
    init,
    authorize,
    status,
    logout
  }
})