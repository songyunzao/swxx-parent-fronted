// pages/login/login.js
// 家长登录：手机号 + 短信验证码

const api = require('../../utils/api.js');
const { getStatusBarHeight } = require('../../utils/system.js');

Page({
  data: {
    statusBarHeight: 20,
    phone: '',
    code: '',
    loading: false,
    errMsg: '',
    countingDown: false,
    countdownText: '',
  },

  onLoad() {
    this.setData({ statusBarHeight: getStatusBarHeight() });
  },

  onShow() {
    // 已登录则直接跳走：与登录成功后保持一致，进课程目录首页
    // （若跳 bindChild 进度页，reLaunch 后它是栈底，页内"返回"会变成死键）
    const app = getApp();
    if (app.globalData.token) {
      wx.reLaunch({ url: '/pages/courses/courses' });
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value, errMsg: '' });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value, errMsg: '' });
  },

  // 发送验证码 + 倒计时
  async onSendCode() {
    if (this.data.countingDown) return;
    const phone = this.data.phone.trim();
    if (!/^1\d{10}$/.test(phone)) {
      this.setData({ errMsg: '请输入正确的手机号' });
      return;
    }
    try {
      await api.sendCode(phone);
      this.startCountdown(60);
      wx.showToast({ title: '验证码已发送', icon: 'success' });
    } catch (err) {
      this.setData({ errMsg: err.message });
    }
  },

  startCountdown(sec) {
    this.setData({ countingDown: true, countdownText: `${sec}s` });
    this.timer = setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        clearInterval(this.timer);
        this.setData({ countingDown: false, countdownText: '' });
      } else {
        this.setData({ countdownText: `${sec}s` });
      }
    }, 1000);
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  // 登录
  async onLogin() {
    const phone = this.data.phone.trim();
    const code = this.data.code.trim();
    if (!/^1\d{10}$/.test(phone)) {
      this.setData({ errMsg: '请输入正确的手机号' });
      return;
    }
    if (!code) {
      this.setData({ errMsg: '请输入验证码' });
      return;
    }
    this.setData({ loading: true, errMsg: '' });
    try {
      await api.login(phone, code);
      // 登录成功 → 首页=课程目录（学习进度在课程页顶部按钮进入）
      wx.reLaunch({ url: '/pages/courses/courses' });
    } catch (err) {
      this.setData({ errMsg: err.message });
    } finally {
      this.setData({ loading: false });
    }
  },
});
