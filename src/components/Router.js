import { createRouter, createWebHistory } from "vue-router";

import Satvis from "./Satvis.vue";

export default createRouter({
  // 建立路由对象
  history: createWebHistory(document.location.pathname.match(".*/")[0]),
  routes: [
    { path: "/", component: Satvis },
    { path: "/move.html", component: Satvis },
    { path: "/ot.html", component: Satvis },
  ],
});
