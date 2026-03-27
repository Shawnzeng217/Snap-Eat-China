/**
 * 带有超时机制的等待 _satellite 就绪函数
 */
function waitForSatellite(callback: () => void, maxRetries = 20, interval = 250): void {
  let retries = 0;
  const check = () => {
    // @ts-ignore
    if (window._satellite && typeof window._satellite.track === 'function') {
      callback();
    } else if (retries < maxRetries) {
      retries++;
      setTimeout(check, interval);
    } else {
      console.warn('[Adobe Tracking] _satellite 加载超时');
    }
  };
  check();
}

/**
 * 更新数据并触发 Page View 埋点
 * @param pageName - 当前页面的名称或类型
 * @param lang - 页面语言
 */
export function trackPageView(pageName: string = 'Snap-Eat', lang: string = 'zh-CN') {
  waitForSatellite(() => {
    // 1. 更新当前页面的数据层 (覆盖 HTML 中的初始值)
    // @ts-ignore
    window.digitalData = {
      global: {
        page: {
          language: lang,
          brandCode: "HI",
          primaryCategory: "Snap-Eat",
          pageType: pageName,
          siteName: "HiltonChina",
          version: "index"
        }
      }
    };
    // 2. 触发通用 Direct Call Rule (DCR) 事件发送至 CJA
    // @ts-ignore
    window._satellite!.track('brand_page');
  });
}
