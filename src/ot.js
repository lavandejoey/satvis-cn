/**
 * ot.js
 *
 * 该文件定义了一个satvisSetup函数，用于初始化satvis的配置。
 */
import satvisSetup from "./app";

const { cc } = satvisSetup({
  sat: {
    enabledTags: ["OT"],
    enabledComponents: ["Point", "Label", "Orbit", "Sensor cone"],
  },
  cesium: {
    layers: ["ArcGis"],
  },
});

cc.sats.addFromTleUrls([
  ["data/tle/ot.txt", ["OT"]],
  ["data/tle/otc.txt", ["OTC"]],
  ["data/tle/wfs.txt", ["WFS"]],
  ["data/tle/groups/globalstar.txt", ["Globalstar"]],
  ["data/tle/groups/iridium-NEXT.txt", ["IridiumNEXT"]],
  ["data/tle/groups/planet.txt", ["Planet"]],
  ["data/tle/groups/spire.txt", ["Spire"]],
]);
