// utils/api.js —— 数据接口层（已对接独立后端 check-station-server）
//
// 后端接口约定：
//   POST /auth/send_code   { phone }              → 发送验证码
//   POST /auth/login        { phone, code }        → 验码登录，返回 JWT
//   GET  /child/progress                           → 查学习进度（从JWT取号，无需传tel）
//   GET  /content/catalog                          → 课程目录的 OSS URL
//   GET  /content/episode/:episodeId               → 单集内容的 OSS URL

const app = getApp();

// 统一请求封装：自动带 Authorization，返回 Promise
function request(options) {
  const { url, method = 'GET', data = {} } = options;
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBase}${url}`,
      method,
      data,
      header: app.globalData.token
        ? { Authorization: `Bearer ${app.globalData.token}` }
        : {},
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data || {};
          if (body.ok) {
            resolve(body.data);
          } else {
            reject(new Error(body.msg || '请求失败'));
          }
        } else if (res.statusCode === 401) {
          app.globalData.token = '';
          wx.removeStorageSync('jwt');
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error('登录已过期'));
        } else {
          reject(new Error(`请求错误 ${res.statusCode}`));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '网络连接失败，请检查后端是否启动')),
    });
  });
}

// 从 OSS 拉取 JSON 内容（catalog/episode）
function fetchOssJson(ossUrl) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: ossUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`内容加载失败 (${res.statusCode})`));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '内容加载失败')),
    });
  });
}

// —— 本地缓存策略 ——
// 内容（目录/单集手册）是 OSS 上的静态 JSON，低频变更。
// 读取策略：有缓存立即返回（秒开），同时后台静默拉最新版比对，
// 有更新就写回缓存，下次打开生效。无缓存则正常等待下载。
const CATALOG_CACHE_KEY = 'catalog_cache';
const EPISODE_CACHE_PREFIX = 'episode_cache_';

function safeSetStorage(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {
    // 存储满了：清掉单集缓存再试一次，还不行就放弃（不缓存也能用）
    if (key !== CATALOG_CACHE_KEY) return;
    try {
      const info = wx.getStorageInfoSync();
      (info.keys || []).forEach((k) => {
        if (k.indexOf(EPISODE_CACHE_PREFIX) === 0) wx.removeStorageSync(k);
      });
      wx.setStorageSync(key, value);
    } catch (e2) { /* 放弃缓存 */ }
  }
}

// 后台静默刷新缓存（不阻塞页面）
function backgroundRefresh(url, key, cachedVersion) {
  fetchOssJson(url)
    .then((fresh) => {
      if (!fresh) return;
      // catalog 有 generatedAt 版本号可比对；episode 没有则直接重写
      if (cachedVersion && fresh.generatedAt === cachedVersion) return;
      safeSetStorage(key, { version: fresh.generatedAt || '', data: fresh });
    })
    .catch(() => { /* 刷新失败用旧缓存，无感知 */ });
}

module.exports = {
  // —— 认证 ——
  async sendCode(phone) {
    await request({ url: '/auth/send_code', method: 'POST', data: { phone } });
  },

  async login(phone, code) {
    const data = await request({
      url: '/auth/login', method: 'POST', data: { phone, code }
    });
    if (data && data.token) {
      app.globalData.token = data.token;
      app.globalData.parentPhone = phone;
      wx.setStorageSync('jwt', data.token);
    }
    return data;
  },

  logout() {
    app.globalData.token = '';
    app.globalData.parentPhone = '';
    wx.removeStorageSync('jwt');
    wx.reLaunch({ url: '/pages/login/login' });
  },

  // —— 学习进度（从JWT自动取号，无需传tel）——
  getChildProgress() {
    return request({ url: '/child/progress', method: 'GET' });
  },

  // —— 内容 ——
  async fetchCatalog() {
    const data = await request({ url: '/content/catalog' });
    if (!data || !data.url) throw new Error('目录地址获取失败');
    const cached = wx.getStorageSync(CATALOG_CACHE_KEY);
    if (cached && cached.data) {
      // 秒开：先返回缓存，后台比对 generatedAt 有更新则写回（下次生效）
      backgroundRefresh(data.url, CATALOG_CACHE_KEY, cached.version);
      return cached.data;
    }
    const fresh = await fetchOssJson(data.url);
    safeSetStorage(CATALOG_CACHE_KEY, { version: fresh.generatedAt || '', data: fresh });
    return fresh;
  },

  async fetchEpisodeGuide(episodeId) {
    const data = await request({ url: `/content/episode/${episodeId}` });
    if (!data || !data.url) throw new Error('内容地址获取失败');
    const key = EPISODE_CACHE_PREFIX + episodeId;
    const cached = wx.getStorageSync(key);
    if (cached && cached.data) {
      backgroundRefresh(data.url, key, '');
      return cached.data;
    }
    const fresh = await fetchOssJson(data.url);
    safeSetStorage(key, { version: fresh.generatedAt || '', data: fresh });
    return fresh;
  },
};
