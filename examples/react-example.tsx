/**
 * @ldesign/tabs - React 完整示例
 * 
 * 本示例演示了如何在 React 应用中使用 @ldesign/tabs 包。
 * 包含以下功能：
 * - 基本的标签管理
 * - 模板系统
 * - 搜索功能
 * - 批量操作
 * - 书签功能
 * - 统计分析
 */

import React, { useState } from 'react'
import {
  TabsProvider,
  useTabsContext,
  TabsContainer,
} from '../src/react'
import {
  createTemplateManager,
  createSearchEngine,
  createBatchOperationsManager,
  createBookmarkManager,
  createStatisticsAnalyzer,
  createTabStorage,
} from '../src/core'
import '../src/styles/index.css'

/**
 * 主应用组件
 */
export function App() {
  return (
    <TabsProvider
      config={{
        maxTabs: 15,
        persist: true,
        persistKey: 'demo-app-tabs',
        defaultTabs: [
          { title: '首页', path: '/', icon: '🏠', pinned: true, closable: false },
        ],
      }}
    >
      <div className="app">
        <TabsDemo />
      </div>
    </TabsProvider>
  )
}

/**
 * 标签页演示组件
 */
function TabsDemo() {
  const {
    tabs,
    activeTabId,
    activeTab,
    addTab,
    removeTab,
    activateTab,
    pinTab,
    unpinTab,
    closeOtherTabs,
    reopenLastClosedTab,
    manager,
  } = useTabsContext()

  // 创建扩展管理器
  const storage = createTabStorage('demo-app')
  const [templateManager] = useState(() => createTemplateManager(manager, storage))
  const [searchEngine] = useState(() => createSearchEngine(manager))
  const [batchOps] = useState(() => createBatchOperationsManager(manager))
  const [bookmarkManager] = useState(() => createBookmarkManager(manager, storage))
  const [statistics] = useState(() => createStatisticsAnalyzer(manager, storage))

  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // 处理搜索
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword)
    if (keyword.trim()) {
      const results = searchEngine.search(keyword, { limit: 10 })
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  // 添加演示标签
  const addDemoTab = () => {
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

  // 保存当前为模板
  const handleSaveTemplate = () => {
    const template = templateManager.saveTemplate({
      name: `工作区 ${new Date().toLocaleString()}`,
      description: '当前打开的所有标签',
    })
    alert(`模板已保存: ${template.name}`)
  }

  // 收藏当前标签
  const handleBookmarkCurrent = () => {
    if (activeTab) {
      const bookmark = bookmarkManager.addBookmarkFromTab(activeTab.id, '常用')
      if (bookmark) {
        alert(`已收藏: ${bookmark.title}`)
      }
    }
  }

  // 获取统计信息
  const handleShowStats = () => {
    const stats = statistics.getOverallStatistics()
    alert(`
      总标签数: ${stats.totalTabs}
      总访问次数: ${stats.totalVisits}
      最常访问: ${stats.mostVisitedTab?.title || '无'}
    `)
  }

  return (
    <div className="tabs-demo">
      {/* 标签容器 */}
      <TabsContainer
        tabs={tabs}
        activeTabId={activeTabId}
        styleType="chrome"
        widthMode="shrink"
        size="md"
        onTabClick={(tab) => activateTab(tab.id)}
        onTabClose={(tab) => removeTab(tab.id)}
        onTabReorder={(from, to) => manager.reorderTabs(from, to)}
        onAddTab={addDemoTab}
      />

      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-section">
          <h3>基础操作</h3>
          <button onClick={addDemoTab}>添加随机标签</button>
          <button onClick={() => activeTab && pinTab(activeTab.id)}>
            固定当前标签
          </button>
          <button onClick={() => activeTab && closeOtherTabs(activeTab.id)}>
            关闭其他标签
          </button>
          <button onClick={reopenLastClosedTab}>
            重新打开最近关闭的标签
          </button>
        </div>

        <div className="toolbar-section">
          <h3>模板系统</h3>
          <button onClick={handleSaveTemplate}>保存为模板</button>
          <div>
            模板列表:
            {templateManager.getAllTemplates().map(template => (
              <div key={template.id}>
                {template.name}
                <button onClick={() => templateManager.loadTemplate(template.id)}>
                  加载
                </button>
                <button onClick={() => templateManager.deleteTemplate(template.id)}>
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>搜索功能</h3>
          <input
            type="text"
            placeholder="搜索标签..."
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(result => (
                <div
                  key={result.tab.id}
                  className="search-result-item"
                  onClick={() => activateTab(result.tab.id)}
                >
                  {result.tab.title} (评分: {result.score})
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-section">
          <h3>书签功能</h3>
          <button onClick={handleBookmarkCurrent}>收藏当前标签</button>
          <div>
            书签列表:
            {bookmarkManager.getAllBookmarks().map(bookmark => (
              <div key={bookmark.id}>
                {bookmark.title}
                <button onClick={() => bookmarkManager.openBookmark(bookmark.id)}>
                  打开
                </button>
                <button onClick={() => bookmarkManager.deleteBookmark(bookmark.id)}>
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>统计分析</h3>
          <button onClick={handleShowStats}>查看统计</button>
          <div>
            最常访问:
            {statistics.getMostVisitedTabs(5).map((stat, index) => (
              <div key={stat.path}>
                {index + 1}. {stat.title} - {stat.visitCount}次
              </div>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>批量操作</h3>
          <button onClick={() => batchOps.enableBatchMode()}>
            进入批量模式
          </button>
          {batchOps.isBatchMode && (
            <>
              <button onClick={() => batchOps.selectAll()}>全选</button>
              <button onClick={() => batchOps.invertSelection()}>反选</button>
              <button onClick={() => batchOps.clearSelection()}>清除选择</button>
              <button onClick={() => batchOps.closeSelected()}>关闭选中</button>
              <div>已选中: {batchOps.getSelectedCount()} 个</div>
            </>
          )}
        </div>
      </div>

      {/* 当前标签内容 */}
      <div className="content">
        {activeTab ? (
          <div>
            <h1>{activeTab.title}</h1>
            <p>路径: {activeTab.path}</p>
            <p>访问次数: {activeTab.visitCount}</p>
            <p>创建时间: {new Date(activeTab.createdAt).toLocaleString()}</p>
          </div>
        ) : (
          <div>请选择一个标签</div>
        )}
      </div>
    </div>
  )
}

// 样式（示例）
const styles = `
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.tabs-demo {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.toolbar-section {
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toolbar-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
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
}

.toolbar-section button:hover {
  background: #f5f5f5;
  border-color: #999;
}

.search-results {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-result-item {
  padding: 8px;
  cursor: pointer;
  font-size: 12px;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.content {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.content h1 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #333;
}

.content p {
  margin: 8px 0;
  color: #666;
}
`

export default App


