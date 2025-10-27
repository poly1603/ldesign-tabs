<!--
  @ldesign/tabs - Vue 3 完整示例
  
  本示例演示了如何在 Vue 3 应用中使用 @ldesign/tabs 的所有功能：
  - 基础标签管理
  - 模板系统
  - 搜索功能
  - 批量操作
  - 书签功能
  - 统计分析
-->

<template>
  <div class="tabs-demo">
    <!-- 标签容器 -->
    <TabsContainer
      :tabs="tabs"
      :active-tab-id="activeTabId"
      style-type="chrome"
      width-mode="shrink"
      size="md"
      @tab-click="handleTabClick"
      @tab-close="handleTabClose"
      @tab-reorder="handleTabReorder"
      @tab-add="handleAddTab"
    />

    <!-- 工具栏 -->
    <div class="toolbar">
      <!-- 基础操作 -->
      <div class="toolbar-section">
        <h3>基础操作</h3>
        <button @click="handleAddTab">添加随机标签</button>
        <button @click="activeTab && pinTab(activeTab.id)">固定当前</button>
        <button @click="activeTab && closeOtherTabs(activeTab.id)">关闭其他</button>
        <button @click="reopenLastClosedTab">重新打开</button>
      </div>

      <!-- 模板系统 -->
      <div class="toolbar-section">
        <h3>模板系统</h3>
        <button @click="handleSaveTemplate">保存为模板</button>
        <div v-if="templates.length > 0" class="template-list">
          <div v-for="template in templates" :key="template.id" class="template-item">
            <span>{{ template.name }}</span>
            <button @click="loadTemplate(template.id)">加载</button>
            <button @click="deleteTemplate(template.id)">删除</button>
          </div>
        </div>
        <div v-else class="empty-state">暂无模板</div>
      </div>

      <!-- 搜索功能 -->
      <div class="toolbar-section">
        <h3>搜索功能</h3>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索标签..."
          @input="handleSearch"
        />
        <div v-if="searchResults.length > 0" class="search-results">
          <div
            v-for="result in searchResults"
            :key="result.tab.id"
            class="search-result-item"
            @click="activateTab(result.tab.id)"
          >
            {{ result.tab.title }} ({{ result.score }})
          </div>
        </div>
      </div>

      <!-- 书签功能 -->
      <div class="toolbar-section">
        <h3>书签功能</h3>
        <button @click="handleBookmarkCurrent">收藏当前标签</button>
        <div v-if="bookmarks.length > 0" class="bookmark-list">
          <div v-for="bookmark in bookmarks" :key="bookmark.id" class="bookmark-item">
            <span>{{ bookmark.title }}</span>
            <button @click="openBookmark(bookmark.id)">打开</button>
            <button @click="deleteBookmark(bookmark.id)">删除</button>
          </div>
        </div>
        <div v-else class="empty-state">暂无书签</div>
      </div>

      <!-- 统计分析 -->
      <div class="toolbar-section">
        <h3>统计分析</h3>
        <button @click="showStats = !showStats">
          {{ showStats ? '隐藏' : '显示' }}统计
        </button>
        <div v-if="showStats" class="stats-panel">
          <div class="stat-item">
            <label>总访问:</label>
            <span>{{ overallStats.totalVisits }}</span>
          </div>
          <div class="stat-item">
            <label>独立标签:</label>
            <span>{{ overallStats.totalTabs }}</span>
          </div>
          <h4>最常访问:</h4>
          <div v-for="(stat, index) in mostVisited" :key="stat.path" class="top-tab">
            {{ index + 1 }}. {{ stat.title }} ({{ stat.visitCount }}次)
          </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="toolbar-section">
        <h3>批量操作</h3>
        <button @click="toggleBatchMode">
          {{ batchMode ? '退出' : '进入' }}批量模式
        </button>
        <div v-if="batchMode" class="batch-controls">
          <button @click="selectAllTabs">全选</button>
          <button @click="invertSelection">反选</button>
          <button @click="clearSelection">清除</button>
          <button @click="closeSelected" :disabled="selectedCount === 0">
            关闭选中 ({{ selectedCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <div v-if="activeTab">
        <h1>{{ activeTab.title }}</h1>
        <div class="tab-info">
          <p><strong>路径:</strong> {{ activeTab.path }}</p>
          <p><strong>访问次数:</strong> {{ activeTab.visitCount }}</p>
          <p><strong>创建时间:</strong> {{ formatDate(activeTab.createdAt) }}</p>
          <p><strong>最后访问:</strong> {{ formatDate(activeTab.lastAccessedAt) }}</p>
          <p><strong>状态:</strong> {{ activeTab.status }}</p>
        </div>
      </div>
      <div v-else class="empty-state">
        请选择一个标签
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TabsContainer, useTabs } from '../src/vue'
import {
  createTemplateManager,
  createSearchEngine,
  createBatchOperationsManager,
  createBookmarkManager,
  createStatisticsAnalyzer,
  createTabStorage,
} from '../src/core'
import '../src/styles/index.css'

// 使用标签管理
const {
  tabs,
  activeTabId,
  activeTab,
  addTab,
  removeTab,
  activateTab,
  pinTab,
  closeOtherTabs,
  reopenLastClosedTab,
  manager,
} = useTabs({
  maxTabs: 15,
  persist: true,
  persistKey: 'vue-demo-tabs',
  defaultTabs: [
    { title: '首页', path: '/', icon: '🏠', pinned: true, closable: false },
  ],
})

// 创建扩展管理器
const storage = createTabStorage('vue-demo')
const templateManager = createTemplateManager(manager, storage)
const searchEngine = createSearchEngine(manager)
const batchOps = createBatchOperationsManager(manager)
const bookmarkManager = createBookmarkManager(manager, storage)
const statisticsAnalyzer = createStatisticsAnalyzer(manager, storage)

// 模板
const templates = ref(templateManager.getAllTemplates())
watch(() => manager.events, () => {
  manager.events.on('template:save', () => {
    templates.value = templateManager.getAllTemplates()
  })
  manager.events.on('template:delete', () => {
    templates.value = templateManager.getAllTemplates()
  })
}, { immediate: true })

// 搜索
const searchKeyword = ref('')
const searchResults = ref<any[]>([])

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    searchResults.value = searchEngine.search(searchKeyword.value, { limit: 10 })
  } else {
    searchResults.value = []
  }
}

