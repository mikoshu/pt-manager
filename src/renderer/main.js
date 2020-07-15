import Vue from 'vue'
import App from './App'
import router from './router'
import { Button, Row, Col, Card, Link, Alert, MessageBox, Message, Loading, Dialog, Form, FormItem, Input, Tooltip  } from 'element-ui'
Vue.use(Button)
Vue.use(Row)
Vue.use(Col)
Vue.use(Card)
Vue.use(Link)
Vue.use(Alert)
Vue.use(Loading.directive);
Vue.use(Dialog)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Input)
Vue.use(Tooltip)
Vue.prototype.$msgbox = MessageBox;
Vue.prototype.$alert = MessageBox.alert;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;
Vue.prototype.$message = Message
Vue.prototype.$loading = Loading.service;

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
