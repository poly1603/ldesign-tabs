/**
 * UMD 构建入口
 * 用于浏览器直接引用
 */

// 导出所有核心功能
export * from './core'
export * from './types'
export * from './utils'

// 默认导出核心管理器
export { createTabManager as default } from './core'







