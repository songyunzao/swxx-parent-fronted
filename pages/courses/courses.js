// pages/courses/courses.js
// 课程目录页。支持从 bindChild 带 focus 参数跳入（自动定位某门课）。

const api = require('../../utils/api.js');
const { getStatusBarHeight, getMenuRightInset } = require('../../utils/system.js');

const COURSE_ICON_GLYPHS = {
  physics: '⚛',
  'world-history': '🌍',
  biology: '🍃',
  geography: '🗺'
};

Page({
  data: {
    query: '',
    courses: [],
    filteredCourses: [],
    statusBarHeight: 20,
    headerRightInset: 95,
    loading: true,
    errMsg: '',
  },

  onLoad(options) {
    this.setData({
      statusBarHeight: getStatusBarHeight(),
      headerRightInset: getMenuRightInset()
    });
    this.focusKey = options && options.focus;
    this.loadCatalog();
  },

  async loadCatalog() {
    this.setData({ loading: true, errMsg: '' });
    try {
      const catalog = await api.fetchCatalog();
      const app = getApp();
      // 存全量目录到 globalData，episodes 页直接取，避免重复请求
      app.globalData.episodesByCourse = catalog.episodesByCourse || {};
      app.globalData.coursesCache = catalog.courses || [];

      const courses = (catalog.courses || []).map((c, i) => ({
        ...c,
        indexLabel: String(i + 1).padStart(2, '0'),
        iconGlyph: COURSE_ICON_GLYPHS[c.id] || '⚗',
        highlighted: this.focusKey === c.id  // focus 时高亮提示，不强制跳转
      }));
      this.setData({ courses, filteredCourses: courses, loading: false });

      // focus 提示后清除（只高亮一次，让用户主动点）
      if (this.focusKey) {
        setTimeout(() => {
          this.focusKey = null;
          const cleared = this.data.courses.map(c => ({ ...c, highlighted: false }));
          // courses 与 filteredCourses 都要更新，否则搜索状态下高亮残留
          this.setData({ courses: cleared, filteredCourses: cleared }, () => this.applyFilter());
        }, 3000);
      }
    } catch (err) {
      this.setData({ loading: false, errMsg: err.message || '目录加载失败' });
    }
  },

  onQueryChange(e) {
    this.setData({ query: e.detail.value }, () => this.applyFilter());
  },

  onClearQuery() {
    this.setData({ query: '' }, () => this.applyFilter());
  },

  applyFilter() {
    const normalized = (this.data.query || '').trim().toLowerCase();
    const list = !normalized
      ? this.data.courses
      : this.data.courses.filter((c) =>
          `${c.title}${c.subject}`.toLowerCase().includes(normalized)
        );
    this.setData({ filteredCourses: list });
  },

  onSelectCourse(e) {
    const course = e.currentTarget.dataset.course;
    if (!course) return;
    const app = getApp();
    app.globalData.selectedCourse = course;
    wx.navigateTo({ url: '/pages/episodes/episodes' });
  },

  // 跳转学习进度页（独立入口）
  onGoProgress() {
    wx.navigateTo({ url: '/pages/bindChild/bindChild' });
  },

  onHome() {
    // 已在课程目录
  }
});
