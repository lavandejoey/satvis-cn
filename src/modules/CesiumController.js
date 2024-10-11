/**
 * CesiumController.js
 *
 * 该文件定义了 CesiumController 类，用于管理和控制 Cesium 视图及其交互。
 * 其中包括的方法有：
 * - 初始化常量，包括图像和地形提供者等 "initConstants"
 * - 预加载参考框架数据，用于精确的空间计算 "preloadReferenceFrameData"
 * - 获取图像提供者和地形提供者的名称列表 "imageryProviderNames" 和 "terrainProviderNames"
 * - 设置图像图层 "imageryLayers" 和 "clearImageryLayers"
 * - 设置地形提供者 "terrainProvider" 和 "updateTerrainProvider"
 * - 设置场景模式 "sceneMode"
 * - 跳转到指定位置 "jumpTo"
 * - 设置相机模式 "cameraMode"
 * - 设置时间 "setTime"
 * - 创建输入事件处理器 "createInputHandler"
 * - 从点击事件设置地面站 "setGroundStationFromClickEvent"
 * - 从地理位置设置地面站 "setGroundStationFromGeolocation"
 * - 从经纬度设置地面站 "setGroundStationFromLatLon"
 * - 设置 UI 显示 "showUI"
 * - 修复 Cesium 标志位置 "fixLogo"
 * - 设置质量预设 "qualityPreset"
 * - 显示 FPS "showFps"
 * - 设置背景 "background"
 * - 启用性能统计 "enablePerformanceStats"
 * - 添加错误处理器 "addErrorHandler"
 * - 样式化信息框 "styleInfoBox"
 */

import * as Cesium from "@cesium/engine";  // 导入 Cesium 引擎，用于处理 3D 地球和空间相关的可视化
import { Viewer } from "@cesium/widgets";  // 导入 Cesium 的 Viewer 类，用于初始化和管理 Cesium 视图
import dayjs from "dayjs";  // 导入 dayjs 库，用于日期和时间的处理
import utc from "dayjs/plugin/utc";  // 导入 dayjs 的 UTC 插件，用于处理 UTC 时间
import * as Sentry from "@sentry/browser";  // 导入 Sentry，用于监控错误和异常情况
import { icon } from "@fortawesome/fontawesome-svg-core";  // 导入 FontAwesome 的图标生成函数
import { faBell, faInfo } from "@fortawesome/free-solid-svg-icons";  // 导入 FontAwesome 的两个图标：通知铃铛和信息图标

import { DeviceDetect } from "./util/DeviceDetect";  // 导入设备检测工具类，用于判断设备类型或环境
import { CesiumPerformanceStats } from "./util/CesiumPerformanceStats";  // 导入 Cesium 性能统计工具，用于监控和记录 Cesium 的性能
import { SatelliteManager } from "./SatelliteManager";  // 导入卫星管理器类，用于管理和控制卫星数据
import { useCesiumStore } from "../stores/cesium";  // 从 Pinia 状态管理中导入 Cesium 的 store，处理应用状态
import infoBoxCss from "../css/infobox.ecss";  // 导入 infobox 的样式文件，用于自定义信息框的样式

dayjs.extend(utc);  // 扩展 dayjs 以支持 UTC 时间处理

