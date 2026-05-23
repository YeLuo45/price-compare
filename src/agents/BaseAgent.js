// Agent基类
import { messageBus } from './MessageBus.js'

export class BaseAgent {
  constructor(agentId) {
    this.agentId = agentId
    this.messageBus = messageBus
    this.unsubscribe = null
  }

  // 启动Agent（订阅消息）
  start() {
    this.unsubscribe = this.messageBus.subscribe(this.agentId, (msg) => {
      this.handleMessage(msg)
    })
  }

  // 停止Agent（取消订阅）
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  // 处理消息（子类重写）
  handleMessage(message) {
    // 默认实现：子类重写
  }

  // 发送消息
  sendTo(to, type, payload, requiresApproval = false) {
    return this.messageBus.send(this.agentId, to, type, payload, requiresApproval)
  }

  // 广播消息
  broadcast(type, payload) {
    return this.messageBus.broadcast(this.agentId, type, payload)
  }
}

export default BaseAgent