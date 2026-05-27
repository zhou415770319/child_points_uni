<template>
	<view class="container">
		<view class="toolbar">
			<button class="toolbar-btn" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">全部任务</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '进行中' }" @click="setFilter('进行中')">进行中</button>
			<button class="toolbar-btn" :class="{ active: currentFilter === '已完成' }" @click="setFilter('已完成')">已完成</button>
		</view>

		<!-- AI生成任务浮动按钮 -->
		<view class="ai-float-btn" @click="showAIGenerate">
			<text class="ai-icon">🤖</text>
			<text class="ai-text">AI生成</text>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📋 任务列表</text>
				<button class="add-btn" @click="showAddModal = true">+ 新建任务</button>
			</view>
			<view class="task-list">
				<view class="task-card" v-for="task in filteredTasks" :key="task.id">
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
							<text class="meta-item">{{ task.type_text }}</text>
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
			</view>
		</view>

		<view class="modal-overlay" v-if="showAddModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ editingTask ? '编辑任务' : '新建任务' }}</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">任务标题</text>
						<input class="form-input" v-model="formData.title" placeholder="请输入任务标题" />
					</view>
					<view class="form-item">
						<text class="form-label">任务描述</text>
						<textarea class="form-textarea" v-model="formData.description" placeholder="请输入任务描述"></textarea>
					</view>
					<view class="form-item">
						<text class="form-label">任务类型</text>
						<CustomPicker 
							:options="taskTypes" 
							v-model="typeIndex" 
							:title="'选择任务类型'" 
							:placeholder="'请选择类型'"
							:auto-select-first="false"
							@change="onTypeChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">难度等级</text>
						<CustomPicker 
							:options="difficulties" 
							v-model="difficultyIndex" 
							:title="'选择难度等级'" 
							:placeholder="'请选择难度'"
							:auto-select-first="false"
							@change="onDifficultyChange"
						/>
					</view>
					<view class="form-item">
						<text class="form-label">基础积分</text>
						<input class="form-input" type="number" v-model="formData.base_points" placeholder="请输入基础积分" />
					</view>
					<view class="form-item">
						<text class="form-label">关联儿童</text>
						<CustomPicker 
							:options="childNames" 
							v-model="childIndex" 
							:title="'选择关联儿童'" 
							:placeholder="'请选择儿童'"
							:auto-select-first="false"
							@change="onChildChange"
						/>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeModal">取消</button>
					<button class="btn btn-primary" @click="saveTask">保存</button>
				</view>
			</view>
		</view>

		<!-- AI生成任务弹窗 -->
		<view class="modal-overlay" v-if="showAIModal" @click="closeAIModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">🤖 AI生成任务</text>
					<text class="modal-close" @click="closeAIModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">生成主题</text>
						<input class="form-input" v-model="aiPrompt" placeholder="例如：为三年级学生生成一周阅读任务" />
					</view>
					<view class="form-item">
						<text class="form-label">任务数量</text>
						<picker :value="taskCountIndex" :range="taskCounts" @change="onTaskCountChange">
							<view class="form-picker">
								{{ taskCounts[taskCountIndex] }} 个
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
					<view class="form-item">
						<text class="form-label">难度等级</text>
						<picker :value="aiDifficultyIndex" :range="difficulties" @change="onAIDifficultyChange">
							<view class="form-picker">
								{{ difficulties[aiDifficultyIndex] }}
								<text class="picker-arrow">›</text>
							</view>
						</picker>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="closeAIModal">取消</button>
					<button class="btn btn-primary" @click="generateTasks">生成</button>
				</view>
			</view>
		</view>
		
		<custom-tab-bar ref="tabBar"></custom-tab-bar>
	</view>
</template>

