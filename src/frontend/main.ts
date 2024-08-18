import { createApp } from 'vue'
import './styles/global.sass'
// import './utils/setup'
import App from './App.vue'
import { createPinia } from 'pinia'
// import { registerComponents } from './registerComponents'
import { router } from './router'

createApp(App)
  .use(createPinia())
  .use(router)
  // .use(registerComponents)
  .mount('#app')
