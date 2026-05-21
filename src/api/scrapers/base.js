/**
 * 基础爬虫类
 * 提供统一的请求、错误处理、代理配置
 */
export class BaseScraper {
  constructor(platform) {
    this.platform = platform
    this.baseUrls = {
      taobao: 'https://s.taobao.com/search',
      tmall: 'https://list.tmall.com/search_product',
      jd: 'https://search.jd.com/Search',
      pdd: 'https://mobile.yangkeduo.com/search.html'
    }
  }

  /**
   * 通用请求方法
   * @param {string} url - 请求URL
   * @param {object} params - 查询参数
   */
  async fetch(url, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url

    try {
      // 使用 JSONP 或代理避免 CORS
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      return await response.text()
    } catch (error) {
      console.error(`[${this.platform}] Fetch error:`, error)
      return null
    }
  }

  /**
   * 解析搜索结果（子类实现）
   * @param {string} html - 页面HTML
   * @param {string} keyword - 搜索关键词
   */
  parseProducts(html, keyword) {
    throw new Error('parseProducts must be implemented by subclass')
  }

  /**
   * 搜索商品
   * @param {string} keyword - 关键词
   */
  async search(keyword) {
    const url = this.baseUrls[this.platform]
    if (!url) return []

    const html = await this.fetch(url, this.buildParams(keyword))
    if (!html) return []

    return this.parseProducts(html, keyword)
  }

  /**
   * 构建搜索参数（子类实现）
   */
  buildParams(keyword) {
    throw new Error('buildParams must be implemented by subclass')
  }
}