export class CesiumController {  // 导出 CesiumController 类，负责管理和控制 Cesium 视图及其交互
  constructor() {
    this.initConstants();  // 初始化常量，包括图像和地形提供者等
    this.preloadReferenceFrameData();  // 预加载参考框架数据，用于精确的空间计算
    this.minimalUI = DeviceDetect.inIframe() || DeviceDetect.isIos();  // 检测当前设备是否是 iOS 或嵌入在 iframe 中，以决定是否启用简化的 UI

    // 初始化 Cesium Viewer 实例，提供 3D 地球视图
    this.viewer = new Viewer("cesiumContainer", {
      animation: !this.minimalUI,  // 动画是否启用，简化 UI 时禁用
      baseLayer: this.createImageryLayer("OfflineHighres"),  // 设置默认底图图层
      baseLayerPicker: false,  // 禁用底图选择器
      fullscreenButton: !this.minimalUI,  // 简化 UI 时禁用全屏按钮
      fullscreenElement: document.body,  // 设置全屏元素为整个文档
      geocoder: false,  // 禁用地理编码器
      homeButton: false,  // 禁用 Home 按钮
      navigationHelpButton: false,  // 禁用导航帮助按钮
      navigationInstructionsInitiallyVisible: false,  // 隐藏导航指示
      sceneModePicker: false,  // 禁用场景模式选择器（2D/3D 切换）
      selectionIndicator: false,  // 禁用选中指示器
      timeline: !this.minimalUI,  // 简化 UI 时禁用时间轴
      vrButton: !this.minimalUI,  // 简化 UI 时禁用 VR 按钮
      contextOptions: {
        webgl: {
          alpha: true,  // 设置 WebGL 上下文为透明背景
        },
      },
    });

    // Cesium 默认设置
    this.viewer.clock.shouldAnimate = true;  // 让 Cesium 时钟动画保持运行
    this.viewer.scene.globe.enableLighting = true;  // 启用地球的动态光照
    this.viewer.scene.highDynamicRange = true;  // 启用高动态范围（HDR）渲染
    this.viewer.scene.maximumRenderTimeChange = 1 / 30;  // 限制渲染时间变化，保持帧率稳定
    this.viewer.scene.requestRenderMode = true;  // 启用请求渲染模式，仅在需要时渲染

    // 性能调试工具（可以启用以监控帧率等信息）
    // this.viewer.scene.debugShowFramesPerSecond = true;  // 显示 FPS
    // this.FrameRateMonitor = Cesium.FrameRateMonitor.fromScene(this.viewer.scene);  // 创建帧率监控器
    // this.viewer.scene.postRender.addEventListener((scene) => {
    //   console.log(this.FrameRateMonitor.lastFramesPerSecond);  // 输出帧率
    // });
    // this.enablePerformanceLogger(true);  // 启用性能日志记录

    // 在窗口对象上导出 CesiumController，方便调试
    window.cc = this;

    // CesiumController 的配置
    this.sceneModes = ["3D", "2D", "Columbus"];  // 支持的场景模式
    this.cameraModes = ["Fixed", "Inertial"];  // 支持的相机模式

    this.createInputHandler();  // 创建输入事件处理器
    this.addErrorHandler();  // 添加错误处理器，用于捕获和报告渲染错误
    this.styleInfoBox();  // 样式化信息框

    // 创建卫星管理器
    this.sats = new SatelliteManager(this.viewer);

    // 当应用不嵌入在 iframe 中时，添加隐私政策链接到版权信息中
    if (!DeviceDetect.inIframe()) {
      this.viewer.creditDisplay.addStaticCredit(new Cesium.Credit(`<a href="/privacy.html" target="_blank"><u>Privacy</u></a>`, true));
    }
    this.viewer.creditDisplay.addStaticCredit(new Cesium.Credit(`卫星 TLE 数据由 <a href="https://celestrak.org/NORAD/elements/" target="_blank"><u>Celestrak</u></a> 提供`));

    // 如果使用简化的 UI 模式，修复 Cesium 标志位置
    if (this.minimalUI) {
      setTimeout(() => { this.fixLogo(); }, 2500);
    }

    this.activeLayers = [];  // 用于跟踪当前启用的图层
  }

