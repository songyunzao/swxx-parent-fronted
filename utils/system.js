// utils/system.js —— 系统尺寸工具
//
// 自定义导航栏（navigationStyle: custom）下，小程序不会自动留出
// 顶部状态栏（时间/电量/信号）的空间，页面第一个元素会顶到屏幕最顶端，
// 与系统状态栏重叠。每个页面顶部需要加一个等高占位块。
//
// 本模块统一获取状态栏高度并缓存，供各页面 setData 注入。

let cachedStatusBarHeight = null;

// 返回状态栏高度，单位 px
function getStatusBarHeight() {
  if (cachedStatusBarHeight != null) return cachedStatusBarHeight;
  try {
    const info = wx.getWindowInfo
      ? wx.getWindowInfo()
      : wx.getSystemInfoSync();
    cachedStatusBarHeight = info.statusBarHeight || 20;
  } catch (e) {
    cachedStatusBarHeight = 20; // 兜底
  }
  return cachedStatusBarHeight;
}

// 返回状态栏高度，单位 rpx（页面样式用）
function getStatusBarHeightRpx() {
  // px → rpx：750rpx / 窗口宽度px。多数设备约 2x。
  let ratio = 2;
  try {
    const info = wx.getWindowInfo
      ? wx.getWindowInfo()
      : wx.getSystemInfoSync();
    ratio = 750 / (info.windowWidth || 375);
  } catch (e) {
    ratio = 2;
  }
  return Math.round(getStatusBarHeight() * ratio);
}

module.exports = {
  getStatusBarHeight,
  getStatusBarHeightRpx
};
