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

// —— 右上角胶囊避让 ——
// 自定义导航栏下，微信胶囊按钮（···⊙）固定在屏幕右上角，
// 页面自己的右上角元素（学习进度/课程目录/退出）会被胶囊盖住。
// 通过 wx.getMenuButtonBoundingClientRect() 拿到胶囊位置，
// 右侧元素加 margin-right = 胶囊左缘到屏幕右缘的距离 + 8px 间距即可避开。
let cachedMenuRightInset = null;

// 返回右侧应预留的空间，单位 px
function getMenuRightInset() {
  if (cachedMenuRightInset != null) return cachedMenuRightInset;
  try {
    const rect = wx.getMenuButtonBoundingClientRect();
    const info = wx.getWindowInfo
      ? wx.getWindowInfo()
      : wx.getSystemInfoSync();
    if (rect && rect.left > 0 && info.windowWidth) {
      cachedMenuRightInset = info.windowWidth - rect.left + 8;
    } else {
      cachedMenuRightInset = 95; // 异常返回值时兜底
    }
  } catch (e) {
    cachedMenuRightInset = 95; // 兜底：胶囊宽约 87px + 边距
  }
  return cachedMenuRightInset;
}

module.exports = {
  getStatusBarHeight,
  getStatusBarHeightRpx,
  getMenuRightInset
};
