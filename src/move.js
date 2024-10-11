/**
 * move.js
 *
 * 该文件定义了一个satvisSetup函数，用于初始化satvis的配置。
 */
import satvisSetup from "./app";

const { cc } = satvisSetup({
  sat: {
    enabledTags: ["MOVE"],
  },
});

cc.sats.addFromTleUrl("data/tle/move.txt", ["MOVE"]);
