// Agent间消息总线
// 解耦Agent通信，支持发布/订阅模式

export class MessageBus {
  constructor() {
    this.subscribers = new Map()
    this.messageHistory = []
    this.MAX_HISTORY = 100
  }

  // 订阅某个Agent的消息
  subscribe(agentId, callback) {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, [])
    }
    this.subscribers.get(agentId).push(callback)

    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(agentId)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) callbacks.splice(index, 1)
      }
    }
  }

  // 发布消息
  publish(message) {
    // 存储历史
    this.messageHistory.push(message)
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory.shift()
    }

    // 发送给订阅者
    const { to } = message

    if (to === 'broadcast') {
      // 广播给所有订阅者
      this.subscribers.forEach((callbacks, agentId) => {
        callbacks.forEach(cb => cb(message))
      })
    } else {
      // 单播
      const callbacks = this.subscribers.get(to)
      if (callbacks) {
        callbacks.forEach(cb => cb(message))
      }
    }
  }

  // 发送消息（简化API）
  send(from, to, type, payload, requiresApproval = false) {
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      type,
      payload,
      timestamp: Date.now(),
      requiresApproval
    }
    this.publish(message)
    return message
  }

  // 广播消息
  broadcast(from, type, payload) {
    return this.send(from, 'broadcast', type, payload)
  }

  // 获取消息历史
  getHistory(agentId = null, type = null) {
    let history = this.messageHistory

    if (agentId) {
      history = history.filter(m => m.from === agentId || m.to === agentId || m.to === 'broadcast')
    }

    if (type) {
      history = history.filter(m => m.type === type)
    }

    return history
  }

  // 清空历史
  clearHistory() {
    this.messageHistory = []
  }
}

// 单例
export const messageBus = new MessageBus()
export default messageBus