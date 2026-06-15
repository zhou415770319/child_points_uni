<template>
	<view class="container">
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text>‹</text>
			</view>
			<text class="header-title">任务详情</text>
			<view class="placeholder"></view>
		</view>

		<view class="task-card" v-if="task">
			<view class="task-icon-large">{{ getTaskIcon(task.type) }}</view>
			<text class="task-title">{{ task.title }}</text>
			<text class="task-desc">{{ task.description || '暂无描述' }}</text>
			
			<view class="task-info">
				<view class="info-item">
					<text class="info-label">关联儿童</text>
					<text class="info-value">{{ task.child_name || '未关联' }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">类型</text>
					<text class="info-value">{{ task.type_text || task.type }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">难度</text>
					<text class="info-value difficulty" :class="task.difficulty">{{ task.difficulty }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">积分</text>
					<text class="info-value points">+{{ task.base_points || 0 }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">金币</text>
					<text class="info-value coins">+{{ formatCoins(task.reward_points) }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">状态</text>
					<text class="info-value status" :class="task.status">{{ getStatusText(task.status) }}</text>
				</view>
			</view>

			<!-- 计时器显示 -->
			<view class="timer-display-large" v-if="task.status === '进行中' || task.status === '暂停'">
				<text class="timer-label">已用时</text>
				<text class="timer-value">{{ formatTime(task.elapsed_time || 0) }}</text>
			</view>

			<view class="task-actions">
				<!-- 未开始状态 -->
				<template v-if="task.status === '未开始'">
					<button class="action-btn secondary" @click="goBack">返回</button>
					<button class="action-btn primary" @click="startTask">开始任务</button>
				</template>
				
				<!-- 进行中状态 -->
				<template v-else-if="task.status === '进行中'">
					<button class="action-btn pause" @click="pauseTask">暂停</button>
					<button class="action-btn complete" @click="handleSubmit">提交</button>
				</template>
				
				<!-- 暂停状态 -->
				<template v-else-if="task.status === '暂停'">
					<button class="action-btn resume" @click="resumeTask">继续</button>
					<button class="action-btn complete" @click="handleSubmit">提交</button>
				</template>
				
				<!-- 待审核状态 -->
				<template v-else-if="task.status === '待审核'">
					<button class="action-btn secondary" @click="goBack">返回</button>
					<button class="action-btn disabled">待审核</button>
				</template>
				
				<!-- 已完成状态 -->
				<template v-else-if="task.status === '已完成'">
					<button class="action-btn secondary" @click="goBack">返回</button>
					<button class="action-btn disabled">已完成</button>
				</template>
			</view>
		</view>

		<view class="section">
			<text class="section-title">📝 任务说明</text>
			<view class="instruction-content">
				<text class="instruction-text">{{ task?.description || '暂无说明' }}</text>
			</view>
		</view>

		<view class="section">
			<text class="section-title">🏆 完成奖励</text>
			<view class="reward-list">
				<view class="reward-card points">
					<view class="reward-icon">⭐</view>
					<view class="reward-info">
						<text class="reward-title">任务积分</text>
						<text class="reward-value">+{{ task?.base_points || 0 }} 积分</text>
					</view>
				</view>
				<view class="reward-card coins">
					<view class="reward-icon">💰</view>
					<view class="reward-info">
						<text class="reward-title">奖励金币</text>
						<text class="reward-value">+{{ formatCoins(task?.reward_points) }} 金币</text>
					</view>
				</view>
			</view>
		</view>

		<!-- AI 评价展示（任务完成后显示） -->
		<view class="section" v-if="aiEvaluation">
			<text class="section-title">🤖 AI 评价</text>
			<view class="ai-card">
				<view class="ai-score">
					<text class="score-label">AI评分</text>
					<text class="score-value" :class="getScoreClass(aiEvaluation.ai_score)">{{ aiEvaluation.ai_score }}分</text>
				</view>
				<text class="ai-comment">{{ aiEvaluation.ai_comment }}</text>
				<view class="ai-detailed-container" v-if="aiEvaluation.ai_detailed && parseAiDetailed(aiEvaluation.ai_detailed)">
					<view class="ai-detailed-header" @click="toggleAiDetailed">
						<text class="detailed-label">评价详情</text>
						<text class="toggle-icon" :class="{ expanded: detailedExpanded }">▼</text>
					</view>
					<view class="ai-detailed-content" v-if="detailedExpanded">
						<view class="detailed-item" v-for="(item, key) in parseAiDetailed(aiEvaluation.ai_detailed)" :key="key">
							<view class="item-header">
								<text class="item-question">{{ key }}</text>
								<text class="item-status" :class="item.correctness === '正确' ? 'correct' : 'wrong'">
									{{ item.correctness === '正确' ? '✓ 正确' : '✗ 错误' }}
								</text>
							</view>
							<text class="item-feedback">{{ item.feedback }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 提交任务弹窗 -->
		<view class="modal-overlay" v-if="showSubmitModal" @click="showSubmitModal = false">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">提交任务</text>
					<text class="modal-close" @click="showSubmitModal = false">✕</text>
				</view>
				<view class="modal-body">
					<!-- 需要审核的任务显示上传区域 -->
					<view class="upload-section" v-if="task?.need_audit">
						<ImageUploader 
							:value="uploadedFiles" 
							:maxCount="9"
							title="📷 上传证明图片"
							ref="imageUploaderRef"
							@input="handleUploadedFilesChange"
						/>
					</view>

					<!-- 备注信息（所有任务都显示） -->
					<view class="remark-section">
						<text class="remark-title">📝 备注信息</text>
						<textarea 
							class="remark-input" 
							v-model="remark" 
							placeholder="请输入完成任务的备注信息..."
							:maxlength="500"
						></textarea>
						<text class="remark-count">{{ remark.length }}/500</text>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-secondary" @click="showSubmitModal = false">取消</button>
					<button class="btn btn-primary" @click="submitTask">确认提交</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'
	import { feishuApi } from '@/uni_modules/settings-feishu-dataBase/src/utils/feishu-api.js'
	import UserManager from '@/common/user-manager.js'
	import ImageUploader from '@/components/ImageUploader.vue'

	export default {
		components: {
			ImageUploader
		},
		data() {
			return {
				task: null,
				taskId: '',  // 业务ID（fields.id）
				recordId: '',  // 飞书系统ID（record_id）
				timer: null,
				currentChild: null,  // 当前登录的儿童信息
				children: [],  // 儿童列表，用于根据child_id获取儿童名称
				showSubmitModal: false,  // 提交任务弹窗
				uploadedFiles: [],  // 上传的文件列表（与 ImageUploader 组件 v-model 绑定）
				remark: '',  // 备注信息
				aiEvaluation: null,  // AI评价结果
				detailedExpanded: false  // 评价详情展开状态
			}
		},
		async onLoad(options) {
			if (options && options.task) {
				try {
					// 解析传递过来的任务信息
					const taskData = JSON.parse(decodeURIComponent(options.task))
					console.log('[Task Detail] 从首页接收任务信息:', taskData)
					
					// 先加载儿童列表，以便正确计算 child_name
					await this.loadChildren()
					
					// 直接使用传递过来的任务信息，不需要再次查询
					this.task = taskData
					this.taskId = taskData.id || ''
					this.recordId = taskData.record_id || ''
					
					// 重新计算 child_name（确保使用最新的儿童列表）
					this.task.child_name = this.getChildName(this.task.child_id)
					console.log('[Task Detail] 重新计算的儿童名称:', this.task.child_name)
					
					// 如果任务待审核或已完成，尝试获取AI评价
					if (this.task.status === '待审核' || this.task.status === '已完成') {
						await this.loadAiEvaluation()
					}
				} catch (error) {
					console.error('[Task Detail] 解析任务信息失败:', error)
					// 如果解析失败，回退到API查询方式
					if (options.id) {
						this.taskId = options.id
						this.recordId = options.record_id || ''
						await this.loadChildren()
						await this.loadTaskDetail()
					}
				}
			}
		},
		onUnload() {
			// 清理计时器
			if (this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
			
			// 如果任务正在进行中，保存当前累计时间
			if (this.task && this.task.status === '进行中') {
				this.saveElapsedTime()
			}
			
			// 触发首页刷新任务列表
			uni.$emit('refreshTasks')
		},
		onPullDownRefresh() {
			console.log('[Task Detail] 下拉刷新，重新获取任务数据')
			this.refreshTaskData()
		},
		methods: {
			/**
			 * 格式化金币显示（一位小数）
			 */
			formatCoins(value) {
				return Number(value || 0).toFixed(1)
			},
			/**
			 * 处理上传文件变化
			 */
			handleUploadedFilesChange(files) {
				console.log('[Task Detail] handleUploadedFilesChange:', files)
				this.uploadedFiles = files
			},
			/**
			 * 加载儿童列表（用于根据child_id获取儿童名称）
			 */
			async loadChildren() {
				try {
					// 先获取当前登录的儿童信息
					this.currentChild = await UserManager.getCurrentChild()
					console.log('[Task Detail] 当前儿童:', this.currentChild)
					
					// 再获取家长的所有儿童列表
					const currentParent = await UserManager.getCurrentParent()
					if (currentParent && currentParent.phone) {
						this.children = await UserManager.getChildrenByParent(currentParent.phone)
						console.log('[Task Detail] 儿童列表:', this.children)
					}
				} catch (error) {
					console.error('[Task Detail] 加载儿童列表失败:', error)
				}
			},
			
			/**
			 * 根据child_id获取儿童名称
			 */
			getChildName(childId) {
				if (!childId) {
					// 如果任务没有绑定儿童，使用当前登录的儿童信息
					return this.currentChild?.name || '未关联'
				}
				// 先尝试匹配当前登录的儿童
				if (this.currentChild && (this.currentChild.child_id === childId || this.currentChild.id === childId || 
					String(this.currentChild.child_id) === String(childId) || String(this.currentChild.id) === String(childId))) {
					return this.currentChild.name
				}
				// 再从儿童列表中查找
				const child = this.children.find(c => 
					c.child_id === childId || c.id === childId ||
					String(c.child_id) === String(childId) || String(c.id) === String(childId)
				)
				return child ? child.name : '未知儿童'
			},
			
			async loadTaskDetail() {
				try {
					uni.showLoading({ title: '加载中...' })
					console.log('loadTaskDetail----', this.recordId);
					
					if (!this.recordId) {
						console.error('[Task Detail] recordId为空，无法查询任务详情')
						this.task = null
						uni.hideLoading()
						return
					}
					
					// 通过 record_id 直接从飞书获取单条记录
					const result = await feishuRequest.getRecord('任务表', this.recordId)
					
					if (result && result.success && result.data) {
						const taskData = result.data
						
						const title = taskData.fields.title 
							? (Array.isArray(taskData.fields.title) && taskData.fields.title[0] && taskData.fields.title[0].text 
								? taskData.fields.title[0].text 
								: taskData.fields.title)
							: ''
						const description = taskData.fields.description 
							? (Array.isArray(taskData.fields.description) && taskData.fields.description[0] && taskData.fields.description[0].text 
								? taskData.fields.description[0].text 
								: taskData.fields.description)
							: ''
						
						// 处理child_id字段
						let childId = taskData.fields.child_id || ''
						if (Array.isArray(childId)) {
							if (childId[0] && childId[0].text) {
								childId = childId[0].text
							} else if (childId[0] && typeof childId[0] === 'object' && childId[0].record_id) {
								childId = childId[0].record_id
							} else if (childId[0]) {
								childId = String(childId[0])
							} else {
								childId = ''
							}
						}
						childId = String(childId).trim()
						
						this.task = {
							id: taskData.fields.id || '',
							record_id: taskData.record_id,
							title: title,
							description: description,
							type: taskData.fields.type || '',
							type_text: taskData.fields.type_text || '',
							difficulty: taskData.fields.difficulty || '简单',
							base_points: taskData.fields.base_points || 10,
							reward_points: taskData.fields.reward_points || 0,
							status: taskData.fields.status || '未开始',
							completed: taskData.fields.status === '已完成' || taskData.fields.status === '待审核',
							elapsed_time: taskData.fields.elapsed_time || 0,
							child_id: childId,
							child_name: this.getChildName(childId),
							need_audit: taskData.fields.need_audit || false
						}
						
						// 如果任务待审核或已完成，尝试获取AI评价
						if (this.task.status === '待审核' || this.task.status === '已完成') {
							await this.loadAiEvaluation()
						}
					} else {
						console.error('[Task Detail] 获取任务详情失败')
						this.task = null
					}
				} catch (error) {
					console.error('[Task Detail] 加载任务详情失败:', error)
					this.task = null
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 下拉刷新 - 从服务器重新获取任务数据
			 */
			async refreshTaskData() {
				const wasRunning = this.timer !== null
				if (wasRunning) {
					this.stopTimer()
				}
				
				try {
					await this.loadChildren()
					await this.loadTaskDetail()
					
					// 如果任务正在进行中，重启计时器（基于当前 elapsed_time 重新计算）
					if (this.task && this.task.status === '进行中') {
						this.startTimer()
					}
				} catch (error) {
					console.error('[Task Detail] 刷新任务数据失败:', error)
				} finally {
					uni.stopPullDownRefresh()
				}
			},
			
			/**
			 * 加载AI评价
			 */
			async loadAiEvaluation() {
				try {
					if (!this.task || !this.task.task_id) {
						console.warn('[Task Detail] 任务ID为空，无法加载AI评价')
						return
					}
					
					// 查询打卡记录表，获取AI评价数据
					const filter = { task_id: this.task.task_id }
					const result = await feishuRequest.queryRecords('打卡记录表', filter)
					
					if (result.success && result.data && result.data.length > 0) {
						// 取最新的打卡记录
						const checkinRecord = result.data[0]
						
						this.aiEvaluation = {
							ai_score: this.parseTextField(checkinRecord.fields.ai_score),
							ai_comment: this.parseTextField(checkinRecord.fields.ai_comment),
							ai_detailed: this.parseTextField(checkinRecord.fields.ai_detailed)
						}
						
						console.log('[Task Detail] AI评价加载成功:', this.aiEvaluation)
					} else {
						console.log('[Task Detail] 未找到打卡记录，AI评价为空')
						this.aiEvaluation = null
					}
				} catch (error) {
					console.error('[Task Detail] 加载AI评价失败:', error)
					this.aiEvaluation = null
				}
			},
			
			/**
			 * 解析多维表格文本字段
			 */
			parseTextField(field) {
				if (!field) return ''
				if (typeof field === 'object' && field.type === 1 && field.value && Array.isArray(field.value) && field.value.length > 0) {
					return field.value[0].text || ''
				}
				if (Array.isArray(field) && field[0] && field[0].text) {
					return field[0].text
				}
				if (typeof field === 'string') {
					return field
				}
				return ''
			},
			
			/**
			 * 解析AI评价详情JSON
			 */
			parseAiDetailed(detailedStr) {
				if (!detailedStr) return null
				try {
					const parsed = JSON.parse(detailedStr)
					if (typeof parsed === 'object' && parsed !== null) {
						return parsed
					}
					return null
				} catch (error) {
					console.error('[Task Detail] 解析AI评价详情失败:', error)
					return null
				}
			},
			
			/**
			 * 切换评价详情折叠状态
			 */
			toggleAiDetailed() {
				this.detailedExpanded = !this.detailedExpanded
			},
			
			/**
			 * 获取评分样式类
			 */
			getScoreClass(score) {
				if (!score) return ''
				score = parseInt(score) || 0
				if (score >= 90) return 'high'
				if (score >= 70) return 'medium'
				return 'low'
			},
			
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
			
			getStatusText(status) {
				const texts = {
					'未开始': '未开始',
					'进行中': '进行中',
					'已完成': '已完成',
					'暂停': '暂停'
				}
				return texts[status] || status
			},
			
			// chooseImage、removeFile 已由 ImageUploader 组件内部处理
			
			/**
			 * 开始任务
			 */
			async startTask() {
				if (!this.task) return
				
				try {
					uni.showLoading({ title: '更新中...' })
					
					// 使用 record_id 更新飞书记录
					const result = await feishuRequest.updateRecord('任务表', this.task.record_id, {
						status: '进行中'
					})
					
					if (result.success) {
						this.task.status = '进行中'
						this.task.elapsed_time = this.task.elapsed_time || 0
						this.task.start_time = Date.now()
						this.startTimer()
						uni.showToast({ title: '任务已开始', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Task Detail] 开始任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 暂停任务
			 */
			async pauseTask() {
				if (!this.task) return
				
				try {
					uni.showLoading({ title: '更新中...' })
					
					this.stopTimer()
					
					// 使用 record_id 更新飞书记录
					const result = await feishuRequest.updateRecord('任务表', this.task.record_id, {
						status: '暂停',
						elapsed_time: Number(this.task.elapsed_time) || 0  // 保存累计时间
					})
					
					if (result.success) {
						this.task.status = '暂停'
						uni.showToast({ title: '任务已暂停', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Task Detail] 暂停任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 继续任务
			 */
			async resumeTask() {
				if (!this.task) return
				
				try {
					uni.showLoading({ title: '更新中...' })
					
					// 使用 record_id 更新飞书记录
					const result = await feishuRequest.updateRecord('任务表', this.task.record_id, {
						status: '进行中'
					})
					
					if (result.success) {
						this.task.status = '进行中'
						this.task.start_time = Date.now()
						this.startTimer()
						uni.showToast({ title: '任务已继续', icon: 'success' })
					} else {
						uni.showToast({ title: '更新失败', icon: 'none' })
					}
				} catch (error) {
					console.error('[Task Detail] 继续任务失败:', error)
					uni.showToast({ title: '更新失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			/**
			 * 处理提交（判断是否需要审核）
			 */
			handleSubmit() {
				// 判断是否需要审核
				if (this.task.need_audit) {
					// 需要审核，显示提交弹框（带上传区域）
					this.showSubmitModal = true
				} else {
					// 不需要审核，直接提交完成
					this.submitTask()
				}
			},
			
			/**
			 * 提交任务（带文件和备注）
			 */
			async submitTask() {
				if (!this.task || this.task.completed) return
				
				try {
					uni.showLoading({ title: '提交中...' })
					
					this.stopTimer()
					
					// 判断是否需要审核
					const needApproval = this.task.need_audit
					
					// 1. 只更新任务状态（使用 record_id 更新）
					const taskUpdateData = {
						status: needApproval ? '待审核' : '已完成',
						elapsed_time: Number(this.task.elapsed_time) || 0
					}
					
					const taskResult = await feishuRequest.updateRecord('任务表', this.task.record_id, taskUpdateData)
					console.log('创建打卡记录----',this.task,taskResult,needApproval);
					
					if (!taskResult.success) {
						uni.showToast({ title: '提交失败', icon: 'none' })
						return
					}
					// 2. 创建打卡记录（包含图片和备注）
					if (needApproval) {
						// 选择图片时已经获取到 fileToken，直接从 uploadedFiles 中提取
						let uploadSuccessCount = 0
						let imageFieldData = null
						if (this.uploadedFiles.length > 0) {
							// 提取所有成功上传的 fileToken（飞书附件字段直接传对象数组）
							imageFieldData = this.uploadedFiles
								.filter(file => file.fileToken)
								.map(file => ({ file_token: file.fileToken }))
							
							uploadSuccessCount = imageFieldData.length
							console.log('[Task Detail] 图片 fileToken 提取完成，成功:', uploadSuccessCount, '/', this.uploadedFiles.length)
						}
						
						// 处理 child_id，确保是字符串格式
						let childIdValue = this.task.child_id || ''
						if (typeof childIdValue === 'object') {
							// 如果是对象格式（如 { text: 'xxx', type: 'text' }），提取 text 值
							childIdValue = childIdValue.text || ''
						}
						
						// 确保 task_id 有值，只使用用户自定义的任务ID（fields.id），不要使用 record_id
						let taskIdValue = this.task.task_id || ''
						console.log('[Task Detail] 提交打卡记录，task.id:', this.task.id, 'task.task_id:', this.task.task_id, 'task.record_id:', this.task.record_id, 'task.child_id:', childIdValue)
						
						// 校验 task_id 是否有值
						if (!taskIdValue) {
							console.error('[Task Detail] 任务ID（fields.id）为空，无法创建打卡记录')
							uni.showToast({ title: '任务ID缺失', icon: 'none' })
							uni.hideLoading()
							return
						}
						
						// 准备打卡记录数据 - remark 和 evidence_images 都加到打卡记录中
						const checkinData = {
							task_id: String(taskIdValue), // 使用用户自定义的任务ID（fields.id），不要使用 record_id
							child_id: String(childIdValue), // 确保是字符串格式
							remark: this.remark.trim() || '',
							created_time: Date.now(), // Unix时间戳（毫秒），飞书多维表格日期字段要求
							content: '完成' + (this.task.title || ''),
							review_status: '待审核',
							base_points: this.task.base_points || 0,
							reward_points: this.task.reward_points || 0
						}
						
						// 如果有成功上传的图片，添加到打卡记录的 attachments 字段（飞书附件字段直接传对象数组）
						if (imageFieldData && imageFieldData.length > 0) {
							checkinData.attachments = imageFieldData
						}
						console.log('[Task Detail] 创建打卡记录----', checkinData);

						// 创建打卡记录
						const checkinResult = await feishuRequest.addRecord('打卡记录表', checkinData)
						
						if (!checkinResult.success) {
							console.error('[Task Detail] 创建打卡记录失败:', checkinResult.error)
							uni.showToast({ title: '任务已提交，但记录创建失败', icon: 'none' })
							this.showSubmitModal = false
							return
						}
						
						// 提示图片上传结果
						if (this.uploadedFiles.length > 0) {
							if (uploadSuccessCount === this.uploadedFiles.length) {
								console.log('[Task Detail] 全部图片上传成功')
							} else {
								console.warn('[Task Detail] 部分图片上传失败，成功:', uploadSuccessCount, '/', this.uploadedFiles.length)
							}
						}
					}
					
					// 更新本地状态
					this.task.status = needApproval ? '待审核' : '已完成'
					this.task.completed = true
					
					if (!needApproval) {
						// 不需要审核，直接获得积分
						uni.showToast({ title: `+${this.task.base_points} 积分`, icon: 'success' })
					} else {
						// 需要审核，等待审核结果
						uni.showToast({ title: '提交成功，等待审核', icon: 'success' })
					}
					
					this.showSubmitModal = false
					
					// 延迟返回首页，让用户看到成功提示
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} catch (error) {
					console.error('[Task Detail] 提交任务失败:', error)
					uni.showToast({ title: '提交失败', icon: 'none' })
				}
				
				uni.hideLoading()
			},
			
			// uploadImagesAndGetFieldValue 和 convertToImageFieldValue 已由 ImageUploader 组件提供
			
			/**
			 * 启动计时器
			 * 基于固定的计时起始时间计算经过时间，避免 delta 累加带来的漂移
			 */
			startTimer() {
				if (this.timer) {
					clearInterval(this.timer)
				}
				
				// 记录计时器启动时的基准时间和基准 elapsed_time
				const timerStartTime = Date.now()
				const baseElapsedTime = this.task ? (this.task.elapsed_time || 0) : 0
				
				this.timer = setInterval(() => {
					if (this.task) {
						const elapsed = baseElapsedTime + Math.floor((Date.now() - timerStartTime) / 1000)
						this.task.elapsed_time = elapsed
					}
				}, 1000)
			},
			
			/**
			 * 停止计时器
			 */
			stopTimer() {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
				}
			},
			
			/**
			 * 保存累计时间到后端
			 */
			async saveElapsedTime() {
				if (this.task && this.task.record_id && this.task.elapsed_time) {
					try {
						await feishuRequest.updateRecord('任务表', this.task.record_id, {
							elapsed_time: Number(this.task.elapsed_time)
						})
						console.log('[Task Detail] 保存累计时间成功:', this.task.elapsed_time)
					} catch (error) {
						console.error('[Task Detail] 保存累计时间失败:', error)
					}
				}
			},
			
			/**
			 * 格式化时间
			 */
			formatTime(seconds) {
				// elapsed_time 现在存储的是秒数
				const totalSeconds = Math.floor(seconds)
				const minutes = Math.floor(totalSeconds / 60)
				const hours = Math.floor(minutes / 60)
				
				const displaySeconds = totalSeconds % 60
				const displayMinutes = minutes % 60
				
				if (hours > 0) {
					return `${String(hours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
				}
				return `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
			},
			
			goBack() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 40rpx;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 60rpx 30rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		color: #fff;
	}

	.header-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #fff;
	}

	.placeholder {
		width: 60rpx;
	}

	.task-card {
		background-color: #fff;
		margin: -30rpx 20rpx 20rpx;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		text-align: center;
		box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.1);
	}

	.task-icon-large {
		font-size: 100rpx;
		margin-bottom: 20rpx;
	}

	.task-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 15rpx;
	}

	.task-desc {
		font-size: 28rpx;
		color: #666;
		display: block;
		margin-bottom: 30rpx;
		line-height: 1.6;
	}

	.task-info {
		background-color: #fafafa;
		border-radius: 15rpx;
		padding: 25rpx;
		margin-bottom: 30rpx;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15rpx 0;
		border-bottom: 1rpx solid #eee;

		&:last-child {
			border-bottom: none;
		}
	}

	.info-label {
		font-size: 26rpx;
		color: #999;
	}

	.info-value {
		font-size: 28rpx;
		color: #333;
		font-weight: bold;

		&.difficulty {
			&.简单 { color: #4caf50; }
			&.中等 { color: #ff9500; }
			&.困难 { color: #f44336; }
		}

		&.points {
				color: #ff9500;
			}

			&.coins {
				color: #ffd700;
			}

			&.status {
			&.未开始 { color: #999; }
			&.进行中 { color: #2196f3; }
			&.已完成 { color: #4caf50; }
			&.暂停 { color: #ff9500; }
		}
	}

	.task-actions {
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 30rpx;
		border: none;

		&.primary {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}

		&.secondary {
			background-color: #f0f0f0;
			color: #333;
		}

		&.disabled {
			background-color: #f0f0f0;
			color: #999;
		}
		
		&.pause {
			background-color: #ff9500;
			color: #fff;
		}
		
		&.resume {
			background-color: #2196f3;
			color: #fff;
		}
		
		&.complete {
			background-color: #4caf50;
			color: #fff;
		}
	}
	
	.timer-display-large {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30rpx 0;
		background-color: #fafafa;
		border-radius: 15rpx;
		margin-bottom: 20rpx;
	}
	
	.timer-label {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 10rpx;
	}
	
	.timer-value {
		font-size: 48rpx;
		font-weight: bold;
		color: #667eea;
		font-family: monospace;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.instruction-content {
		background-color: #fafafa;
		border-radius: 12rpx;
		padding: 25rpx;
	}

	.instruction-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.8;
	}

	.reward-list {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.reward-card {
		display: flex;
		align-items: center;
		border-radius: 15rpx;
		padding: 30rpx;

		&.points {
			background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);

			.reward-value {
				color: #ff9500;
			}
		}

		&.coins {
			background: linear-gradient(135deg, #fffef5 0%, #fff8dc 100%);

			.reward-value {
				color: #ffd700;
			}
		}
	}

	.reward-icon {
		font-size: 50rpx;
		margin-right: 20rpx;
	}

	.reward-info {
		flex: 1;
	}

	.reward-title {
		font-size: 26rpx;
		color: #999;
		display: block;
		margin-bottom: 8rpx;
	}

	.reward-value {
		font-size: 36rpx;
		font-weight: bold;
	}

	/* AI评价样式 */
	.ai-card {
		background-color: #fff3e0;
		border-radius: 12rpx;
		padding: 15rpx;
	}

	.ai-score {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.score-label {
		font-size: 24rpx;
		color: #999;
		margin-right: 15rpx;
	}

	.score-value {
		font-size: 32rpx;
		font-weight: bold;

		&.high {
			color: #4caf50;
		}

		&.medium {
			color: #ff9500;
		}

		&.low {
			color: #f44336;
		}
	}

	.ai-comment {
		font-size: 24rpx;
		color: #666;
		display: block;
		margin-bottom: 10rpx;
	}

	.ai-detailed-container {
		margin-top: 10rpx;
	}

	.ai-detailed-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: rgba(255, 255, 255, 0.7);
		border-radius: 8rpx;
		padding: 12rpx;
	}

	.detailed-label {
		font-size: 22rpx;
		color: #999;
	}

	.toggle-icon {
		font-size: 20rpx;
		color: #999;
		transition: transform 0.3s ease;
		transform: rotate(-90deg);

		&.expanded {
			transform: rotate(0deg);
		}
	}

	.ai-detailed-content {
		background-color: rgba(255, 255, 255, 0.7);
		border-radius: 0 0 8rpx 8rpx;
		padding: 15rpx;
		margin-top: 4rpx;
	}

	.detailed-item {
		padding: 12rpx;
		background-color: #fff;
		border-radius: 8rpx;
		margin-bottom: 10rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}

	.item-question {
		font-size: 24rpx;
		color: #333;
		font-weight: 500;
	}

	.item-status {
		font-size: 22rpx;
		padding: 4rpx 12rpx;
		border-radius: 20rpx;

		&.correct {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.wrong {
			background-color: #ffebee;
			color: #f44336;
		}
	}

	.item-feedback {
		font-size: 22rpx;
		color: #666;
		line-height: 1.5;
	}

	.comment-label, .suggestion-label {
		font-size: 26rpx;
		color: #666;
		font-weight: bold;
	}

	.comment-text, .suggestion-text {
		font-size: 28rpx;
		color: #333;
		line-height: 1.6;
	}

	/* 弹窗样式 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		z-index: 1000;
	}

	.modal-content {
		width: 100%;
		max-height: 80vh;
		background-color: #fff;
		border-radius: 30rpx 30rpx 0 0;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
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
		max-height: 60vh;
		overflow-y: auto;
	}

	.upload-section {
		margin-bottom: 30rpx;
	}

	.upload-title, .remark-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
	}

	.upload-list {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
	}

	.upload-item {
		width: calc(33.33% - 10rpx);
		position: relative;
	}

	.upload-image {
		width: 100%;
		height: 180rpx;
		border-radius: 12rpx;
		object-fit: cover;
	}

	.upload-delete {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		width: 40rpx;
		height: 40rpx;
		background-color: #f44336;
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
	}

	.upload-add {
		width: calc(33.33% - 10rpx);
		height: 180rpx;
		border: 2rpx dashed #ddd;
		border-radius: 12rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.add-icon {
		font-size: 48rpx;
		color: #999;
		margin-bottom: 10rpx;
	}

	.add-text {
		font-size: 24rpx;
		color: #999;
	}

	.remark-section {
		position: relative;
	}

	.remark-input {
		width: 100%;
		height: 200rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
		padding: 20rpx;
		font-size: 28rpx;
		color: #333;
		box-sizing: border-box;
	}

	.remark-count {
		position: absolute;
		right: 20rpx;
		bottom: 20rpx;
		font-size: 24rpx;
		color: #999;
	}

	.modal-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx 40rpx;
		border-top: 1rpx solid #f0f0f0;
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