/**
 * sat.js
 *
 * 该文件定义了一个SatStore变量，用于管理卫星的状态。
 */
import { defineStore } from "pinia";

export const useSatStore = defineStore("sat", {
  state: () => ({
    enabledComponents: ["Point", "Label"],
    availableSatellitesByTag: [],
    availableTags: [],
    enabledSatellites: [],
    enabledTags: [],
    groundstation: [],
    trackedSatellite: "",
  }),
  urlsync: {
    enabled: true,
    config: [{
      name: "enabledComponents",
      url: "elements",
      serialize: (v) => v.join(",").replaceAll(" ", "-"),
      deserialize: (v) => v.replaceAll("-", " ").split(",").filter((e) => e),
      default: ["Point", "Label"],
    }, {
      name: "enabledSatellites",
      url: "sats",
      serialize: (v) => v.join(",").replaceAll(" ", "~"),
      deserialize: (v) => v.replaceAll("~", " ").split(",").filter((e) => e),
      default: [],
    }, {
      name: "enabledTags",
      url: "tags",
      serialize: (v) => v.join(",").replaceAll(" ", "-"),
      deserialize: (v) => v.replaceAll("-", " ").split(",").filter((e) => e),
      default: [],
    }, {
      name: "groundstation",
      url: "gs",
      serialize: (v) => v.map((c) => c.toFixed(4)).join(","),
      deserialize: (v) => v.split(",").map((c) => parseFloat(c, 10)),
      default: [],
    }, {
      name: "trackedSatellite",
      url: "track",
      default: "",
    }],
  },
});
