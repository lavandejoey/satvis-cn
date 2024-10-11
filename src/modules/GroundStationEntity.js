/**
 * GroundStationEntity.js
 *
 * 该文件定义了一个GroundStationEntity类，该类继承自CesiumComponentCollection类。
 * GroundStationEntity类用于创建地面站实体，包括地面站的图标和描述。
 * 其中方法包括：
 * - 创建地面站实体 “createEntities”
 * - 创建地面站图标 “createGroundStation”
 * - 创建地面站描述 “createDescription”
 * - 计算通过时间 “passes”
 * - 生成描述内容 “createDescription”
 */
import * as Cesium from "@cesium/engine";
import dayjs from "dayjs";
import { CesiumComponentCollection } from "./util/CesiumComponentCollection";
import { DescriptionHelper } from "./util/DescriptionHelper";

import icon from "../images/icons/dish.svg";

export class GroundStationEntity extends CesiumComponentCollection {
  constructor(viewer, sats, position) {
    super(viewer);
    this.sats = sats;

    this.name = "Ground station";
    this.position = position;

    this.createEntities();
  }

  createEntities() {
    this.createDescription();
    this.createGroundStation();
  }

  createGroundStation() {
    const billboard = new Cesium.BillboardGraphics({
      image: icon,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scaleByDistance: new Cesium.NearFarScalar(1e2, 0.2, 4e7, 0.1),
    });
    this.createCesiumEntity("Groundstation", "billboard", billboard, this.name, this.description, this.position.cartesian, false);
  }

  createDescription() {
    this.description = DescriptionHelper.cachedCallbackProperty((time) => {
      const passes = this.passes(time);
      const content = DescriptionHelper.renderDescription(time, this.name, this.position, passes, true);
      return content;
    });
  }

  passes(time, deltaHours = 48) {
    let passes = [];
    // Aggregate passes from all visible satellites
    this.sats.visibleSatellites.forEach((sat) => {
      sat.props.updatePasses(this.viewer.clock.currentTime);
      passes.push(...sat.props.passes);
    });

    // Filter passes based on time
    passes = passes.filter((pass) => dayjs(pass.start).diff(time, "hours") < deltaHours);

    // Sort passes by time
    passes = passes.sort((a, b) => a.start - b.start);
    return passes;
  }
}
