// pages/manual/manual.js
// 对应 H5 的 EpisodeManual（App.jsx:417-502）
// 加载流程：onLoad -> fetchEpisodeGuide -> 渲染；切换 tab/问题/回答

const api = require('../../utils/api.js');
const { getStatusBarHeight } = require('../../utils/system.js');

const SUBJECT_GLYPHS = {
  physics: '⚛',
  'world-history': '🌍',
  biology: '🍃',
  geography: '🗺'
};

Page({
  data: {
    course: {},
    episode: {},
    subjectGlyph: '⚗',
    tabs: [
      { id: 'summary', label: '本集重点' },
      { id: 'mindmap', label: '思维导图' },
      { id: 'questions', label: '核心问题' }
    ],
    tab: 'summary',
    loadedGuide: null,
    guide: null,
    loadError: '',
    selectedQuestion: 0,
    selectedAnswer: null,
    currentQuestion: null,
    scrollTop: 0,
    statusBarHeight: 20
  },

  onLoad() {
    this.setData({ statusBarHeight: getStatusBarHeight() });
    const app = getApp();
    const course = app.globalData.selectedCourse;
    const episode = app.globalData.selectedEpisode;
    if (!course || !course.id || !episode || !episode.id) {
      // 全局态丢失（如冷启动直进）：回课程目录重来
      wx.reLaunch({ url: '/pages/courses/courses' });
      return;
    }
    this.setData({
      course,
      episode,
      subjectGlyph: SUBJECT_GLYPHS[course.id] || '⚗'
    });
    this.loadGuide();
  },

  loadGuide() {
    const { episode } = this.data;
    this.setData({ loadedGuide: null, guide: null, loadError: '', tab: 'summary', selectedQuestion: 0, selectedAnswer: null });
    api.fetchEpisodeGuide(episode.id)
      .then((content) => {
        this.setData({
          loadedGuide: content,
          guide: content,
          currentQuestion: content.questions[0]
        });
      })
      .catch(() => {
        this.setData({ loadError: '本集内容暂时加载失败，请稍后重试' });
      });
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab, selectedAnswer: null, scrollTop: 0 });
  },

  onPrevQuestion() {
    const { guide, selectedQuestion } = this.data;
    if (!guide || !guide.questions || !guide.questions.length) return;
    const n = guide.questions.length;
    const next = (selectedQuestion - 1 + n) % n;
    this.changeQuestion(next);
  },

  onNextQuestion() {
    const { guide, selectedQuestion } = this.data;
    if (!guide || !guide.questions || !guide.questions.length) return;
    const n = guide.questions.length;
    const next = (selectedQuestion + 1) % n;
    this.changeQuestion(next);
  },

  changeQuestion(index) {
    const { guide } = this.data;
    if (!guide || !guide.questions) return;
    this.setData({
      selectedQuestion: index,
      selectedAnswer: null,
      currentQuestion: guide.questions[index],
      scrollTop: 0
    });
  },

  onSelectAnswer(e) {
    const answer = e.currentTarget.dataset.answer;
    this.setData({ selectedAnswer: answer });
    // 注：检测站不存储考察记录（产品决策），此处仅做本地展示，不上报。
  },

  onCloseAnswer() {
    this.setData({ selectedAnswer: null });
  },

  onBack() {
    wx.navigateBack();
  },

  onHome() {
    wx.navigateBack({ delta: 2 });
  }
});
