# @ldesign/tabs

浏览器风格的标签页组件，支持 Vue 和 React，提供完整的标签页管理功能。

## ✨ 特性

### 核心功能
- ✅ 标签页的增删改查
- ✅ 标签激活和切换
- ✅ 固定/取消固定标签
- ✅ 拖拽排序（固定标签区域隔离）
- ✅ 最大标签数量限制（默认10个）
- ✅ 持久化存储（localStorage）
- ✅ 路由自动集成
- ✅ 重复标签检测

### 交互功能
- ✅ 右键菜单（关闭其他、关闭左侧/右侧、关闭全部）
- ✅ 标签滚动控制
- ✅ 鼠标滚轮横向滚动
- ✅ 自动滚动到激活标签
- ✅ 快捷键支持
  - `Ctrl/Cmd + W`: 关闭当前标签
  - `Ctrl/Cmd + Tab`: 切换到下一个标签
  - `Ctrl/Cmd + Shift + Tab`: 切换到上一个标签
  - `Ctrl/Cmd + Shift + T`: 重新打开最近关闭的标签

### 增强功能
- ✅ 标签状态指示（加载中、错误）
- ✅ 历史记录（最近关闭的20个标签）
- ✅ 主题支持（集成 @ldesign/color）
- ✅ 响应式设计
- ✅ 完整的 TypeScript 支持
- ✅ 框架无关的核心（可在任何框架中使用）

## 📦 安装

```bash
pnpm add @ldesign/tabs
```

## 🚀 快速开始

### Vue 3

```vue
<template>
  <div>
    <!-- 标签页容器 -->
    <TabsContainer
      :tabs="tabs"
      :active-tab-id="activeTabId"
      style-type="chrome"
      width-mode="shrink"
      size="md"
      @tab-click="handleTabClick"
      @tab-close="handleTabClose"
    />

    <!-- 路由视图 -->
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { TabsContainer, useTabs } from '@ldesign/tabs/vue'
import '@ldesign/tabs/styles'
import { useRouter } from 'vue-router'

const router = useRouter()

// 初始化标签页系统
const {
  tabs,
  activeTabId,
  activateTab,
  removeTab,
} = useTabs({
  maxTabs: 10,
  persist: true,
  router: {
    autoSync: true, // 自动同步路由
  },
  shortcuts: {
    enabled: true, // 启用快捷键
  },
}, router)

// 标签点击
const handleTabClick = (tab) => {
  activateTab(tab.id)
  router.push(tab.path)
}

// 标签关闭
const handleTabClose = (tab) => {
  removeTab(tab.id)
}
</script>
```

### 样式类型示例

```vue
<template>
  <div class="demo">
    <!-- Chrome 浏览器风格 - 梯形标签，活动标签突出 -->
    <TabsContainer
      :tabs="tabs"
      style-type="chrome"
      width-mode="shrink"
      size="md"
    />

    <!-- VSCode 编辑器风格 - 矩形标签，底部指示线 -->
    <TabsContainer
      :tabs="tabs"
      style-type="vscode"
      width-mode="scroll"
      size="sm"
    />

    <!-- Ant Design 卡片风格 - 圆角卡片，间隙分隔 -->
    <TabsContainer
      :tabs="tabs"
      style-type="card"
      width-mode="scroll"
      size="md"
    />

    <!-- Material Design 风格 - 扁平设计，涟漪效果 -->
    <TabsContainer
      :tabs="tabs"
      style-type="material"
      width-mode="shrink"
      size="lg"
    />
  </div>
</template>
```

### 尺寸变体

```vue
<template>
  <div>
    <!-- 超小尺寸 -->
    <TabsContainer :tabs="tabs" size="xs" />
    
    <!-- 小尺寸 -->
    <TabsContainer :tabs="tabs" size="sm" />
    
    <!-- 中等尺寸（默认） -->
    <TabsContainer :tabs="tabs" size="md" />
    
    <!-- 大尺寸 -->
    <TabsContainer :tabs="tabs" size="lg" />
    
    <!-- 超大尺寸 -->
    <TabsContainer :tabs="tabs" size="xl" />
  </div>
</template>
```

### 宽度适应模式

```vue
<template>
  <div>
    <!-- shrink 模式 - 标签自动缩小以适应容器 -->
    <TabsContainer 
      :tabs="tabs" 
      width-mode="shrink"
      style-type="chrome"
    />
    
    <!-- scroll 模式 - 保持标签宽度，超出时显示滚动 -->
    <TabsContainer 
      :tabs="tabs" 
      width-mode="scroll"
      style-type="vscode"
    />
  </div>
</template>
```

### 核心 API（框架无关）

