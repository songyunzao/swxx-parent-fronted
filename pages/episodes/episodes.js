// pages/episodes/episodes.js
// 对应 H5 的 EpisodeDirectory（App.jsx:146-236）

const api = require('../../utils/api.js');
const { getStatusBarHeight, getMenuRightInset } = require('../../utils/system.js');

const SUBJECT_GLYPHS = {
  physics: '⚛',
  'world-history': '🌍',
  biology: '🍃',
  geography: '🗺'
};

Page({
  data: {
    course: {},
    subjectGlyph: '⚗',
    episodes: [],
    unitTabs: ['全部'],
    unit: '全部',
    query: '',
    filtered: [],
    notice: '',
    statusBarHeight: 20,
    headerRightInset: 95
  },

  onLoad() {
    this.setData({
      statusBarHeight: getStatusBarHeight(),
      headerRightInset: getMenuRightInset()
    });
    const app = getApp();
    const course = app.globalData.selectedCourse;
    if (!course || !course.id) {
      // 没有选中课程：栈底时 navigateBack 会失败，统一 reLaunch 回课程目录
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.reLaunch({ url: '/pages/courses/courses' });
      }
      return;
    }
    this.setData({
      course,
      subjectGlyph: SUBJECT_GLYPHS[course.id] || '⚗',
      unitTabs: ['全部', ...(course.units || [])]
    });
    // 取集数列表：若 globalData 已有则直接用，否则兜底加载 catalog
    const cached = app.globalData.episodesByCourse;
    if (cached && cached[course.id]) {
      this.setData({ episodes: cached[course.id] });
      this.applyFilter();
    } else {
      this.loadEpisodesFromCatalog(course.id);
    }
  },

  async loadEpisodesFromCatalog(courseId) {
    try {
      const catalog = await api.fetchCatalog();
      const app = getApp();
      app.globalData.episodesByCourse = catalog.episodesByCourse || {};
      const episodes = (catalog.episodesByCourse || {})[courseId] || [];
      this.setData({ episodes });
      this.applyFilter();
    } catch (err) {
      wx.showToast({ title: '集数加载失败', icon: 'none' });
    }
  },

  onQueryChange(e) {
    this.setData({ query: e.detail.value }, () => this.applyFilter());
  },

  onClearQuery() {
    this.setData({ query: '' }, () => this.applyFilter());
  },

  onUnitTap(e) {
    this.setData({ unit: e.currentTarget.dataset.unit }, () => this.applyFilter());
  },

  applyFilter() {
    const { episodes, query, unit } = this.data;
    const q = (query || '').trim();
    const filtered = episodes.filter((ep) => {
      const queryMatches = !q || `${ep.number}${ep.title}${ep.unit}`.includes(q);
      const unitMatches = unit === '全部' || ep.unit === unit;
      return queryMatches && unitMatches;
    });
    this.setData({ filtered });
  },

  onOpenEpisode(e) {
    const episode = e.currentTarget.dataset.episode;
    if (episode.ready) {
      const app = getApp();
      app.globalData.selectedEpisode = episode;
      wx.navigateTo({ url: '/pages/manual/manual' });
      return;
    }
    // 未整理：toast 提示（对应 H5 的 setNotice 逻辑）
    this.setData({ notice: `第${episode.number}集的家长手册正在整理中` });
    setTimeout(() => this.setData({ notice: '' }), 2200);
  },

  onBack() {
    wx.navigateBack();
  },

  onHome() {
    wx.navigateBack();
  }
});
