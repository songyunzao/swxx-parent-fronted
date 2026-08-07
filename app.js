// app.js —— 知识成果检测站小程序入口
// 与 H5 版本（src/App.jsx）保持一致的页面状态机：
//   courses -> episodes -> manual
// 三个页面通过 globalData + 页面栈传递选中的课程与集数。

App({
  globalData: {
    // 当前选中的课程对象（结构同 catalog.courses[*]）
    selectedCourse: null,
    // 当前选中的集数对象（结构同 catalog.episodesByCourse[*][*]）
    selectedEpisode: null,
    // 后端 JWT（家长验证码登录后写入）
    token: '',
    // 家长手机号（登录用）
    parentPhone: '',
    // 孩子手机号（查进度用，bindChild 页填入）
    childTel: '',
    // ★ 后端基础地址：测试服务器（已上线，HTTPS）
    //   本地开发改回：http://localhost:3000
    apiBase: 'https://check.35xiaoxing.com'
  },

  onLaunch() {
    // 启动时尝试恢复登录态（持久化免登）
    const token = wx.getStorageSync('jwt');
    if (token) {
      this.globalData.token = token;
    }
  }
});
