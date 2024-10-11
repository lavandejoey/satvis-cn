/**
 * CesiumCallbackHelper.js
 *
 * 该文件定义了一个CesiumCallbackHelper类，用于管理Cesium回调。
 * 包括方法：
 * - createPeriodicTickCallback: 创建周期性刻度回调
 * - createPeriodicTimeCallback: 创建周期性时间回调
 *
 */
import * as Cesium from "cesium";

export class CesiumCallbackHelper {
  /**
   * Register an event listener that will execute a callback every refreshRate ticks of clock time.
   * @param {Cesium.Viewer} viewer - Cesium viewer
   * @param {Function} callback - function to execute
   * @param {Number} refreshRate - in ticks
   * @param {Cesium.Event} event - event to listen to (e.g. viewer.clock.onTick)
   * @returns {Function} - function to remove the event listener
   */
  static createPeriodicTickCallback(viewer, refreshRate, callback, event = viewer.clock.onTick) {
    let ticks = 0;
    return event.addEventListener(() => {
      if (ticks < refreshRate) {
        ticks += 1;
        return;
      }
      callback(viewer.clock.currentTime);
      ticks = 0;
    });
  }

  /**
   * Register an event listener that will execute a callback every refreshRate seconds of clock time.
   * @param {Cesium.Viewer} viewer - Cesium viewer
   * @param {Function} callback - function to execute
   * @param {Number} refreshRate - in seconds
   * @param {Cesium.Event} event - event to listen to (e.g. viewer.clock.onTick)
   * @returns {Function} - function to remove the event listener
   */
  static createPeriodicTimeCallback(viewer, refreshRate, callback, event = viewer.clock.onTick) {
    let lastUpdated = viewer.clock.currentTime;
    return event.addEventListener(() => {
      const time = viewer.clock.currentTime;
      const delta = Math.abs(Cesium.JulianDate.secondsDifference(time, lastUpdated));
      if (delta < refreshRate) {
        return;
      }
      callback(time);
      lastUpdated = time;
    });
  }
}
