import { createApp, markRaw } from "vue";
import { createPinia } from "pinia";
import { Workbox } from "workbox-window";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import Tooltip from "primevue/tooltip";
import Toast from "vue-toastification";
import * as Sentry from "@sentry/browser";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faLayerGroup, faGlobeAfrica, faMobileAlt, faHammer, faEye } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import App from "./App.vue";
import router from "./components/Router";
import piniaUrlSync from "./modules/util/pinia-plugin-url-sync";
import { CesiumController } from "./modules/CesiumController";

function satvisSetup(customConfig = {}) {
  // 如果当前页面是 satvis.space 域名下的生产环境，启用 Sentry 进行错误监控和追踪
  if (window.location.href.includes("satvis.space")) {
    Sentry.init({ dsn: "https://6c17c8b3e731026b3e9e0df0ecfc1b83@o294643.ingest.us.sentry.io/1541793" });
  }

  // 初始化 Vue 应用
  const app = createApp(App); // 创建 Vue 应用实例
  const cc = new CesiumController(); // 创建 CesiumController 实例，用于管理 3D 地图相关的逻辑
  app.config.globalProperties.cc = cc; // 将 CesiumController 实例绑定到全局属性，方便在其他组件中访问

  // 创建 Pinia 状态管理实例
  const pinia = createPinia();
  pinia.use(({ store }) => { store.router = markRaw(router); }); // 将路由对象添加到每个 store 中，markRaw 用于确保对象不会被 Vue 转化为响应式
  pinia.use(({ store }) => { store.customConfig = markRaw(customConfig); }); // 将自定义配置传递给每个 store
  pinia.use(piniaUrlSync); // 启用自定义的 Pinia 插件，用于同步 URL 和状态

  // 注册插件和组件到应用中
  app.use(pinia); // 使用 Pinia 进行状态管理
  app.use(router); // 使用路由
  app.use(PrimeVue, { // 使用 PrimeVue UI 组件库
    theme: {
      preset: Aura, // 使用 Aura 主题
    },
  });
  app.directive("tooltip", Tooltip); // 全局注册 Tooltip 指令
  app.use(Toast, { // 使用 Toast 插件，用于显示消息提示
    position: "bottom-right", // 消息提示显示在右下角
  });

  // 注册 FontAwesome 图标库和组件
  library.add(faLayerGroup, faGlobeAfrica, faMobileAlt, faHammer, faEye, faGithub); // 添加所需的 FontAwesome 图标
  app.component("FontAwesomeIcon", FontAwesomeIcon); // 注册 FontAwesome 图标组件

  // 挂载 Vue 应用到 DOM
  app.mount("#app"); // 将 Vue 应用挂载到 id 为 'app' 的 DOM 元素

  // 注册 Service Worker，用于支持离线功能和 PWA（渐进式 Web 应用）
  if ("serviceWorker" in navigator && !window.location.href.includes("localhost")) {
    // 检查当前环境是否支持 Service Worker 且非本地开发环境
    const wb = new Workbox("sw.js"); // 创建 Workbox 实例，使用 'sw.js' 文件作为 Service Worker
    wb.addEventListener("controlling", (evt) => {
      // 如果 Service Worker 控制权发生变化（更新），则重新加载页面以使用最新的内容
      if (evt.isUpdate) {
        console.log("Reloading page for latest content"); // 输出提示信息
        window.location.reload(); // 重新加载页面
      }
    });
    wb.register(); // 注册 Service Worker
  }

  return { app, cc }; // 返回应用和 CesiumController 实例，便于其他地方访问
}

export default satvisSetup; // 导出该函数，作为默认导出，用于在其他文件中调用
