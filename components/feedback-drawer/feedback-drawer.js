// components/feedback-drawer/feedback-drawer.js
// 对应 H5 的 FeedbackDrawer（App.jsx:376-415）

Component({
  properties: {
    answer: {
      type: Object,
      value: null
    }
  },

  data: {
    toneLabel: ''
  },

  observers: {
    answer(val) {
      const map = {
        solid: '理解扎实',
        partial: '局部理解',
        mixed: '概念混淆',
        recall: '记忆碎片',
        spark: '新的灵感'
      };
      this.setData({ toneLabel: val ? (map[val.kind] || '') : '' });
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    }
  }
});
