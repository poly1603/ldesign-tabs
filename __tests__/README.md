# Tabs 包测试说明

## 📋 测试概览

本测试套件包含对 @ldesign/tabs 包的全面测试。

### 测试框架
- **Vitest** - 快速的单元测试框架
- **@vue/test-utils** - Vue 组件测试
- **@testing-library/react** - React 组件测试

---

## 🧪 测试分类

### 1. 单元测试（Core）

**核心功能测试：**
- ✅ `manager.test.ts` - TabManager 核心功能
- ✅ `template-manager.test.ts` - 模板系统
- ✅ `search-engine.test.ts` - 搜索引擎
- ⏳ `batch-operations.test.ts` - 批量操作
- ⏳ `bookmark-manager.test.ts` - 书签管理
- ⏳ `statistics.test.ts` - 统计分析
- ⏳ `event-emitter.test.ts` - 事件系统
- ⏳ `storage.test.ts` - 持久化存储

**工具函数测试：**
- ✅ `helpers.test.ts` - 辅助函数
- ⏳ `validators.test.ts` - 验证函数

### 2. 组件测试

**Vue 组件：**
- ⏳ `TabsContainer.spec.ts`
- ⏳ `TabItem.spec.ts`
- ⏳ `TabContextMenu.spec.ts`

**React 组件：**
- ⏳ `TabsContainer.test.tsx`
- ⏳ `TabItem.test.tsx`
- ⏳ `TabContextMenu.test.tsx`

### 3. E2E 测试

- ⏳ 完整的用户交互流程
- ⏳ 拖拽排序
- ⏳ 路由集成
- ⏳ 持久化恢复

---

## 🚀 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单个测试文件
pnpm test manager.test.ts

# 监听模式
pnpm test --watch

# 覆盖率报告
pnpm test --coverage
```

---

## 📊 测试覆盖目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|-----------|----------|
| 核心功能 | 90% | 30% ⏳ |
| 工具函数 | 100% | 50% ⏳ |
| Vue 组件 | 80% | 0% ⏳ |
| React 组件 | 80% | 0% ⏳ |

---

## 💡 测试最佳实践

### 1. 单元测试
```typescript
describe('功能模块', () => {
  beforeEach(() => {
    // 每个测试前重置状态
  })

  it('应该能够执行基本操作', () => {
    // Arrange - 准备
    // Act - 执行
    // Assert - 断言
    expect(result).toBe(expected)
  })
})
```

### 2. 组件测试
```typescript
import { mount } from '@vue/test-utils'

describe('TabsContainer', () => {
  it('应该渲染标签列表', () => {
    const wrapper = mount(TabsContainer, {
      props: { tabs: [...] }
    })

    expect(wrapper.findAll('.ld-tab-item')).toHaveLength(3)
  })
})
```

### 3. 异步测试
```typescript
it('应该处理异步操作', async () => {
  const promise = asyncFunction()
  
  await expect(promise).resolves.toBe(expected)
})
```

---

## 📝 测试用例示例

### TabManager 测试

**测试场景：**
- ✅ 添加标签
- ✅ 移除标签
- ✅ 激活标签
- ✅ 固定标签
- ✅ 重复检测
- ✅ 数量限制
- ✅ 事件触发
- ✅ 批量操作
- ✅ 历史记录

### TemplateManager 测试

**测试场景：**
- ✅ 保存模板
- ✅ 加载模板
- ✅ 导入导出
- ✅ 删除模板
- ✅ 模板管理

### SearchEngine 测试

**测试场景：**
- ✅ 简单搜索
- ✅ 高级搜索
- ✅ 相关度评分
- ✅ 结果排序
- ✅ 搜索历史
- ✅ 文本高亮

---

## 🔍 调试测试

```bash
# 调试单个测试
pnpm test --reporter=verbose manager.test.ts

# 只运行失败的测试
pnpm test --run --reporter=verbose

# 显示测试输出
pnpm test --reporter=verbose --no-coverage
```

---

*测试是代码质量的保证，我们正在持续完善测试覆盖。*

