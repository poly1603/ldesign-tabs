# 🚀 快速开始 - LDesign Tabs

## 📦 安装

```bash
# 在工作区根目录
pnpm install

# 或者单独安装 tabs 包的依赖
pnpm --filter @ldesign/tabs install
```

## 🔨 构建

```bash
# 构建 tabs 包
pnpm --filter @ldesign/tabs build

# 或者在 packages/tabs 目录下
cd packages/tabs
pnpm build
```

## 🎯 在 apps/app 中查看效果

tabs 插件已经完整集成到 apps/app 项目中，你可以直接启动查看效果：

```bash
# 在项目根目录
pnpm --filter ldesign-simple-app dev

# 或者
cd apps/app
pnpm dev
```

然后访问 `http://localhost:3330`，你会看到：

1. **页面顶部的标签栏** - 显示当前打开的页面标签
2. **点击左侧菜单** - 会自动创建新标签
3. **首页标签被固定** - 无法关闭和拖动到非固定区域
4. **右键点击标签** - 显示上下文菜单
5. **拖拽标签** - 可以重新排序
6. **关闭按钮** - 鼠标悬停时显示（当前激活的标签除外）
7. **快捷键** - 尝试 Ctrl/Cmd + W 关闭标签等

## 💻 代码示例

### 基础使用

```vue
<template>
  <div>
    <TabsContainer
      :tabs="tabs"
      :active-tab-id="activeTabId"
      @tab-click="handleTabClick"
      @tab-close="handleTabClose"
    />
  </div>
</template>

<script setup>
import { TabsContainer, useTabs } from '@ldesign/tabs/vue'
import '@ldesign/tabs/styles'
import { useRouter } from 'vue-router'

const router = useRouter()

const {
  tabs,
  activeTabId,
  activateTab,
  removeTab,
} = useTabs({
  maxTabs: 10,
  persist: true,
  router: {
    autoSync: true,
  },
  shortcuts: {
    enabled: true,
  },
}, router)

const handleTabClick = (tab) => {
  activateTab(tab.id)
  router.push(tab.path)
}

const handleTabClose = (tab) => {
  removeTab(tab.id)
}
</script>
```

### 完整配置

```typescript
const tabs = useTabs({
  // 最大标签数
  maxTabs: 10,
  
  // 持久化
  persist: true,
  persistKey: 'my-app-tabs',
  
  // 自动激活新标签
  autoActivate: true,
  
  // 路由配置
  router: {
    autoSync: true,
    getTabTitle: (route) => {
      // 支持 i18n
      return route.meta?.titleKey 
        ? t(route.meta.titleKey) 
        : route.meta?.title || route.path
    },
    getTabIcon: (route) => route.meta?.icon,
    shouldCreateTab: (route) => route.meta?.layout !== 'blank',
    shouldPinTab: (route) => route.path === '/',
  },
  
  // 快捷键
  shortcuts: {
    enabled: true,
    closeTab: 'Ctrl+W',
    nextTab: 'Ctrl+Tab',
    prevTab: 'Ctrl+Shift+Tab',
    reopenTab: 'Ctrl+Shift+T',
  },
}, router)
```

## 🎨 自定义样式

```css
/* 修改 CSS 变量 */
:root {
  --ld-tabs-height: 40px;
  --ld-tabs-bg-active: #e3f2fd;
  --ld-tabs-text-active: #1976d2;
}
```

## 📋 API 速查

### useTabs 返回值

```typescript
const {
  // 状态
  tabs,              // Tab[] - 所有标签
  activeTabId,       // string | null - 激活的标签ID
  activeTab,         // Tab | undefined - 激活的标签对象
  tabsCount,         // number - 标签数量
  canAddTab,         // boolean - 是否可以添加标签
  
  // 方法
  addTab,            // (config: TabConfig) => Tab | null
  removeTab,         // (id: string) => boolean
  updateTab,         // (id: string, updates: Partial<Tab>) => boolean
  activateTab,       // (id: string) => boolean
  pinTab,            // (id: string) => boolean
  unpinTab,          // (id: string) => boolean
  reorderTabs,       // (from: number, to: number) => boolean
  closeOtherTabs,    // (id: string) => number
  closeAllTabs,      // () => number
  closeTabsToRight,  // (id: string) => number
  closeTabsToLeft,   // (id: string) => number
  reopenLastClosedTab, // () => Tab | null
  getClosedHistory,  // () => ClosedTabHistory[]
  clearHistory,      // () => void
  
  // 事件
  on,                // (type: string, listener: Function) => () => void
  once,              // (type: string, listener: Function) => () => void
  off,               // (type: string, listener: Function) => void
  
  // 实例（高级）
  manager,           // TabManager
  dragHandler,       // DragHandler
} = useTabs(config, router)
```

### 事件类型

- `tab:add` - 标签添加
- `tab:remove` - 标签移除
- `tab:update` - 标签更新
- `tab:activate` - 标签激活
- `tab:pin` - 标签固定
- `tab:unpin` - 取消固定
- `tab:reorder` - 重新排序
- `tab:close-others` - 关闭其他
- `tab:close-all` - 关闭全部
- `tab:close-left` - 关闭左侧
- `tab:close-right` - 关闭右侧
- `tab:status-change` - 状态变化
- `tabs:limit-reached` - 达到限制
- `tabs:restored` - 状态恢复

## 🔧 常见问题

### 1. 标签页没有显示？

确保：
- ✅ 已导入样式：`import '@ldesign/tabs/styles'`
- ✅ 路由 meta 配置正确
- ✅ `shouldCreateTab` 返回 true

### 2. 标签不能关闭？

- 当前激活的标签无法关闭（根据需求 2a）
- 设置为 `closable: false` 的标签无法关闭
- 固定标签仍可以关闭（如果是激活的除外）

### 3. 拖拽不工作？

- 确保 `enableDrag` 设为 `true`
- 固定标签只能在固定区域内拖拽
- 非固定标签不能拖到固定区域

### 4. 快捷键不响应？

- 确保 `shortcuts.enabled` 为 `true`
- 检查是否有其他快捷键冲突
- Mac 使用 Cmd，Windows/Linux 使用 Ctrl

### 5. 路由不自动创建标签？

- 检查 `router.autoSync` 是否为 `true`
- 检查 `shouldCreateTab` 返回值
- 确认路由器实例已正确传入

## 📚 更多信息

- [完整文档](./README.md)
- [实施总结](./IMPLEMENTATION_SUMMARY.md)
- [API 文档](./README.md#api-文档)

## 🎉 功能特性

✅ 最多10个标签  
✅ 持久化保存  
✅ 路由自动集成  
✅ 拖拽排序  
✅ 固定标签  
✅ 右键菜单  
✅ 快捷键支持  
✅ 标签滚动  
✅ 历史记录（最近关闭20个）  
✅ 主题集成  
✅ 响应式设计  

Enjoy! 🚀





