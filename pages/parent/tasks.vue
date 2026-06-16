<template>
	<view class="container">
		<view class="toolbar">
			<button class="toolbar-btn" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部任务</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '进行中' }" @click="setFilter('进行中')">进行中</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '已完成' }" @click="setFilter('已完成')">已完成</button>
		</view>
		
		<!-- 筛选区域 -->
		<view class="filter-section">
			<view class="filter-row">
				<view class="filter-item">
					<text class="filter-label">儿童</text>
					<uni-data-select
						v-model="filterChildId"
						:localdata="filterChildOptions"
						placeholder="全部"
					/>
				</view>
				<view class="filter-item">
					<text class="filter-label">类型</text>
					<uni-data-select
						v-model="filterTypeId"
						:localdata="filterTypeOptions"
						placeholder="全部"
					/>
				</view>
			</view>
			<view class="filter-row">
				<view class="filter-item">
					<text class="filter-label">开始时间</text>
					<uni-datetime-picker
						v-model="filterStartTime"
						type="date"
						return-type="timestamp"
						placeholder="选择开始时间"
					/>
				</view>
			</view>
		</view>

		<!-- AI生成任务浮动按钮 -->
		<view class="ai-float-btn" @click="showAIGenerate">
			<text class="ai-icon">🤖</text>
			<text class="ai-text">AI生成</text>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📋 任务列表</text>
				<view class="header-actions">
					<button v-if="selectedTasks.length > 0" class="batch-delete-btn" @click="batchDeleteTasks">
						🗑️ 删除选中({{ selectedTasks.length }})
					</button>
					<button v-if="filteredTasks.length > 0" class="select-all-btn" @click="toggleSelectAll">
						{{ isAllSelected ? '取消全选' : '全选' }}
					</button>
					<button class="add-btn" @click="creatTask">+ 新建任务</button>
				</view>
			</view>
			<view class="task-list">
				<view class="task-card" v-for="task in filteredTasks" :key="task.id">
					<view class="task-checkbox" @click.stop="toggleSelectTask(task.id)">
						<view class="checkbox" :class="{ checked: selectedTasks.includes(task.id) }">
							<text v-if="selectedTasks.includes(task.id)" class="check-icon">✓</text>
						</view>
					</view>
					<view class="task-icon">{{ getTaskIcon(task.type) }}</view>
					<view class="task-content">
						<view class="task-header">
							<text class="task-title">{{ task.title }}</text>
							<text class="task-difficulty" :class="task.difficulty">{{ getDifficultyText(task.difficulty) }}</text>
						</view>
						<text class="task-desc">{{ task.description }}</text>
						<view class="task-meta">
							<text class="meta-item">👧 {{ task.child_name }}</text>
							<text class="meta-item">⭐ {{ task.base_points }}积分</text>
							<text v-if="task.reward_points && (!task.need_audit || task.audit_status === 'approved')" class="meta-item reward">🎁 +{{ task.reward_points }}</text>
							<text v-if="task.reward_points && task.need_audit && task.audit_status !== 'approved'" class="meta-item audit-pending">🎁 待审核</text>
							<text class="meta-item type-tag">{{ task.type }}</text>
							<text v-if="task.textbook_name" class="meta-item textbook-tag">📚 {{ task.textbook_name }}</text>
						</view>
						<view class="task-footer">
							<text class="task-status" :class="task.status">{{ getStatusText(task.status) }}</text>
							<view class="task-actions">
								<text class="action-btn" @click="editTask(task)">✏️</text>
								<text class="action-btn" @click="deleteTask(task)">🗑️</text>
							</view>
						</view>
					</view>
				</view>
				<view v-if="filteredTasks.length === 0" class="empty-state">
					<text class="empty-icon">📭</text>
					<text class="empty-text">暂无任务数据</text>
					<text class="empty-hint">点击右上角按钮创建新任务</text>
				</view>
			</view>
		</view>

		<!-- 任务表单弹窗 -->
		<TaskFormModal
			:visible="showAddModal"
			:editing-task="editingTask"
			:task-types="taskTypes"
			:difficulties="difficulties"
			:children="children"
			:textbooks="textbooks"
			@close="showAddModal = false"
			@save="handleTaskSave"
		/>

		<!-- AI生成任务对话框 -->
		<AIChatModal
			:visible="showAIModal"
			:children="children"
			@close="showAIModal = false"
			@tasks-generated="handleTasksGenerated"
		/>
		
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import TaskFormModal from '@/components/TaskFormModal.vue'
	import AIChatModal from '@/components/AIChatModal.vue'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	import { cozeRequest } from '@/common/coze-request.js'
	import CategoryManager from '@/common/category-manager.js'
	export default {
		components: { customTabBar, TaskFormModal, AIChatModal },
		data() {
			return {
				tasks: [],
				currentFilter: 'all',  // 'all' | '进行中' | '已完成'
				showAddModal: false,
				editingTask: null,
				taskTypes: [],  // 任务类型选项（从localStorage获取）
				difficulties: [],         // 难度选项（从localStorage获取）
				children: [],            // 儿童列表
				childNames: [],
				parentPhone: '',
				// AI生成任务相关
				showAIModal: false,
				// 筛选相关
				filterChildId: '',      // 儿童筛选ID
				filterTypeId: '',       // 类型筛选值
				filterStartTime: new Date().setHours(0, 0, 0, 0),    // 开始时间筛选（时间戳），默认当天
				// 教材相关
				textbooks: [],           // 教材列表
				textbookNames: [],        // 教材名称列表
				// 批量删除相关
				selectedTasks: []        // 选中的任务ID列表
			}
		},
		computed: {
			// 任务类型选项（用于uni-data-select）
				taskTypeOptions() {
					return this.taskTypes.map(type => ({
						value: type,
						text: type
					}))
				},
				// 难度选项（用于uni-data-select）
				difficultyOptions() {
					return this.difficulties.map(diff => ({
						value: diff,
						text: diff
					}))
				},
				// 儿童选项（用于uni-data-select）
				childOptions() {
					return this.children.map((child, index) => ({
						value: index.toString(),
						text: child.name
					}))
				},
				// 筛选儿童选项（包含全部选项）
				filterChildOptions() {
					return [{
						value: '',
						text: '全部'
					}, ...this.children.map(child => ({
						value: child.child_id,
						text: child.name
					}))]
				},
				// 筛选类型选项（包含全部选项）
				filterTypeOptions() {
					return [{
						value: '',
						text: '全部'
					}, ...this.taskTypes.map(type => ({
						value: type,
						text: type
					}))]
				},
				// 教材选项（用于uni-data-select）
				textbookOptions() {
					return this.textbooks.map(textbook => ({
						value: textbook.id,
						text: textbook.name
					}))
				},
				// 模板选项（用于uni-data-select）
				templateOptions() {
					return this.templates.map((template, index) => ({
						value: index.toString(),
						text: template.title || '未命名模板'
					}))
				},
				// 是否全选
				isAllSelected() {
					return this.filteredTasks.length > 0 && 
						   this.selectedTasks.length === this.filteredTasks.length
				},
			filteredTasks() {
				// 后端已处理筛选，直接返回任务列表
				return this.tasks
			}
		},
		watch: {
			filterChildId() {
				this.loadTasks()
			},
			filterTypeId() {
				this.loadTasks()
			},
			filterStartTime() {
				this.loadTasks()
			}
		},
		methods: {
			getTaskIcon(type) {
				const icons = {
					reading: '📖',
					math: '🧮',
					english: '🔤',
					art: '🎨',
					sports: '⚽',
					music: '🎵',
					science: '🔬',
					default: '📝'
				}
				return icons[type] || icons.default
			},
			getDifficultyText(difficulty) {
				if (!difficulty) return '简单'
				// 如果 difficulty 已经是中文，直接返回
				if (['简单', '中等', '困难'].includes(difficulty)) {
					return difficulty
				}
				// 英文标识转中文，以及同义词映射
				const texts = { 
					easy: '简单', 
					medium: '中等', 
					hard: '困难',
					'适中': '中等',
					'moderate': '中等'
				}
				return texts[difficulty] || difficulty
			},
			getStatusText(status) {
				const texts = { active: '进行中', completed: '已完成', paused: '已暂停' }
				return texts[status] || status
			},
			creatTask(){
				this.editingTask = null
				this.showAddModal = true
			},
			editTask(task) {
				this.editingTask = task
				this.showAddModal = true
			},
			deleteTask(task) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除任务 "${task.title}" 吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							try {
								const success = await this.deleteTaskFromTable(task.id)
								if (success) {
									this.tasks = this.tasks.filter(t => t.id !== task.id)
									// 从选中列表中移除
									this.selectedTasks = this.selectedTasks.filter(id => id !== task.id)
									uni.showToast({ title: '删除成功', icon: 'success' })
								} else {
									uni.showToast({ title: '删除失败', icon: 'none' })
								}
							} catch (error) {
								console.error('[Tasks] 删除任务失败:', error)
								uni.showToast({ title: '删除失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			// 切换任务选中状态
			toggleSelectTask(taskId) {
				const index = this.selectedTasks.indexOf(taskId)
				if (index > -1) {
					this.selectedTasks.splice(index, 1)
				} else {
					this.selectedTasks.push(taskId)
				}
			},
			// 全选/取消全选
			toggleSelectAll() {
				if (this.isAllSelected) {
					this.selectedTasks = []
				} else {
					this.selectedTasks = this.filteredTasks.map(task => task.id)
				}
			},
			// 批量删除任务
			batchDeleteTasks() {
				uni.showModal({
					title: '确认批量删除',
					content: `确定要删除选中的 ${this.selectedTasks.length} 个任务吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							try {
								let successCount = 0
								for (const taskId of this.selectedTasks) {
									const success = await this.deleteTaskFromTable(taskId)
									if (success) {
										successCount++
									}
								}
								this.tasks = this.tasks.filter(t => !this.selectedTasks.includes(t.id))
								this.selectedTasks = []
								if (successCount === 0) {
									uni.showToast({ title: '全部删除失败', icon: 'none' })
								} else if (successCount < this.selectedTasks.length) {
									uni.showToast({ title: `部分删除成功（${successCount}/${this.selectedTasks.length}）`, icon: 'none' })
								} else {
									uni.showToast({ title: '全部删除成功', icon: 'success' })
								}
							} catch (error) {
								console.error('[Tasks] 批量删除任务失败:', error)
								uni.showToast({ title: '删除失败', icon: 'none' })
							}
							uni.hideLoading()
						}
					}
				})
			},
			// 将时间戳转换为日期字符串 YYYY-MM-DD
			formatTimestampToDate(timestamp) {
				if (!timestamp) return ''
				const date = new Date(parseInt(timestamp))
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			},
			showAIGenerate() {
				this.showAIModal = true
			},
			// 处理任务保存
			async handleTaskSave({ data, isEdit, editId, isBatch = false }) {
				uni.showLoading({ title: '保存中...' })

				try {
					if (isEdit) {
						const success = await this.updateTaskToTable(editId, data)
						if (success) {
							const index = this.tasks.findIndex(t => t.id === editId)
							if (index >= 0) {
								this.tasks[index] = { ...this.tasks[index], ...data }
							}
						}
						// 先关闭弹窗再显示提示
						this.editingTask = null
						this.showAddModal = false
						uni.hideLoading()
						uni.showToast({ title: success ? '修改成功' : '修改失败', icon: success ? 'success' : 'none' })
					} else if (isBatch && Array.isArray(data)) {
						// 批量创建任务 - 使用批量添加接口
						const taskRecords = data.map(task => ({
							title: task.title,
							description: task.description,
							type: task.type,
							difficulty: task.difficulty,
							base_points: task.base_points,
							reward_points: task.reward_points || 0,
							start_time: task.start_time,
							deadline_time: task.deadline_time || '',
							need_audit: task.need_audit || false,
							child_id: task.child_id,
							textbook_id: task.textbook_id || '',
							status: task.status || '进行中'
						}))

						const result = await feishuRequest.batchAddRecords('任务表', taskRecords)
						if (result.success && result.records) {
							// 将创建的任务添加到列表
							result.records.forEach((record, index) => {
								this.tasks.unshift({
									id: record.record_id,
									...data[index],
									status: '未开始'
								})
							})
						}

						// 检查是否需要保存为模板（使用第一个任务的数据）
						if (data.length > 0 && data[0].saveAsTemplate && data[0].template_title) {
							await this.addTemplate(data[0])
						}

						// 先关闭弹窗再显示提示
						this.editingTask = null
						this.showAddModal = false
						uni.hideLoading()
						uni.showToast({ 
							title: result.success && result.records ? `成功创建 ${result.records.length} 个任务` : '批量创建失败', 
							icon: result.success && result.records ? 'success' : 'none' 
						})
					} else {
						const recordId = await this.addTaskToTable(data)
						if (recordId) {
							this.tasks.unshift({
								id: recordId,
								...data,
								status: '未开始'
							})
						}

						// 检查是否需要保存为模板
						if (data.saveAsTemplate && data.template_title) {
							await this.addTemplate(data)
						}

						// 先关闭弹窗再显示提示
						this.editingTask = null
						this.showAddModal = false
						uni.hideLoading()
						uni.showToast({ title: recordId ? '创建成功' : '创建失败', icon: recordId ? 'success' : 'none' })
					}
				} catch (error) {
					console.error('[Tasks] 保存任务失败:', error)
					// 先关闭弹窗再显示提示
					this.editingTask = null
					this.showAddModal = false
					uni.hideLoading()
					uni.showToast({ title: '保存失败', icon: 'none' })
				}
			},
			// 添加模板
			async addTemplate(taskData) {
				try {
					const templateData = {
						template_title: taskData.template_title,
						template_description: taskData.template_description || '',
						title: taskData.title,
						description: taskData.description,
						type: taskData.type,
						difficulty: taskData.difficulty,
						base_points: taskData.base_points,
						reward_points: taskData.reward_points || 0,
						need_audit: taskData.need_audit || false,
						child_id: taskData.child_id,
						textbook_id: taskData.textbook_id || ''
					}
					// 日期时间字段只有在有值时才添加（飞书API要求必须是Unix时间戳）
					if (taskData.deadline_time) {
						templateData.deadline_time = Number(taskData.deadline_time)
					}
					if (taskData.start_time) {
						templateData.start_time = Number(taskData.start_time)
					}
					await feishuRequest.addRecord('任务模板表', templateData)
					console.log('[Tasks] 模板创建成功')
				} catch (error) {
					console.error('[Tasks] 创建模板失败:', error)
				}
			},
			// 处理AI生成任务
			async handleGenerateTasks({ prompt, count, difficulty }) {
				uni.showLoading({ title: 'AI生成中...' })

				try {
					// 获取儿童信息
					const child = this.children[0]
					if (!child) {
						uni.hideLoading()
						uni.showToast({ title: '请先添加儿童信息', icon: 'none' })
						return
					}

					// 构建用户信息
					const userInfo = {
						name: child.name,
						grade: child.grade || '',
						age: child.age || '',
						interests: child.interests || ''
					}

					// 构建请求参数
					const params = cozeRequest.buildTaskParams(
						prompt,
						count,
						difficulty,
						userInfo
					)

					console.log('[Tasks] Coze请求参数:', params)

					// 调用Coze流式工作流
					const tasks = []
					let hasError = false
					let errorMessage = ''

					await new Promise((resolve) => {
						cozeRequest.generateTasksStream(
							params,
							(data) => {
								// 流式数据回调
								console.log('[Tasks] 收到流式数据:', data)
								if (data.tasks && Array.isArray(data.tasks)) {
									tasks.push(...data.tasks)
								} else if (data.task) {
									tasks.push(data.task)
								} else if (data.error) {
									hasError = true
									errorMessage = data.error
								} else if (data.data && data.data.tasks) {
									tasks.push(...data.data.tasks)
								}
							},
							(error) => {
								// 错误回调
								hasError = true
								errorMessage = error
								resolve()
							},
							() => {
								// 完成回调
								resolve()
							}
						)
					})

					if (hasError) {
						uni.hideLoading()
						uni.showToast({ title: errorMessage || '生成失败', icon: 'none' })
						return
					}

					// 如果流式请求没返回数据，尝试非流式请求
					if (tasks.length === 0) {
						const result = await cozeRequest.generateTasks(params)
						if (result.success && result.data) {
							if (result.data.tasks && Array.isArray(result.data.tasks)) {
								tasks.push(...result.data.tasks)
							} else if (result.data.task) {
								tasks.push(result.data.task)
							} else if (result.data.data && result.data.data.tasks) {
								tasks.push(...result.data.data.tasks)
							}
						} else {
							uni.hideLoading()
							uni.showToast({ title: result.message || '生成失败', icon: 'none' })
							return
						}
					}

					// 保存生成的任务
					if (tasks.length > 0) {
						const childId = child.id || ''
						for (const task of tasks) {
							const taskData = {
								title: task.title || '未命名任务',
								description: task.description || '',
								type: task.type || '学习任务',
								difficulty: task.difficulty || difficulty,
								base_points: task.base_points || 10,
								reward_points: task.reward_points || 0,
								start_time: new Date().getTime(),
								deadline_time: task.deadline_time || '',
								need_audit: task.need_audit || false,
								child_id: childId,
								textbook_id: task.textbook_id || '',
								status: '未开始'
							}
							const recordId = await this.addTaskToTable(taskData)
							if (recordId) {
								this.tasks.unshift({
									id: recordId,
									...taskData
								})
							}
						}
						uni.hideLoading()
						uni.showToast({ title: `成功生成 ${tasks.length} 个任务`, icon: 'success' })
					} else {
						uni.hideLoading()
						uni.showToast({ title: '未生成任何任务', icon: 'none' })
					}

					this.showAIModal = false
					this.loadTasks()
				} catch (error) {
				console.error('[Tasks] AI生成任务失败:', error)
				uni.hideLoading()
				uni.showToast({ title: '生成失败: ' + (error.message || error), icon: 'none' })
				this.showAIModal = false
			}
		},
		// 处理AI对话框生成的任务
		async handleTasksGenerated(tasks) {
			if (!tasks || tasks.length === 0) {
				return
			}

			uni.showLoading({ title: '保存任务中...' })

			try {
				const child = this.children[0]
				if (!child) {
					uni.hideLoading()
					uni.showToast({ title: '请先添加儿童信息', icon: 'none' })
					return
				}

				const childId = child.id || ''
				let successCount = 0

				for (const task of tasks) {
					const taskData = {
						title: task.title || '未命名任务',
						description: task.description || '',
						type: task.type || '学习任务',
						difficulty: task.difficulty || '简单',
						base_points: task.base_points || 10,
						reward_points: task.reward_points || 0,
						start_time: new Date().getTime(),
						deadline_time: task.deadline_time || '',
						need_audit: task.need_audit || false,
						child_id: childId,
						textbook_id: task.textbook_id || '',
						status: '未开始'
					}
					const recordId = await this.addTaskToTable(taskData)
					if (recordId) {
						this.tasks.unshift({
							id: recordId,
							...taskData
						})
						successCount++
					}
				}

				uni.hideLoading()
				if (successCount > 0) {
					uni.showToast({ title: `成功保存 ${successCount} 个任务`, icon: 'success' })
				} else {
					uni.showToast({ title: '保存失败', icon: 'none' })
				}
			} catch (error) {
				console.error('[Tasks] 保存AI生成任务失败:', error)
				uni.hideLoading()
				uni.showToast({ title: '保存失败: ' + (error.message || error), icon: 'none' })
			}
		},
		async loadCategories() {
				try {
					const categories = await CategoryManager.loadCategories('tasks-page')
					if (categories) {
						// 任务类型从分类表的 task_type 字段获取
						if (categories.task_type && categories.task_type.length > 0) {
							this.taskTypes = categories.task_type.map(t => t.label)
						} else {
							this.loadCategoriesFromStorage()
						}
						// 难度等级从分类表的 task_difficulty 字段获取
						if (categories.task_difficulty && categories.task_difficulty.length > 0) {
							this.difficulties = categories.task_difficulty.map(d => d.label)
						} else {
							this.loadDifficultiesFromStorage()
						}
						// 任务状态从分类表的 task_status 字段获取
						if (categories.task_status && categories.task_status.length > 0) {
							this.taskStatuses = categories.task_status.map(s => s.label)
						} else {
							this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
						}
					} else {
						// 分类数据加载失败，从 localStorage 获取
						this.loadCategoriesFromStorage()
						this.loadDifficultiesFromStorage()
						this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
					}
				} catch (error) {
					console.error('[Tasks] 加载分类数据失败:', error)
					// 异常情况从 localStorage 获取
					this.loadCategoriesFromStorage()
					this.loadDifficultiesFromStorage()
					this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
				}
			},
			loadCategoriesFromStorage() {
				try {
					this.taskTypes = CategoryManager.getTaskTypes()
					console.log('this.taskTypes------', this.taskTypes);
				} catch (error) {
					console.error('[Tasks] 从CategoryManager加载任务类型失败:', error)
					this.taskTypes = []
				}
			},
			loadDifficultiesFromStorage() {
				try {
					this.difficulties = CategoryManager.getDifficulties()
					console.log('this.difficulties------', this.difficulties);
				} catch (error) {
					console.error('[Tasks] 从CategoryManager加载难度失败:', error)
					this.difficulties = []
				}
			},
			async loadChildren() {
				try {
					const parent = await UserManager.getCurrentParent()
					if (parent && parent.phone) {
						this.parentPhone = parent.phone
						const childList = await UserManager.getChildrenByParent(parent.phone)
						this.children = childList.map(child => ({
							...child,
							name: child.name 
								? (Array.isArray(child.name) && child.name[0] && child.name[0].text 
									? child.name[0].text 
									: child.name)
								: ''
						}))
						this.childNames = this.children.map(c => c.name)
					}
				} catch (error) {
					console.error('[Tasks] 加载儿童列表失败:', error)
				}
			},
			async loadTextbooks() {
				try {
					const result = await feishuRequest.queryRecords('教材表')
					if (result.success && result.data && result.data.length > 0) {
						this.textbooks = result.data.map(item => {
							const name = item.fields.name 
								? (Array.isArray(item.fields.name) && item.fields.name[0] && item.fields.name[0].text 
									? item.fields.name[0].text 
									: item.fields.name)
								: ''
							return {
								id: item.fields.id || item.record_id,
								name: name,
								subject: item.fields.subject || ''
							}
						})
						this.textbookNames = this.textbooks.map(t => t.name)
					}
				} catch (error) {
					console.error('[Tasks] 加载教材列表失败:', error)
				}
			},
			getChildName(childId) {
				if (!childId) return '未关联'
				// 处理多种格式的childId
				const childIdStr = this.normalizeChildId(childId)
				const child = this.children.find(c => {
					const childKey = c.child_id || c.id || c.record_id
					const childKeyStr = this.normalizeChildId(childKey)
					return childKeyStr === childIdStr || 
						   childKeyStr.includes(childIdStr) || 
						   childIdStr.includes(childKeyStr)
				})
				return child ? child.name : '未知儿童'
			},
			normalizeChildId(id) {
				if (!id) return ''
				if (typeof id === 'string') return id.trim()
				if (Array.isArray(id)) {
					if (id[0] && id[0].text !== undefined) return id[0].text.trim()
					if (id[0] && typeof id[0] === 'string') return id[0].trim()
					return JSON.stringify(id)
				}
				if (typeof id === 'object') {
					if (id.value && Array.isArray(id.value) && id.value[0] && id.value[0].text) {
						return id.value[0].text.trim()
					}
					if (id.text) return String(id.text).trim()
					return JSON.stringify(id)
				}
				return String(id).trim()
			},
			parseChildName(childName) {
				if (!childName) return '未关联'
				// 支持数据结构：{ type: 1, value: [{ text: "顺顺" }] }
				if (typeof childName === 'object') {
					if (childName.value && Array.isArray(childName.value) && childName.value[0] && childName.value[0].text) {
						return childName.value[0].text.trim()
					}
					if (childName.text) return String(childName.text).trim()
					if (Array.isArray(childName) && childName[0] && childName[0].text) {
						return childName[0].text.trim()
					}
				}
				if (typeof childName === 'string') return childName.trim()
				return '未知儿童'
			},
			parseTextbookName(textbookId) {
				if (!textbookId) return ''
				// 从已加载的教材列表中查找教材名称
				const textbook = this.textbooks.find(t => t.id === textbookId)
				if (textbook) return textbook.name
				return ''
			},
			// 解析飞书多维表格的字段值（可能是 {value: [{text: 'xxx'}] } 或直接是字符串）
			parseFeishuField(value) {
				if (!value) return ''
				// 如果是字符串，直接返回
				if (typeof value === 'string') return value
				// 如果是数组且第一个元素有 text 属性
				if (Array.isArray(value) && value[0] && value[0].text) return value[0].text
				// 如果是对象且有 value 属性（{value: [{text: 'xxx'}]}）
				if (typeof value === 'object' && value.value) {
					if (Array.isArray(value.value) && value.value[0] && value.value[0].text) {
						return value.value[0].text
					}
				}
				return ''
			},
			setFilter(filter) {
				this.currentFilter = filter
			},
			async loadTasks() {
				uni.showLoading({ title: '加载中...' })
				try {
					// 构建筛选条件
					const filter = {}
					
					// 儿童筛选
					if (this.filterChildId) {
						filter.child_id = this.filterChildId
					}
					
					// 类型筛选
					if (this.filterTypeId) {
						filter.type = this.filterTypeId
					}
					
					// 开始时间筛选（使用数组格式）
					if (this.filterStartTime) {
						filter.start_time = ["ExactDate", this.filterStartTime.toString()]
					}
					
					const result = await feishuRequest.queryRecords('任务表', filter)
					
					if (result.success && result.data && result.data.length > 0) {
						this.tasks = result.data.map(item => {
							const title = item.fields.title 
								? (Array.isArray(item.fields.title) && item.fields.title[0] && item.fields.title[0].text 
									? item.fields.title[0].text 
									: item.fields.title)
								: ''
							
							const description = item.fields.description 
								? (Array.isArray(item.fields.description) && item.fields.description[0] && item.fields.description[0].text 
									? item.fields.description[0].text 
									: item.fields.description)
								: ''
							
							// 使用 normalizeChildId 统一处理 child_id
							const childId = this.normalizeChildId(item.fields.child_id || item.fields.childId || '')
							
							// 解析 child_name，支持多种数据结构
							const childName = this.parseChildName(item.fields.child_name)
							
							// 获取奖励积分和审核相关字段
								const reward_points = item.fields.reward_points || 0
								const need_audit = item.fields.need_audit || false
								const audit_status = item.fields.audit_status || 'pending'
								
								// 解析教材名称
								const textbookName = this.parseTextbookName(item.fields.textbook_id)
								
								// 解析任务类型（可能是飞书嵌套格式）
								const taskType = this.parseFeishuField(item.fields.type) || ''
								
								// 解析难度等级（可能是飞书嵌套格式）
								const difficulty = this.parseFeishuField(item.fields.difficulty) || '简单'
								
								// 解析开始时间
								const startTime = item.fields.start_time || null
								
								return {
									id: item.record_id,
									title: title,
									description: description,
									type: taskType,
									type_text: item.fields.type_text || '',
									difficulty: difficulty,
									base_points: item.fields.base_points || 0,
									reward_points: reward_points,
									need_audit: need_audit,
									audit_status: audit_status,
									child_id: childId,
									child_name: childName,
									textbook_id: item.fields.textbook_id || '',
									textbook_name: textbookName,
									status: item.fields.status || '未开始',
									start_time: startTime,
									updated_at: item.fields.updated_at || item.created_at || Date.now()
								}
						})
						this.tasks.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
					} else {
						this.tasks = []
					}
				} catch (error) {
					console.error('[Tasks] 加载任务列表失败:', error)
					this.tasks = []
				}
				uni.hideLoading()
			},
			async addTaskToTable(taskData) {
				try {
					const data = {
						title: taskData.title,
						description: taskData.description,
						type: taskData.type,
						difficulty: taskData.difficulty,
						base_points: taskData.base_points,
						need_audit: taskData.need_audit || false,
						child_id: taskData.child_id,
						status: taskData.status || '进行中'
					}
					// 只有有值时才添加字段
					if (taskData.reward_points && taskData.reward_points > 0) {
						data.reward_points = taskData.reward_points
					}
					if (taskData.start_time) {
						data.start_time = Number(taskData.start_time)
					}
					if (taskData.deadline_time) {
						data.deadline_time = Number(taskData.deadline_time)
					}
					if (taskData.textbook_id) {
						data.textbook_id = taskData.textbook_id
					}
					const result = await feishuRequest.addRecord('任务表', data)
					if (result.success) {
						return result.recordId
					}
					return null
				} catch (error) {
					console.error('[Tasks] 添加任务失败:', error)
					return null
				}
			},
			async updateTaskToTable(taskId, taskData) {
				try {
					const data = {
						title: taskData.title,
						description: taskData.description,
						type: taskData.type,
						type_text: taskData.type_text,
						difficulty: taskData.difficulty,
						base_points: taskData.base_points,
						need_audit: taskData.need_audit || false,
						child_id: taskData.child_id,
						child_name: taskData.child_name
					}
					// 只有有值时才添加字段
					if (taskData.reward_points && taskData.reward_points > 0) {
						data.reward_points = taskData.reward_points
					}
					if (taskData.deadline_time) {
						data.deadline_time = taskData.deadline_time
					}
					if (taskData.textbook_id) {
						data.textbook_id = taskData.textbook_id
					}
					const result = await feishuRequest.updateRecord('任务表', taskId, data)
					if (result.success) {
						return true
					}
					return false
				} catch (error) {
					console.error('[Tasks] 更新任务失败:', error)
					return false
				}
			},
			async deleteTaskFromTable(taskId) {
				try {
					const result = await feishuRequest.deleteRecord('任务表', taskId)
					if (result.success) {
						return true
					}
					return false
				} catch (error) {
					console.error('[Tasks] 删除任务失败:', error)
					return false
				}
			}
		},
		async onLoad() {
			await this.loadChildren()
			await this.loadCategories()
			await this.loadTextbooks()
		},
		async onShow() {
			if (this.$refs.tabBar) {
				this.$refs.tabBar.updateSelected('/pages/parent/tasks')
			}
			await this.loadTasks()
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 120rpx;
	}

	.toolbar {
		display: flex;
		background-color: #fff;
		padding: 20rpx;
		gap: 10rpx;
	}

	.toolbar-btn {
		flex: 1;
		height: 70rpx;
		border-radius: 35rpx;
		font-size: 26rpx;
		border: 2rpx solid #e8e8e8;
		background-color: #fff;
		color: #666;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
			border: none;
		}
	}

	.filter-section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
		position: relative;
		z-index: 10;
	}

	.filter-row {
		display: flex;
		gap: 30rpx;
	}

	.filter-item {
		flex: 1;
	}

	.filter-label {
		font-size: 26rpx;
		color: #666;
		display: block;
		margin-bottom: 12rpx;
		font-weight: 500;
	}

	.filter-picker {
		width: 100%;
		height: 80rpx;
		padding: 0 24rpx;
		border: 2rpx solid #f0f0f0;
		border-radius: 12rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #333;
		background-color: #fafafa;
		transition: all 0.2s ease;

		&:active {
			background-color: #f0f0f0;
			border-color: #667eea;
		}
	}

	.ai-float-btn {
		position: fixed;
		top: 200rpx;
		right: 30rpx;
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		border-radius: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 32rpx rgba(79, 172, 254, 0.4);
		z-index: 100;
	}

	.ai-icon {
		font-size: 40rpx;
		margin-bottom: 4rpx;
	}

	.ai-text {
		font-size: 20rpx;
		color: #fff;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 25rpx;
	}

	.header-actions {
		display: flex;
		gap: 15rpx;
		align-items: center;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.add-btn {
		height: 60rpx;
		padding: 0 25rpx;
		border-radius: 30rpx;
		font-size: 26rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
	}

	.batch-delete-btn {
		height: 60rpx;
		padding: 0 20rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
		background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
		color: #fff;
		border: none;
	}

	.select-all-btn {
		height: 60rpx;
		padding: 0 20rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		color: #fff;
		border: none;
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		min-height: 400rpx;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 40rpx;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}

	.empty-text {
		font-size: 32rpx;
		color: #999;
		margin-bottom: 15rpx;
	}

	.empty-hint {
		font-size: 26rpx;
		color: #ccc;
	}

	.task-card {
		display: flex;
		padding: 25rpx;
		background-color: #fafafa;
		border-radius: 16rpx;
		align-items: center;
	}

	.task-checkbox {
		margin-right: 15rpx;
	}

	.checkbox {
		width: 40rpx;
		height: 40rpx;
		border: 3rpx solid #ccc;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #fff;
		transition: all 0.2s ease;

		&.checked {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			border-color: #667eea;
		}
	}

	.check-icon {
		color: #fff;
		font-size: 24rpx;
		font-weight: bold;
	}

	.task-icon {
		font-size: 50rpx;
		margin-right: 20rpx;
	}

	.task-content {
		flex: 1;
	}

	.task-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.task-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.task-difficulty {
		font-size: 22rpx;
		padding: 6rpx 12rpx;
		border-radius: 10rpx;

		&.easy {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.medium {
			background-color: #fff3e0;
			color: #ff9500;
		}

		&.hard {
			background-color: #ffebee;
			color: #f44336;
		}
	}

	.task-desc {
		font-size: 24rpx;
		color: #999;
		display: block;
		margin-bottom: 15rpx;
	}

	.task-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
		margin-bottom: 15rpx;
	}

	.meta-item {
		font-size: 22rpx;
		color: #666;

		&.reward {
			color: #ff9500;
			font-weight: bold;
		}

		&.audit-pending {
			color: #999;
			font-style: italic;
		}
	}

	.task-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.task-status {
		font-size: 22rpx;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;

		&.active {
			background-color: #e3f2fd;
			color: #2196f3;
		}

		&.completed {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.paused {
			background-color: #f5f5f5;
			color: #999;
		}
	}

	.task-actions {
		display: flex;
		gap: 15rpx;
	}

	.action-btn {
		width: 50rpx;
		height: 50rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: #fff;
		font-size: 24rpx;
	}

	</style>