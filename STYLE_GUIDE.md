# Tabs 样式指南

本指南介绍如何使用 `@ldesign/tabs` 的不同样式和配置选项。

## 🎨 样式类型

### 1. Chrome 风格 (chrome)

模仿现代 Chrome 浏览器的标签页风格（扁平化设计）。

**特征：**
- 圆角矩形标签（顶部圆角8px）
- 非激活标签灰色背景，激活标签白色背景
- 激活标签与内容区域背景一致
- 标签之间 2px 间隙，紧凑布局
- 关闭按钮始终可见，hover 时高亮
- 微妙的阴影效果，突出层次感

**适用场景：** 浏览器类应用、多文档编辑器、后台管理系统

```vue
<TabsContainer
  :tabs="tabs"
  style-type="chrome"
  width-mode="shrink"
  size="md"
/>
```

### 2. VSCode 风格 (vscode)

模仿 Visual Studio Code 编辑器的标签页风格。

**特征：**
- 矩形标签，无圆角或小圆角
- 活动标签有明显的底部指示线
- 紧凑布局，标签间距小
- 修改状态显示圆点

**适用场景：** 代码编辑器、开发工具

```vue
<TabsContainer
  :tabs="tabs"
  style-type="vscode"
  width-mode="scroll"
  size="sm"
/>
```

### 3. Card 风格 (card)

基于 Ant Design 的卡片风格。

**特征：**
- 圆角卡片设计
- 标签之间有明显间隙
- 活动标签有阴影提升效果
- 整体较为轻量

**适用场景：** 管理后台、数据看板

```vue
<TabsContainer
  :tabs="tabs"
  style-type="card"
  width-mode="scroll"
  size="md"
/>
```

### 4. Material 风格 (material)

遵循 Material Design 规范的风格。

**特征：**
- 扁平设计，强调层次
- 涟漪点击效果
- 活动标签有底部加粗指示条
- 遵循 Material 动画规范

**适用场景：** Material UI 应用、移动端应用

```vue
<TabsContainer
  :tabs="tabs"
  style-type="material"
  width-mode="shrink"
  size="lg"
/>
```

## 📏 尺寸系统

集成 `@ldesign/size` 包的 CSS 变量系统，支持 5 种尺寸：

| 尺寸 | 高度 | 字体大小 | 使用场景 |
|------|------|----------|----------|
| xs | 28px | 11px | 紧凑型界面、工具栏 |
| sm | 32px | 12px | 小屏幕设备 |
| md | 36px | 14px | 默认尺寸，适合大多数场景 |
| lg | 40px | 16px | 大屏幕、高分辨率显示器 |
| xl | 48px | 18px | 触摸设备、演示模式 |

```vue
<!-- 超小尺寸 - 适合工具栏 -->
<TabsContainer :tabs="tabs" size="xs" style-type="vscode" />

<!-- 中等尺寸 - 默认 -->
<TabsContainer :tabs="tabs" size="md" style-type="chrome" />

<!-- 超大尺寸 - 适合触摸设备 -->
<TabsContainer :tabs="tabs" size="xl" style-type="card" />
```

## 📐 宽度适应模式

### Shrink 模式 (推荐)

类似 Chrome 浏览器的行为，当标签总宽度超出容器时，自动缩小每个标签的宽度。

**特点：**
- 始终显示所有标签
- 标签宽度动态调整
- 达到最小宽度 (60px) 后启用滚动
- 更好的可见性

```vue
<TabsContainer
  :tabs="tabs"
  width-mode="shrink"
  style-type="chrome"
/>
```

### Scroll 模式

保持标签固定宽度，超出容器时显示滚动按钮。

**特点：**
- 标签宽度固定
- 保持良好的可读性
- 使用滚动按钮导航
- 适合标签数量较少的场景

```vue
<TabsContainer
  :tabs="tabs"
  width-mode="scroll"
  style-type="vscode"
/>
```

## 🎭 组合示例

### 示例 1: 现代浏览器风格

```vue
<TabsContainer
  :tabs="tabs"
  :active-tab-id="activeTabId"
  style-type="chrome"
  width-mode="shrink"
  size="md"
  :enable-drag="true"
  :show-icon="true"
  :show-scroll-buttons="true"
  @tab-click="handleTabClick"
  @tab-close="handleTabClose"
/>
```

### 示例 2: 代码编辑器风格

```vue
<TabsContainer
  :tabs="tabs"
  :active-tab-id="activeTabId"
  style-type="vscode"
  width-mode="scroll"
  size="sm"
  :enable-drag="true"
  :show-icon="true"
  @tab-click="handleTabClick"
/>
```

