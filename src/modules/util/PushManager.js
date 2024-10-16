/**
 * PushManager.js
 *
 * 该文件定义了一个PushManager类，用于管理浏览器推送通知。
 * 包括方法：
 * - available: 判断浏览器是否支持推送通知
 * - requestPermission: 请求推送通知权限
 * - active: 判断是否存在定时器
 * - clearTimers: 清除所有定时器
 * - persistentNotification: 发送持久通知
 * - notifyInMs: 在指定时间后发送通知
 * - notifyAtDate: 在指定日期时间发送通知
 *
 */
import dayjs from "dayjs";

export class PushManager {
  constructor(options = {}) {
    this.options = options;
    this.timers = [];
  }

  get available() {
    if ("webkit" in window) {
      return true;
    }
    if (!("Notification" in window) || !("ServiceWorkerRegistration" in window)) {
      console.log("Notification API not supported!");
      return false;
    }
    switch (Notification.permission) {
      case "granted":
        return true;
      case "default":
        this.requestPermission();
        return true;
      case "denied":
        return false;
      default:
        return false;
    }
  }

  requestPermission() {
    Notification.requestPermission((result) => {
      console.log(`Notifcation permission result: ${result}`);
    });
  }

  get active() {
    return this.timers.length > 0;
  }

  clearTimers() {
    this.timers.forEach((timer) => {
      clearTimeout(timer.id);
    });
    this.timers = [];
  }

  persistentNotification(message, options) {
    if (!this.available) {
      return;
    }
    const optionsMerged = { ...this.options, ...options };
    try {
      navigator.serviceWorker.getRegistration()
        .then((reg) => reg.showNotification(message, optionsMerged))
        .catch((err) => console.log(`Service Worker registration error: ${err}`));
    } catch (err) {
      console.log(`Notification API error: ${err}`);
    }
  }

  notifyInMs(ms, message, options) {
    if (!this.available) {
      return;
    }
    console.log(`Notify "${message}" in ${ms / 1000}s`);
    setTimeout(() => { this.persistentNotification(message, options); }, ms);
  }

  notifyAtDate(date, message, options) {
    if (!this.available) {
      return;
    }
    const waitMs = dayjs(date).diff(dayjs());
    if (waitMs < 0) {
      return;
    }
    if (this.timers.some((timer) => Math.abs(timer.date.diff(date, "seconds")) < 10)) {
      console.log("Ignore duplicate entry");
      return;
    }
    console.log(`Notify "${message}" at ${date}s ${dayjs(date).unix()}`);

    if ("webkit" in window) {
      const content = {
        date: dayjs(date).unix(),
        delay: waitMs / 1000,
        message,
      };
      window.webkit.messageHandlers.iosNotify.postMessage(content);
    } else {
      const id = setTimeout(() => { this.persistentNotification(message, options); }, waitMs);
      this.timers.push({
        id,
        date,
        message,
      });
    }
  }
}
