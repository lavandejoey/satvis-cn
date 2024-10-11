/**
 * CesiumTimelineHelper.js
 *
 * 该文件定义了一个CesiumTimelineHelper类，用于管理Cesium时间轴。
 * 包括方法：
 * - clearHighlightRanges: 清除所有高亮范围
 * - addHighlightRanges: 添加高亮范围
 * - updateHighlightRanges: 更新高亮范围
 *
 */
import * as Cesium from "@cesium/engine";

export class CesiumTimelineHelper {
  static clearHighlightRanges(viewer) {
    // eslint-disable-next-line
    if (!viewer.timeline || viewer.timeline._highlightRanges.length === 0) {
      return;
    }
    // eslint-disable-next-line
    viewer.timeline._highlightRanges = [];
    viewer.timeline.updateFromClock();
    viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime);
  }

  static addHighlightRanges(viewer, ranges) {
    if (!viewer.timeline) {
      return;
    }
    ranges.forEach((range) => {
      const startJulian = Cesium.JulianDate.fromDate(new Date(range.start));
      const endJulian = Cesium.JulianDate.fromDate(new Date(range.end));
      const highlightRange = viewer.timeline.addHighlightRange(Cesium.Color.BLUE, 100, 0);
      highlightRange.setRange(startJulian, endJulian);
      viewer.timeline.updateFromClock();
      viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime);
    });
  }

  static updateHighlightRanges(viewer, ranges) {
    this.clearHighlightRanges(viewer);
    this.addHighlightRanges(viewer, ranges);
  }
}
