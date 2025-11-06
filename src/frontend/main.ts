import { createApp } from 'vue'
import './styles/global.sass'
// import './utils/setup'
import App from './App.vue'
import { createPinia } from 'pinia'
// import { registerComponents } from './registerComponents'
import { router } from './router'
import dayjs from 'dayjs'
import ruLocale from 'dayjs/locale/ru'
dayjs.locale(ruLocale)

const app = createApp(App)
  .use(createPinia())
  .use(router)
  // .use(registerComponents)
  .mount('#app')