### 示例 3: 移动端友好

```vue
<TabsContainer
  :tabs="tabs"
  :active-tab-id="activeTabId"
  style-type="material"
  width-mode="shrink"
  size="xl"
  :enable-drag="false"
  :show-icon="false"
  @tab-click="handleTabClick"
/>
```

### 示例 4: 管理后台

```vue
<TabsContainer
  :tabs="tabs"
  :active-tab-id="activeTabId"
  style-type="card"
  width-mode="scroll"
  size="md"
  :enable-drag="true"
  :show-icon="true"
  @tab-click="handleTabClick"
/>
```

## 🎨 主题集成

### 与 @ldesign/color 集成

Tabs 组件完全集成了 `@ldesign/color` 包的颜色系统：

```vue
<script setup>
import { useColor } from '@ldesign/color/vue'
import { TabsContainer } from '@ldesign/tabs/vue'

const { setTheme } = useColor()

// 切换主题色
const changeTheme = (color) => {
  setTheme(color) // tabs 会自动响应主题变化
}
</script>

<template>
  <div>
    <button @click="changeTheme('blue')">蓝色</button>
    <button @click="changeTheme('green')">绿色</button>
    <button @click="changeTheme('purple')">紫色</button>
    
    <TabsContainer
      :tabs="tabs"
      style-type="chrome"
    />
  </div>
</template>
```

### 与 @ldesign/size 集成

尺寸系统自动响应全局尺寸配置：

```vue
<script setup>
import { useSize } from '@ldesign/size/vue'
import { TabsContainer } from '@ldesign/tabs/vue'

const { setGlobalScale } = useSize()

// 调整全局缩放
const changeScale = (scale) => {
  setGlobalScale(scale) // tabs 尺寸会自动调整
}
</script>

<template>
  <div>
    <button @click="changeScale(0.9)">90%</button>
    <button @click="changeScale(1.0)">100%</button>
    <button @click="changeScale(1.1)">110%</button>
    
    <TabsContainer
      :tabs="tabs"
      size="md"
    />
  </div>
</template>
```

## 💡 最佳实践

### 1. 根据应用类型选择样式

- **浏览器/多文档应用**: 使用 `chrome` 风格 + `shrink` 模式
- **代码编辑器**: 使用 `vscode` 风格 + `scroll` 模式
- **管理后台**: 使用 `card` 风格 + `scroll` 模式
- **移动应用**: 使用 `material` 风格 + `shrink` 模式

### 2. 响应式设计

```vue
<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const isMobile = useMediaQuery('(max-width: 768px)')

const tabsConfig = computed(() => ({
  styleType: isMobile.value ? 'material' : 'chrome',
  size: isMobile.value ? 'lg' : 'md',
  widthMode: isMobile.value ? 'shrink' : 'scroll',
  showIcon: !isMobile.value,
}))
</script>

<template>
  <TabsContainer
    :tabs="tabs"
    :style-type="tabsConfig.styleType"
    :size="tabsConfig.size"
    :width-mode="tabsConfig.widthMode"
    :show-icon="tabsConfig.showIcon"
  />
</template>
```

### 3. 性能优化

- 标签数量较多时（>20），使用 `scroll` 模式而非 `shrink`
- 在低端设备上使用较小的尺寸 (`sm` 或 `xs`)
- 禁用不需要的功能（如拖拽、图标）以提升性能

### 4. 可访问性

- 使用 `xl` 尺寸提升触摸设备的可用性
- 保持足够的对比度（通过 `@ldesign/color` 自动处理）
- 为图标提供文字说明

## 🔧 自定义样式

如果内置样式不满足需求，可以通过 CSS 变量自定义：

```css
/* 自定义 Chrome 风格的颜色 */
.ld-tabs-container.ld-tabs-style-chrome {
  --ld-tabs-bg-active: #your-color;
  --ld-tabs-text-active: #your-text-color;
  --ld-tabs-border-active: #your-border-color;
}

/* 调整标签最小宽度 */
.ld-tabs-container.ld-tabs-width-shrink {
  --ld-tabs-min-width-shrink: 80px;
}

/* 自定义尺寸 */
.ld-tabs-container.ld-tabs-size-custom {
  --ld-tabs-height: 44px;
  --ld-tabs-font-size: 15px;
  --ld-tabs-icon-size: 18px;
}
```

## 📚 更多资源

- [完整 API 文档](./README.md)
- [示例代码](./examples/)
- [在线演示](#)