```typescript
import { createTabManager } from '@ldesign/tabs'

// 创建管理器
const manager = createTabManager({
  maxTabs: 10,
  persist: true,
  persistKey: 'my-app-tabs',
})

// 添加标签
const tab = manager.addTab({
  title: '首页',
  path: '/',
  icon: '🏠',
})

// 激活标签
manager.activateTab(tab.id)

// 监听事件
manager.events.on('tab:add', (event) => {
  console.log('标签已添加:', event.tab)
})

// 获取所有标签
const allTabs = manager.getAllTabs()

// 关闭其他标签
manager.closeOtherTabs(tab.id)

// 重新打开最近关闭的标签
manager.reopenLastClosedTab()
```

## 📖 API 文档

### TabManager

标签页管理器核心类。

#### 配置选项

```typescript
interface TabManagerConfig {
  /** 最大标签数量（默认10） */
  maxTabs?: number
  /** 是否启用持久化（默认true） */
  persist?: boolean
  /** 持久化存储的 key（默认 'ldesign_tabs'） */
  persistKey?: string
  /** 默认标签 */
  defaultTabs?: TabConfig[]
  /** 是否自动激活新标签（默认true） */
  autoActivate?: boolean
}
```

#### 方法

| 方法 | 描述 |
|------|------|
| `addTab(config)` | 添加标签 |
| `removeTab(id)` | 移除标签 |
| `updateTab(id, updates)` | 更新标签 |
| `activateTab(id)` | 激活标签 |
| `pinTab(id)` | 固定标签 |
| `unpinTab(id)` | 取消固定标签 |
| `reorderTabs(from, to)` | 重新排序标签 |
| `closeOtherTabs(id)` | 关闭其他标签 |
| `closeAllTabs()` | 关闭所有标签 |
| `closeTabsToRight(id)` | 关闭右侧标签 |
| `closeTabsToLeft(id)` | 关闭左侧标签 |
| `getTab(id)` | 获取单个标签 |
| `getAllTabs()` | 获取所有标签 |
| `getActiveTab()` | 获取激活的标签 |
| `hasDuplicateTab(path)` | 检查重复标签 |
| `canAddTab()` | 检查是否可以添加标签 |
| `getTabsCount()` | 获取标签数量 |
| `getClosedHistory()` | 获取关闭历史 |
| `reopenLastClosedTab()` | 重新打开最近关闭的标签 |
| `clearHistory()` | 清除历史记录 |

### TabsContainer Props

TabsContainer 组件的属性。

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `tabs` | `Tab[]` | `[]` | 标签列表 |
| `activeTabId` | `string \| null` | `null` | 激活的标签ID |
| `styleType` | `'chrome' \| 'vscode' \| 'card' \| 'material'` | `'chrome'` | 样式类型 |
| `widthMode` | `'shrink' \| 'scroll'` | `'scroll'` | 宽度适应模式 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 尺寸大小 |
| `enableDrag` | `boolean` | `true` | 是否启用拖拽 |
| `showIcon` | `boolean` | `true` | 是否显示图标 |
| `showScrollButtons` | `boolean` | `true` | 是否显示滚动按钮 |
| `customMenuItems` | `CustomMenuItem[]` | `[]` | 自定义右键菜单项 |

#### 样式类型说明

- **chrome**: Chrome 浏览器风格，梯形标签，活动标签突出，标签之间有重叠效果
- **vscode**: VSCode 编辑器风格，矩形标签，底部指示线，紧凑布局
- **card**: Ant Design 卡片风格，圆角卡片设计，标签之间有明显间隙
- **material**: Material Design 风格，扁平设计，涟漪点击效果，底部加粗指示条

#### 宽度模式说明

- **shrink**: 当标签总宽度超出容器时，自动缩小每个标签的宽度（类似 Chrome），达到最小宽度后启用滚动
- **scroll**: 保持标签固定宽度，超出容器时显示滚动按钮

#### 尺寸说明

尺寸系统集成了 `@ldesign/size` 包，自动响应主题尺寸变化：
- **xs**: 超小尺寸 (高度 28px, 字体 11px)
- **sm**: 小尺寸 (高度 32px, 字体 12px)
- **md**: 中等尺寸 (高度 36px, 字体 14px) - 默认
- **lg**: 大尺寸 (高度 40px, 字体 16px)
- **xl**: 超大尺寸 (高度 48px, 字体 18px)

### useTabs (Vue Composable)

Vue 3 的组合式 API。

```typescript
const {
  // 响应式状态
  tabs,
  activeTabId,
  activeTab,
  tabsCount,
  canAddTab,

  // 方法
  addTab,
  removeTab,
  updateTab,
  activateTab,
  pinTab,
  unpinTab,
  reorderTabs,
  closeOtherTabs,
  closeAllTabs,
  closeTabsToRight,
  closeTabsToLeft,
  reopenLastClosedTab,
  getClosedHistory,
  clearHistory,

  // 事件监听
  on,
  once,
  off,

  // 实例
  manager,
  dragHandler,
} = useTabs(config, router)
```

### TabsContainer 组件

Vue 标签页容器组件。

#### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `tabs` | `Tab[]` | `[]` | 标签列表 |
| `activeTabId` | `string \| null` | `null` | 激活的标签ID |
| `enableDrag` | `boolean` | `true` | 是否启用拖拽 |
| `showIcon` | `boolean` | `true` | 是否显示图标 |
| `showScrollButtons` | `boolean` | `true` | 是否显示滚动按钮 |
| `customMenuItems` | `CustomMenuItem[]` | `[]` | 自定义右键菜单项 |

#### 事件

| 事件 | 参数 | 描述 |
|------|------|------|
| `tab-click` | `(tab: Tab)` | 标签点击 |
| `tab-close` | `(tab: Tab)` | 标签关闭 |
| `tab-pin` | `(tab: Tab)` | 标签固定 |
| `tab-unpin` | `(tab: Tab)` | 取消固定 |
| `tab-reorder` | `(from: number, to: number)` | 重新排序 |
| `close-others` | `(tab: Tab)` | 关闭其他 |
| `close-right` | `(tab: Tab)` | 关闭右侧 |
| `close-left` | `(tab: Tab)` | 关闭左侧 |
| `close-all` | `()` | 关闭所有 |

## 🎨 主题定制

使用 CSS 变量定制主题：

```css
:root {
  /* 标签页尺寸 */
  --ld-tabs-height: 36px;
  --ld-tabs-min-width: 100px;
  --ld-tabs-max-width: 200px;

  /* 颜色 */
  --ld-tabs-bg: #ffffff;
  --ld-tabs-bg-active: #e8f4fd;
  --ld-tabs-text: #666666;
  --ld-tabs-text-active: #1890ff;

  /* 更多变量请查看 variables.css */
}
```

## 🔧 路由集成

### 自动集成

```typescript
const tabs = useTabs({
  router: {
    autoSync: true,
    getTabTitle: (route) => route.meta?.title || route.path,
    getTabIcon: (route) => route.meta?.icon,
    shouldCreateTab: (route) => route.meta?.layout !== 'blank',
    shouldPinTab: (route) => route.path === '/',
  },
}, router)
```

### 路由元信息配置

```typescript
const routes = [
  {
    path: '/',
    component: Home,
    meta: {
      title: '首页',
      titleKey: 'nav.home', // 支持 i18n
      icon: '🏠',
      layout: 'default',
      pinTab: true, // 固定标签
    },
  },
  {
    path: '/login',
    component: Login,
    meta: {
      title: '登录',
      layout: 'blank', // blank 布局不会创建标签
    },
  },
]
```

## 📝 事件系统

```typescript
// 监听标签添加
manager.events.on('tab:add', (event) => {
  console.log('新标签:', event.tab)
})

// 监听标签移除
manager.events.on('tab:remove', (event) => {
  console.log('已移除:', event.tab)
})

// 监听标签激活
manager.events.on('tab:activate', (event) => {
  console.log('激活:', event.tab)
  console.log('之前:', event.previousTab)
})

// 监听数量限制
manager.events.on('tabs:limit-reached', (event) => {
  console.warn(`已达到最大限制 ${event.limit}`)
})

// 监听状态恢复
manager.events.on('tabs:restored', (event) => {
  console.log('已恢复标签:', event.tabs)
})
```

### 所有事件类型

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
- `tabs:limit-reached` - 达到数量限制
- `tabs:restored` - 状态恢复

## 💡 高级用法

### 自定义右键菜单项

```vue
<TabsContainer
  :tabs="tabs"
  :custom-menu-items="customMenuItems"
/>

<script setup>
const customMenuItems = [
  {
    label: '复制路径',
    handler: (tab) => {
      navigator.clipboard.writeText(tab.path)
    },
  },
  {
    label: '在新窗口打开',
    handler: (tab) => {
      window.open(tab.path, '_blank')
    },
  },
]
</script>
```

### 手动控制标签状态

```typescript
// 更新标签状态为加载中
manager.updateTab(tabId, { status: 'loading' })

// 更新标签状态为错误
manager.updateTab(tabId, { status: 'error' })

// 更新标签状态为正常
manager.updateTab(tabId, { status: 'normal' })
```

### 历史记录管理

```typescript
// 获取关闭历史（最多20条）
const history = manager.getClosedHistory()

// 重新打开最近关闭的标签
const tab = manager.reopenLastClosedTab()

// 清除历史记录
manager.clearHistory()
```

## 🔌 插件系统

使用 Vue 插件全局注册：

```typescript
import { createApp } from 'vue'
import { TabsPlugin } from '@ldesign/tabs/vue'
import '@ldesign/tabs/styles'

const app = createApp(App)

app.use(TabsPlugin, {
  prefix: 'LdTabs', // 组件前缀（默认）
  maxTabs: 10,
  persist: true,
  shortcuts: {
    enabled: true,
  },
})

// 全局使用
app.config.globalProperties.$tabs
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

- 官网: https://ldesign.dev
- GitHub: https://github.com/ldesign/ldesign


