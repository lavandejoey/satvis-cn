/**
 * CesiumSampledPositionRawValueAccess.js
 *
 * 该文件定义了一个SampledPositionProperty类的扩展，用于获取原始值。
 * 包括方法：
 * - getRawValues: 获取指定时间范围内的原始值
 * - length: 获取样本属性中存储的样本数
 *
 */
import { SampledPositionProperty, binarySearch, JulianDate } from "cesium";
/* eslint-disable func-names, no-underscore-dangle, no-bitwise */

/**
 * Gets the original values stored in the sampled property for the provided timeframe.
 *
 * @param {JulianDate} start The start time for which to retrieve the values.
 * @param {JulianDate} end The end time for which to retrieve the values.
 * @returns {object} An array of all values within the provided timeframe.
 */
SampledPositionProperty.prototype.getRawValues = function (start, end) {
  const times = this._property._times;
  if (times.length === 0) {
    return [];
  }
  const innerType = this._property._innerType;
  const values = this._property._values;

  let startIndex = binarySearch(times, start, JulianDate.compare);
  let endIndex = binarySearch(times, end, JulianDate.compare);
  if (startIndex < 0) {
    startIndex = ~startIndex;
  }
  if (endIndex < 0) {
    endIndex = ~endIndex;
  }
  const result = [];
  for (let i = startIndex; i < endIndex; i += 1) {
    result.push(innerType.unpack(values, i * innerType.packedLength));
  }
  return result;
};

/**
 * Gets the number of samples stored in the sampled property.
 *
 * @returns {number} The number of samples stored in the sampled property.
 */
SampledPositionProperty.prototype.length = function () {
  return this._property._times.length;
};
