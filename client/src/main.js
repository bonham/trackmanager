import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from 'vue'
// import './plugins/bootstrap-vue'
import App from './App.vue'
import router from './router'

// import { BootstrapVue } from 'bootstrap-vue'
import { LayoutPlugin, NavbarPlugin, ButtonPlugin, LinkPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(LayoutPlugin)
Vue.use(NavbarPlugin)
Vue.use(ButtonPlugin)
Vue.use(LinkPlugin)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