<script>
	import customTabBar from '@/custom-tab-bar/index.vue'
	import CustomPicker from '@/components/CustomPicker.vue'
	import UserManager from '@/common/user-manager.js'
	import { feishuRequest } from '@/common/feishu-request.js'
	import CategoryManager from '@/common/category-manager.js'
	export default {
		components: { customTabBar, CustomPicker },
		data() {
			return {
				tasks: [],
				currentFilter: 'all',  // 'all' | '进行中' | '已完成'
				showAddModal: false,
				editingTask: null,
				formData: {
					title: '',
					description: '',
					type: '',
					type_text: '',
					difficulty: '',
					base_points: '',
					child_name: '',
					child_id: ''
				},
				taskTypes: ['阅读', '数学', '英语', '美术', '体育', '音乐', '科学'],  // 任务类型选项
				typeIndex: -1,
				difficulties: ['简单', '中等', '困难'],         // 难度选项
				difficultyIndex: -1,
				children: [],            // 儿童列表
				childIndex: -1,
				childNames: [],
				parentPhone: '',
				// AI生成任务相关
				showAIModal: false,
				aiPrompt: '',
				taskCounts: [3, 5, 7, 10],
				taskCountIndex: 1,
				aiDifficultyIndex: 1  // AI弹窗专用的难度索引
			}
		},
		computed: {
			filteredTasks() {
				if (this.currentFilter === 'all') {
					return this.tasks
				}
				return this.tasks.filter(task => task.status === this.currentFilter)
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
				// 如果 difficulty 已经是中文，直接返回
				if (['简单', '中等', '困难'].includes(difficulty)) {
					return difficulty
				}
				// 英文标识转中文
				const texts = { easy: '简单', medium: '中等', hard: '困难' }
				return texts[difficulty] || difficulty
			},
			getStatusText(status) {
				const texts = { active: '进行中', completed: '已完成', paused: '已暂停' }
				return texts[status] || status
			},
			editTask(task) {
				this.editingTask = task
				this.formData = {
					title: task.title,
					description: task.description,
					type: task.type,
					type_text: task.type_text,
					difficulty: task.difficulty,
					base_points: task.base_points.toString(),
					child_name: task.child_name,
					child_id: task.child_id
				}
				// 任务类型回显：优先使用type_text，找不到则使用type
				const typeIdx = this.taskTypes.indexOf(task.type_text)
				this.typeIndex = typeIdx >= 0 ? typeIdx : (this.taskTypes.indexOf(task.type) >= 0 ? this.taskTypes.indexOf(task.type) : -1)
				// 难度回显：从分类表获取的难度值是中文，直接匹配
				// task.difficulty 可能是英文标识（easy/medium/hard）或中文（简单/中等/困难）
				const difficultyText = this.getDifficultyText(task.difficulty)
				this.difficultyIndex = this.difficulties.indexOf(difficultyText)
				if (this.difficultyIndex === -1) {
					// 如果找不到，尝试直接匹配原始值
					this.difficultyIndex = this.difficulties.indexOf(task.difficulty)
				}
				// 关联儿童回显：根据child_id匹配儿童索引
				this.childIndex = this.children.findIndex(c => c.child_id === task.child_id || c.id === task.child_id)
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
			// CustomPicker的change事件处理 - 任务类型
			onTypeChange(index, option) {
				this.formData.type_text = option
				this.formData.type = option
			},
			// CustomPicker的change事件处理 - 难度等级
			onDifficultyChange(index, option) {
				this.formData.difficulty = option
			},
			// CustomPicker的change事件处理 - 关联儿童
			onChildChange(index, option) {
				this.formData.child_name = option
				this.formData.child_id = this.children[index]?.child_id || this.children[index]?.id || ''
			},
			closeModal() {
				this.showAddModal = false
				this.editingTask = null
				this.formData = {
					title: '',
					description: '',
					type: '',
					type_text: '',
					difficulty: '',
					base_points: '',
					child_name: '',
					child_id: ''
				}
				this.typeIndex = -1
				this.difficultyIndex = -1
				this.childIndex = -1
			},
			async saveTask() {
				if (!this.formData.title || !this.formData.type || !this.formData.difficulty || !this.formData.base_points || !this.formData.child_id) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}

				uni.showLoading({ title: '保存中...' })

				const taskData = {
					title: this.formData.title,
					description: this.formData.description,
					type: this.formData.type,
					difficulty: this.formData.difficulty,
					base_points: parseInt(this.formData.base_points),
					child_id: this.formData.child_id,
					status: '未开始'
				}

				try {
					if (this.editingTask) {
						const success = await this.updateTaskToTable(this.editingTask.id, taskData)
						if (success) {
							const index = this.tasks.findIndex(t => t.id === this.editingTask.id)
							if (index >= 0) {
								this.tasks[index] = { ...this.tasks[index], ...taskData }
							}
							uni.showToast({ title: '修改成功', icon: 'success' })
						} else {
							uni.showToast({ title: '修改失败', icon: 'none' })
						}
					} else {
						const recordId = await this.addTaskToTable(taskData)
						if (recordId) {
							this.tasks.unshift({
								id: recordId,
								...taskData,
								status: '未开始'
							})
							uni.showToast({ title: '创建成功', icon: 'success' })
						} else {
							uni.showToast({ title: '创建失败', icon: 'none' })
						}
					}
				} catch (error) {
					console.error('[Tasks] 保存任务失败:', error)
					uni.showToast({ title: '保存失败', icon: 'none' })
				}

				uni.hideLoading()
				this.closeModal()
			},
			showAIGenerate() {
				this.showAIModal = true
			},
			closeAIModal() {
				this.showAIModal = false
				this.aiPrompt = ''
				this.taskCountIndex = 1
				this.aiDifficultyIndex = 1
			},
			onTaskCountChange(e) {
				this.taskCountIndex = e.detail.value
			},
			// AI弹窗中原生picker的难度变化处理
			onAIDifficultyChange(e) {
				this.aiDifficultyIndex = e.detail.value
			},
			generateTasks() {
				if (!this.aiPrompt.trim()) {
					uni.showToast({ title: '请输入生成主题', icon: 'none' })
					return
				}
				uni.showLoading({ title: 'AI生成中...' })
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({ title: '生成成功！', icon: 'success' })
					this.closeAIModal()
					this.loadTasks()
				}, 2000)
			},
			async loadCategories() {
				try {
					const categories = await CategoryManager.loadCategories('tasks-page')
					if (categories) {
						// 任务类型从分类表的 task_type 字段获取
						if (categories.task_type && categories.task_type.length > 0) {
							this.taskTypes = categories.task_type.map(t => t.label)
						} else {
							this.taskTypes = ['阅读', '数学', '英语', '美术', '体育', '音乐', '科学']
						}
						// 难度等级从分类表的 task_difficulty 字段获取
						if (categories.task_difficulty && categories.task_difficulty.length > 0) {
							this.difficulties = categories.task_difficulty.map(d => d.label)
						} else {
							this.difficulties = ['简单', '中等', '困难']
						}
						// 任务状态从分类表的 task_status 字段获取
						if (categories.task_status && categories.task_status.length > 0) {
							this.taskStatuses = categories.task_status.map(s => s.label)
						} else {
							this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
						}
					} else {
						// 分类数据加载失败，使用默认值
						this.taskTypes = ['阅读', '数学', '英语', '美术', '体育', '音乐', '科学']
						this.difficulties = ['简单', '中等', '困难']
						this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
					}
				} catch (error) {
					console.error('[Tasks] 加载分类数据失败:', error)
					// 异常情况使用默认值
					this.taskTypes = ['阅读', '数学', '英语', '美术', '体育', '音乐', '科学']
					this.difficulties = ['简单', '中等', '困难']
					this.taskStatuses = ['未开始', '进行中', '已完成', '已取消']
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
			getChildName(childId) {
				if (!childId) return '未关联'
				const child = this.children.find(c => c.child_id === childId || c.id === childId)
				return child ? child.name : '未知儿童'
			},
			setFilter(filter) {
				this.currentFilter = filter
			},
			async loadTasks() {
				uni.showLoading({ title: '加载中...' })
				try {
					const result = await feishuRequest.queryRecords('任务表')
					
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
							
							let childId = item.fields.child_id || item.fields.childId || ''
							if (Array.isArray(childId) && childId[0]) {
								childId = childId[0].text !== undefined ? childId[0].text : childId[0]
							}
							
							return {
								id: item.record_id,
								title: title,
								description: description,
								type: item.fields.type || '',
								type_text: item.fields.type_text || '',
								difficulty: item.fields.difficulty || '简单',
								base_points: item.fields.base_points || 0,
								child_id: childId,
								child_name: this.getChildName(childId),
								status: item.fields.status || '未开始',
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
						child_id: taskData.child_id,
						status: taskData.status || '进行中'
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
						child_id: taskData.child_id,
						child_name: taskData.child_name
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

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.task-card {
		display: flex;
		padding: 25rpx;
		background-color: #fafafa;
		border-radius: 16rpx;
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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 40rpx;
	}

	.modal-content {
		width: 100%;
		max-width: 640rpx;
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		position: sticky;
		top: 0;
		background-color: #fff;
	}

	.modal-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-close {
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}

	.modal-body {
		padding: 30rpx;
	}

	.form-item {
		margin-bottom: 25rpx;
	}

	.form-label {
		font-size: 26rpx;
		color: #666;
		display: block;
		margin-bottom: 10rpx;
	}

	.form-input {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.form-textarea {
		width: 100%;
		height: 150rpx;
		padding: 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.form-picker {
		width: 100%;
		height: 80rpx;
		padding: 0 20rpx;
		border: 2rpx solid #e8e8e8;
		border-radius: 10rpx;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #333;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #999;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx 30rpx;
		position: sticky;
		bottom: 0;
		background-color: #fff;
	}

	.btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		border: none;

		&.btn-primary {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}

		&.btn-secondary {
			background-color: #f0f0f0;
			color: #333;
		}
	}
</style>