// 书签
const bookmarks = ref(bookmarkManager.getAllBookmarks())

const openBookmark = (id: string) => {
  bookmarkManager.openBookmark(id)
}

const deleteBookmark = (id: string) => {
  bookmarkManager.deleteBookmark(id)
  bookmarks.value = bookmarkManager.getAllBookmarks()
}

// 统计
const showStats = ref(false)
const overallStats = computed(() => statisticsAnalyzer.getOverallStatistics())
const mostVisited = computed(() => statisticsAnalyzer.getMostVisitedTabs(5))

// 批量操作
const batchMode = computed(() => batchOps.isBatchMode)
const selectedCount = computed(() => batchOps.getSelectedCount())

const toggleBatchMode = () => {
  batchOps.toggleBatchMode()
}

const selectAllTabs = () => {
  batchOps.selectAll()
}

const invertSelection = () => {
  batchOps.invertSelection()
}

const clearSelection = () => {
  batchOps.clearSelection()
}

const closeSelected = () => {
  const count = batchOps.closeSelected()
  alert(`已关闭 ${count} 个标签`)
}

// 事件处理
const handleTabClick = (tab: any) => {
  activateTab(tab.id)
}

const handleTabClose = (tab: any) => {
  removeTab(tab.id)
}

const handleTabReorder = (from: number, to: number) => {
  manager.reorderTabs(from, to)
}

const handleAddTab = () => {
  const demoTabs = [
    { title: '用户管理', path: '/admin/users', icon: '👥' },
    { title: '系统设置', path: '/admin/settings', icon: '⚙️' },
    { title: '数据分析', path: '/analytics', icon: '📊' },
    { title: '文档中心', path: '/docs', icon: '📚' },
    { title: '帮助中心', path: '/help', icon: '❓' },
  ]
  
  const randomTab = demoTabs[Math.floor(Math.random() * demoTabs.length)]
  addTab(randomTab)
}

const handleSaveTemplate = () => {
  const template = templateManager.saveTemplate({
    name: `工作区 ${new Date().toLocaleString()}`,
    description: '当前打开的所有标签',
  })
  templates.value = templateManager.getAllTemplates()
  alert(`模板已保存: ${template.name}`)
}

const loadTemplate = (id: string) => {
  templateManager.loadTemplate(id)
}

const deleteTemplate = (id: string) => {
  templateManager.deleteTemplate(id)
  templates.value = templateManager.getAllTemplates()
}

const handleBookmarkCurrent = () => {
  if (activeTab.value) {
    const bookmark = bookmarkManager.addBookmarkFromTab(activeTab.value.id, '常用')
    if (bookmark) {
      bookmarks.value = bookmarkManager.getAllBookmarks()
      alert(`已收藏: ${bookmark.title}`)
    }
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.tabs-demo {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  overflow-y: auto;
  max-height: 300px;
}

.toolbar-section {
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.toolbar-section button {
  margin: 4px 4px 4px 0;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.toolbar-section button:hover {
  background: #f5f5f5;
  border-color: #999;
}

.toolbar-section button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-section input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.template-list,
.bookmark-list {
  margin-top: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.template-item,
.bookmark-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin: 4px 0;
  background: #f9f9f9;
  border-radius: 4px;
  font-size: 12px;
}

.search-results {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.search-result-item {
  padding: 8px;
  cursor: pointer;
  font-size: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.stats-panel {
  margin-top: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 12px;
}

.stat-item label {
  font-weight: 600;
  color: #666;
}

.stats-panel h4 {
  margin: 12px 0 8px;
  font-size: 12px;
  color: #666;
}

.top-tab {
  padding: 4px 0;
  font-size: 11px;
  color: #666;
}

.batch-controls {
  margin-top: 8px;
}

.content {
  flex: 1;
  padding: 24px;
  overflow: auto;
  background: white;
}

.content h1 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #333;
}

.tab-info {
  margin-top: 16px;
}

.tab-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.tab-info strong {
  color: #333;
  margin-right: 8px;
}

.empty-state {
  margin-top: 8px;
  padding: 12px;
  text-align: center;
  color: #999;
  font-size: 12px;
  background: #f9f9f9;
  border-radius: 4px;
}
</style>