  initConstants() {
    // 初始化 Cesium 中图像提供者和地形提供者的常量配置
    this.imageryProviders = {
      Offline: {
        create: () => Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")),  // 使用 Cesium 的默认 NaturalEarthII 图像
        alpha: 1,
        base: true,  // 设置为基础图层
      },
      OfflineHighres: {
        create: () => Cesium.TileMapServiceImageryProvider.fromUrl("data/cesium-assets/imagery/NaturalEarthII", {
          maximumLevel: 5,  // 最大缩放级别为 5
          credit: "Imagery courtesy Natural Earth",  // 图像版权说明
        }),
        alpha: 1,
        base: true,
      },
      ArcGis: {
        create: () => Cesium.ArcGisMapServerImageryProvider.fromUrl("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"),  // 使用 ArcGIS 图像服务
        alpha: 1,
        base: true,
      },
      OSM: {
        create: () => new Cesium.OpenStreetMapImageryProvider({
          url: "https://a.tile.openstreetmap.org/",  // 使用 OpenStreetMap 提供的瓦片图层
        }),
        alpha: 1,
        base: true,
      },
      Topo: {
        create: () => new Cesium.UrlTemplateImageryProvider({
          url: "https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}@2x.png?key=tiHE8Ed08u6ZoFjbE32Z",  // 使用 MapTiler 的 Topo 地图
          credit: `<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>`,  // 图层版权信息
        }),
        alpha: 1,
        base: true,
      },
      BlackMarble: {
        create: () => new Cesium.WebMapServiceImageryProvider({
          url: "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi",  // 使用 NASA 提供的黑色大理石图层
          layers: "VIIRS_Black_Marble",
          style: "default",
          tileMatrixSetID: "250m",
          format: "image/png",
          tileWidth: 512,
          tileHeight: 512,
          credit: "NASA Global Imagery Browse Services for EOSDIS",  // 图像来源说明
        }),
        alpha: 1,
        base: true,
      },
      Tiles: {
        create: () => new Cesium.TileCoordinatesImageryProvider(),  // 使用瓦片坐标图层
        alpha: 1,
        base: false,
      },
      "GOES-IR": {
        create: () => new Cesium.WebMapServiceImageryProvider({
          url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?",
          layers: "goes_conus_ir",  // 使用 GOES-IR 图层，显示红外数据
          credit: "Infrared data courtesy Iowa Environmental Mesonet",  // 图层版权说明
          parameters: {
            transparent: "true",
            format: "image/png",
          },
        }),
        alpha: 0.5,
        base: false,
      },
      Nextrad: {
        create: () => new Cesium.WebMapServiceImageryProvider({
          url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?",
          layers: "nexrad-n0r",  // 使用 Nextrad 图层，显示雷达数据
          credit: "US Radar data courtesy Iowa Environmental Mesonet",  // 图层版权说明
          parameters: {
            transparent: "true",
            format: "image/png",
          },
        }),
        alpha: 0.5,
        base: false,
      },
    };
    this.terrainProviders = {
      None: {
        create: () => new Cesium.EllipsoidTerrainProvider(),  // 不使用地形，使用默认的椭球体
      },
      Maptiler: {
        create: () => Cesium.CesiumTerrainProvider.fromUrl("https://api.maptiler.com/tiles/terrain-quantized-mesh/?key=tiHE8Ed08u6ZoFjbE32Z", {
          credit: "<a href=\"https://www.maptiler.com/copyright/\" target=\"_blank\">© MapTiler</a> <a href=\"https://www.openstreetmap.org/copyright/\" target=\"_blank\">© OpenStreetMap contributors</a>",  // 地形提供者版权说明
          requestVertexNormals: true,  // 请求顶点法线以提高渲染质量
        }),
      },
      ArcGIS: {
        create: () => Cesium.ArcGISTiledElevationTerrainProvider.fromUrl("https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"),  // 使用 ArcGIS 的地形数据
        visible: false,
      },
    };
  }

  preloadReferenceFrameData() {
    // 预加载未来 180 天的参考框架数据，用于精确计算
    const timeInterval = new Cesium.TimeInterval({
      start: Cesium.JulianDate.addDays(Cesium.JulianDate.now(), -60, new Cesium.JulianDate()),  // 开始时间为当前时间的前 60 天
      stop: Cesium.JulianDate.addDays(Cesium.JulianDate.now(), 120, new Cesium.JulianDate()),  // 结束时间为当前时间的后 120 天
    });
    Cesium.Transforms.preloadIcrfFixed(timeInterval).then(() => {
      console.log("参考框架数据已加载");
    });
  }

