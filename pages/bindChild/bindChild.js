// pages/bindChild/bindChild.js
// 学习进度页：登录后自动查询（登录号即查询号，无需任何输入）。

const api = require('../../utils/api.js');
const { getStatusBarHeight } = require('../../utils/system.js');

const COURSE_META = [
  { key: 'physics', name: '物理八分钟', tone: 'blue' },
  { key: 'world-history', name: '世界历史八分钟', tone: 'green' },
  { key: 'geography', name: '地理八分钟', tone: 'yellow' },
  { key: 'biology', name: '生物八分钟', tone: 'coral' },
];

Page({
  data: {
    statusBarHeight: 20,
    loading: false,
    errMsg: '',
    progress: null,
    child: null,
    childInitial: '',
    courseList: [],
  },

  onLoad() {
    this.setData({ statusBarHeight: getStatusBarHeight() });
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    // 已登录：每次进入此页都自动刷新进度（避免显示旧数据）
    this.queryProgress();
  },

  // 查询学习进度（无需传参，后端从JWT取号）
  async queryProgress() {
    // 防止并发重复请求
    if (this.data.loading) return;
    this.setData({ loading: true, errMsg: '' });
    try {
      const data = await api.getChildProgress();
      const prog = data.progress || {};
      const courseList = COURSE_META.map((c) => {
        const p = prog[c.key] || {};
        const learned = p.learnedCourses || 0;
        const total = p.totalEpisodes || 0;
        return {
          key: c.key,
          name: c.name,
          tone: c.tone,
          learnedCourses: learned,
          totalEpisodes: total,
          furthestEpisode: p.furthestEpisode || 0,
          // 进度条 = 完成率（学过集数 / 总集数），不再用单集最高 progress
          completion: total > 0 ? Math.round((learned / total) * 100) : 0,
        };
      });
      const nick = data.child.nick_name || '我的孩子';
      this.setData({
        progress: prog,
        child: data.child,
        childInitial: nick.slice(0, 1),
        courseList,
      });
    } catch (err) {
      this.setData({ errMsg: err.message || '查询失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSelectCourse(e) {
    const key = e.currentTarget.dataset.key;
    wx.navigateTo({
      url: `/pages/courses/courses?focus=${key}`,
    });
  },

  onRefresh() {
    this.queryProgress();
  },

  // 返回课程页（栈底兜底：直接 reLaunch 回课程目录）
  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.reLaunch({ url: '/pages/courses/courses' });
    }
  },

  onLogout() {
    api.logout();
  },
});
