
type RegisterPageEvent = { path: string, name?: string, icon?: string, component?: any }

const registerPageEvents: ((e: RegisterPageEvent) => void)[] = []
export const addRegisterPageEvent = (callback: (e: RegisterPageEvent) => void) => {
  registerPageEvents.push(callback)
}

export const marceline = {
  registerPage(e: any) {
    for (let callback of registerPageEvents) {
      callback(e)
    }
  }
}

// @ts-ignore
window.marceline = marceline