  get imageryProviderNames() {
    return Object.keys(this.imageryProviders);  // 返回 imageryProviders 对象中所有图像提供者的名称列表
  }

  get baseLayers() {
    // 返回所有基础图层的名称列表
    return Object.entries(this.imageryProviders).filter(([, val]) => val.base).map(([key]) => key);
  }

  get overlayLayers() {
    // 返回所有叠加图层的名称列表
    return Object.entries(this.imageryProviders).filter(([, val]) => !val.base).map(([key]) => key);
  }

  set imageryLayers(newLayerNames) {
    this.clearImageryLayers(); // 清除所有图像图层
    newLayerNames.forEach((layerName) => {
      const [name, alpha] = layerName.split("_");
      const layer = this.createImageryLayer(name, alpha);
      if (layer) {
        this.viewer.scene.imageryLayers.add(layer);
      }
    });
  }

  clearImageryLayers() {
    this.viewer.scene.imageryLayers.removeAll();
  }

  createImageryLayer(imageryProviderName, alpha) {
    if (!this.imageryProviderNames.includes(imageryProviderName)) {
      console.error("Unknown imagery layer");
      return false;
    }

    const provider = this.imageryProviders[imageryProviderName];
    const layer = Cesium.ImageryLayer.fromProviderAsync(provider.create());
    if (alpha === undefined) {
      layer.alpha = provider.alpha;
    } else {
      layer.alpha = alpha;
    }
    return layer;
  }

  get terrainProviderNames() {
    return Object.entries(this.terrainProviders).filter(([, val]) => val.visible ?? true).map(([key]) => key);
  }

  set terrainProvider(terrainProviderName) {
    this.updateTerrainProvider(terrainProviderName);
  }

  async updateTerrainProvider(terrainProviderName) {
    if (!this.terrainProviderNames.includes(terrainProviderName)) {
      console.error("Unknown terrain provider");
      return;
    }

    const provider = await this.terrainProviders[terrainProviderName].create();
    this.viewer.terrainProvider = provider;
  }

  set sceneMode(sceneMode) {
    switch (sceneMode) {
      case "3D":
        this.viewer.scene.morphTo3D();
        break;
      case "2D":
        this.viewer.scene.morphTo2D();
        break;
      case "Columbus":
        this.viewer.scene.morphToColumbusView();
        break;
      default:
        console.error("Unknown scene mode");
    }
  }

  jumpTo(location) {
    switch (location) {
      case "Everest": {
        const target = new Cesium.Cartesian3(300770.50872389384, 5634912.131394585, 2978152.2865545116);
        const offset = new Cesium.Cartesian3(6344.974098678562, -793.3419798081741, 2499.9508860763162);
        this.viewer.camera.lookAt(target, offset);
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        break;
      }
      case "HalfDome": {
        const target = new Cesium.Cartesian3(-2489625.0836225147, -4393941.44443024, 3882535.9454173897);
        const offset = new Cesium.Cartesian3(-6857.40902037546, 412.3284835694358, 2147.5545426812023);
        this.viewer.camera.lookAt(target, offset);
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        break;
      }
      default:
        console.error("Unknown location");
    }
  }

  set cameraMode(cameraMode) {
    switch (cameraMode) {
      case "Inertial":
        this.viewer.scene.postUpdate.addEventListener(this.cameraTrackEci);
        break;
      case "Fixed":
        this.viewer.scene.postUpdate.removeEventListener(this.cameraTrackEci);
        break;
      default:
        console.error("Unknown camera mode");
    }
  }

  cameraTrackEci(scene, time) {
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
      return;
    }

    const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
    if (Cesium.defined(icrfToFixed)) {
      const { camera } = scene;
      const offset = Cesium.Cartesian3.clone(camera.position);
      const transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
      camera.lookAtTransform(transform, offset);
    }
  }

  setTime(current, start = dayjs.utc(current).subtract(12, "hour").toISOString(), stop = dayjs.utc(current).add(7, "day").toISOString()) {
    this.viewer.clock.startTime = Cesium.JulianDate.fromIso8601(dayjs.utc(start).toISOString());
    this.viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(dayjs.utc(stop).toISOString());
    this.viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(dayjs.utc(current).toISOString());
    if (typeof this.viewer.timeline !== "undefined") {
      this.viewer.timeline.updateFromClock();
      this.viewer.timeline.zoomTo(this.viewer.clock.startTime, this.viewer.clock.stopTime);
    }
  }

  createInputHandler() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((event) => {
      const { pickMode } = useCesiumStore();
      if (!pickMode) {
        return;
      }
      this.setGroundStationFromClickEvent(event);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  setGroundStationFromClickEvent(event) {
    const cartesian = this.viewer.camera.pickEllipsoid(event.position);
    const didHitGlobe = Cesium.defined(cartesian);
    if (didHitGlobe) {
      const coordinates = {};
      const cartographicPosition = Cesium.Cartographic.fromCartesian(cartesian);
      coordinates.longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
      coordinates.latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);
      coordinates.height = Cesium.Math.toDegrees(cartographicPosition.height);
      coordinates.cartesian = cartesian;
      this.sats.setGroundStation(coordinates);
      useCesiumStore().pickMode = false;
    }
  }

  setGroundStationFromGeolocation() {
    navigator.geolocation.getCurrentPosition((position) => {
      if (typeof position === "undefined") {
        return;
      }
      const coordinates = {};
      coordinates.longitude = position.coords.longitude;
      coordinates.latitude = position.coords.latitude;
      coordinates.height = position.coords.altitude;
      coordinates.cartesian = Cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, coordinates.height);
      this.sats.setGroundStation(coordinates);
    });
  }

  setGroundStationFromLatLon(lat, lon, height = 0) {
    if (!lat || !lon) {
      return;
    }
    const coordinates = {
      longitude: lon,
      latitude: lat,
      height,
    };
    coordinates.longitude = lon;
    coordinates.latitude = lat;
    coordinates.height = height;
    coordinates.cartesian = Cesium.Cartesian3.fromDegrees(coordinates.longitude, coordinates.latitude, coordinates.height);
    this.sats.setGroundStation(coordinates);
  }

  set showUI(enabled) {
    if (enabled) {
      /* eslint-disable no-underscore-dangle */
      this.viewer._animation.container.style.visibility = "";
      this.viewer._timeline.container.style.visibility = "";
      this.viewer._fullscreenButton._container.style.visibility = "";
      this.viewer._vrButton._container.style.visibility = "";
      this.viewer._bottomContainer.style.left = this.oldBottomContainerStyleLeft;
      this.viewer._bottomContainer.style.bottom = "30px";
    } else {
      this.viewer._animation.container.style.visibility = "hidden";
      this.viewer._timeline.container.style.visibility = "hidden";
      this.viewer._fullscreenButton._container.style.visibility = "hidden";
      this.viewer._vrButton._container.style.visibility = "hidden";
      this.oldBottomContainerStyleLeft = this.viewer._bottomContainer.style.left;
      this.viewer._bottomContainer.style.left = "5px";
      this.viewer._bottomContainer.style.bottom = "0px";
      /* eslint-enable no-underscore-dangle */
    }
  }

  get showUI() {
    // eslint-disable-next-line
    return this.viewer._timeline.container.style.visibility !== "hidden";
  }

  fixLogo() {
    if (this.minimalUI) {
      // eslint-disable-next-line
      this.viewer._bottomContainer.style.left = "5px";
    }
    if (DeviceDetect.isiPhoneWithNotchVisible()) {
      // eslint-disable-next-line
      this.viewer._bottomContainer.style.bottom = "20px";
    }
  }

  set qualityPreset(quality) {
    switch (quality) {
      case "low":
        // Ignore browser's device pixel ratio and use CSS pixels instead of device pixels for render resolution
        this.viewer.useBrowserRecommendedResolution = true;
        break;
      case "high":
        // Use browser's device pixel ratio for render resolution
        this.viewer.useBrowserRecommendedResolution = false;
        break;
      default:
        console.error("Unknown quality preset");
    }
  }

  set showFps(value) {
    cc.viewer.scene.debugShowFramesPerSecond = value;
  }

  set background(active) {
    if (!active) {
      this.viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
      this.viewer.scene.moon = undefined;
      this.viewer.scene.skyAtmosphere = undefined;
      this.viewer.scene.skyBox = undefined;
      this.viewer.scene.sun = undefined;
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
      document.getElementById("cesiumContainer").style.background = "transparent";
    }
  }

  enablePerformanceStats(logContinuously = false) {
    this.performanceStats = new CesiumPerformanceStats(this.viewer.scene, logContinuously);
  }

  addErrorHandler() {
    // Rethrow scene render errors
    this.viewer.scene.rethrowRenderErrors = true;
    this.viewer.scene.renderError.addEventListener((scene, error) => {
      console.error(scene, error);
      Sentry.captureException(error);
    });

    // Proxy and log CesiumWidget render loop errors that only display a UI error message
    const widget = this.viewer.cesiumWidget;
    const proxied = widget.showErrorPanel;
    widget.showErrorPanel = function widgetError(title, message, error) {
      proxied.apply(this, [title, message, error]);
      Sentry.captureException(error);
    };
  }

  styleInfoBox() {
    const infoBox = this.viewer.infoBox.container.getElementsByClassName("cesium-infoBox")[0];
    const close = this.viewer.infoBox.container.getElementsByClassName("cesium-infoBox-close")[0];
    if (infoBox && close) {
      // Container for additional buttons
      const container = document.createElement("div");
      container.setAttribute("class", "cesium-infoBox-container");
      infoBox.insertBefore(container, close);

      // Notify button
      const notifyButton = document.createElement("button");
      notifyButton.setAttribute("type", "button");
      notifyButton.setAttribute("class", "cesium-button cesium-infoBox-custom");
      notifyButton.innerHTML = icon(faBell).html;
      notifyButton.addEventListener("click", () => {
        if (this.sats.selectedSatellite) {
          this.sats.getSatellite(this.sats.selectedSatellite).props.notifyPasses();
        } else if (this.sats.groundStationAvailable && this.sats.groundStation.isSelected) {
          this.sats.enabledSatellites.forEach((sat) => {
            sat.props.notifyPasses();
          });
        }
      });
      container.appendChild(notifyButton);

      // Info button
      const infoButton = document.createElement("button");
      infoButton.setAttribute("type", "button");
      infoButton.setAttribute("class", "cesium-button cesium-infoBox-custom");
      infoButton.innerHTML = icon(faInfo).html;
      infoButton.addEventListener("click", () => {
        if (!this.sats.selectedSatellite) {
          return;
        }
        const { satnum } = this.sats.getSatellite(this.sats.selectedSatellite).props;
        const url = `https://www.n2yo.com/satellite/?s=${satnum}`;
        window.open(url, "_blank", "noopener");
      });
      container.appendChild(infoButton);
    }

    const { frame } = this.viewer.infoBox;
    frame.addEventListener("load", () => {
      // Inline infobox css as iframe does not use service worker
      const { head } = frame.contentDocument;
      const links = head.getElementsByTagName("link");
      [...links].forEach((link) => {
        head.removeChild(link);
      });

      const style = frame.contentDocument.createElement("style");
      const css = infoBoxCss.toString();
      const node = document.createTextNode(css);
      style.appendChild(node);
      head.appendChild(style);
    }, false);

    // Allow js in infobox
    frame.setAttribute("sandbox", "allow-same-origin allow-popups allow-forms allow-scripts");
    frame.setAttribute("allowTransparency", "true");
    frame.src = "about:blank";

    // Allow time changes from infobox
    window.addEventListener("message", (e) => {
      const pass = e.data;
      if ("start" in pass) {
        this.setTime(pass.start);
      }
    });
  }
}
