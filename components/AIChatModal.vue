<template>
	<view class="modal-overlay" v-if="visible" @click="handleClose">
		<view class="modal-content chat-modal" @click.stop>
			<view class="modal-header">
				<text class="modal-title">🤖 AI任务助手</text>
				<text class="modal-close" @click="handleClose">✕</text>
			</view>
			
			<!-- 对话区域 -->
			<scroll-view class="chat-area" scroll-y :scroll-into-view="scrollToId" scroll-with-animation>
				<view class="chat-messages">
					<!-- 系统欢迎消息 -->
					<view class="message system-message">
						<text class="system-text">你好！我是AI任务助手，请问需要生成什么任务？</text>
					</view>
					
					<!-- 消息列表 -->
					<view v-for="(msg, index) in messages" :key="index" :id="'msg-' + index" class="message" :class="msg.type">
						<view class="avatar">{{ msg.type === 'user' ? '👤' : '🤖' }}</view>
						<view class="message-content">
							<text class="message-text">{{ msg.content }}</text>
							<view v-if="msg.tasks && msg.tasks.length > 0" class="task-list-preview">
								<text class="task-list-title">生成的任务：</text>
								<view v-for="(task, idx) in msg.tasks" :key="idx" class="task-item">
									<text class="task-number">{{ idx + 1 }}.</text>
									<text class="task-title">{{ task.title }}</text>
									<text class="task-meta">⭐{{ task.base_points }}分</text>
								</view>
								<button class="save-tasks-btn" @click="handleSaveTasks(msg.tasks)">保存任务</button>
							</view>
							<view v-if="msg.status === 'generating'" class="typing-indicator">
								<text class="typing-dot"></text>
								<text class="typing-dot"></text>
								<text class="typing-dot"></text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
			
			<!-- 输入区域 -->
			<view class="input-area">
				<view class="quick-prompts">
					<text 
						v-for="prompt in quickPrompts" 
						:key="prompt" 
						class="quick-prompt"
						@click="sendQuickPrompt(prompt)"
					>{{ prompt }}</text>
				</view>
				<view class="input-row">
					<input 
						class="chat-input" 
						v-model="inputMessage" 
						placeholder="输入任务生成需求..."
						@confirm="handleSend"
					/>
					<button 
						class="send-btn" 
						@click="handleSend"
						:disabled="isGenerating || !inputMessage.trim()"
					>{{ isGenerating ? '生成中...' : '发送' }}</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { cozeRequest } from '@/common/coze-request.js'
import { feishuRequest } from '@/common/feishu-request.js'

export default {
	name: 'AIChatModal',
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		children: {
			type: Array,
			default: () => []
		}
	},
	emits: ['close', 'tasks-generated'],
	data() {
		return {
			inputMessage: '',
			messages: [],
			isGenerating: false,
			isSaving: false,
			scrollToId: '',
			quickPrompts: [
				'生成今日打卡任务',
				'生成一周学习计划',
				'生成阅读任务',
				'生成数学练习任务'
			]
		}
	},
	watch: {
		visible(val) {
			if (val) {
				this.scrollToBottom()
			}
		},
		messages() {
			this.$nextTick(() => {
				this.scrollToBottom()
			})
		}
	},
	methods: {
		handleClose() {
			this.messages = []
			this.inputMessage = ''
			this.$emit('close')
		},
		scrollToBottom() {
			if (this.messages.length > 0) {
				this.scrollToId = 'msg-' + (this.messages.length - 1)
			}
		},
		sendQuickPrompt(prompt) {
			this.inputMessage = prompt
			this.handleSend()
		},
		async handleSend() {
			const message = this.inputMessage.trim()
			if (!message || this.isGenerating) return

			// 添加用户消息
			this.messages.push({
				type: 'user',
				content: message,
				status: 'sent'
			})

			// 添加AI回复（生成中状态）
			this.messages.push({
				type: 'ai',
				content: '',
				status: 'generating',
				tasks: []
			})

			this.inputMessage = ''
			this.isGenerating = true

			try {
				// 获取儿童信息
				const child = this.children[0]

				// 构建用户信息
				const userInfo = child ? {
					name: child.name,
					grade: child.grade || '',
					age: child.age || '',
					interests: child.interests || ''
				} : {}

				// 构建请求参数
				const params = cozeRequest.buildTaskParams(
					message,
					5,
					'中等',
					userInfo
				)

				console.log('[AIChatModal] Coze请求参数:', params)

				// 调用Coze工作流
				const tasks = []
				let hasError = false
				let errorMessage = ''
				let receivedContent = ''

				// 调用工作流（简化为直接调用）
				const result = await cozeRequest.generateTasks(params)
				console.log('[AIChatModal] Coze响应结果:', result)

				if (result.success && result.data) {
					const data = result.data
					console.log('[AIChatModal] 工作流返回数据:', data)
					
					// 提取 output 字段
					let outputContent = ''
					
					if (data.output) {
						// output 字段存在
						if (typeof data.output === 'string') {
							outputContent = data.output
						} else if (typeof data.output === 'object' && data.output.content) {
							outputContent = data.output.content
						} else {
							try {
								outputContent = JSON.stringify(data.output)
							} catch {
								outputContent = String(data.output)
							}
						}
					} else if (data.message) {
						// 尝试 message 字段
						outputContent = data.message
					} else if (data.data && data.data.output) {
						// 尝试 data.output
						outputContent = data.data.output
					} else {
						// 兜底：将整个数据转为字符串
						try {
							outputContent = JSON.stringify(data)
						} catch {
							outputContent = String(data)
						}
					}

					console.log('[AIChatModal] 提取的output内容:', outputContent)
					
					if (outputContent) {
						receivedContent = outputContent
					}

					// 收集任务数据
					if (data.tasks && Array.isArray(data.tasks)) {
						tasks.push(...data.tasks)
					} else if (data.task) {
						tasks.push(data.task)
					} else if (data.data && data.data.tasks) {
						tasks.push(...data.data.tasks)
					} else if (data.output && typeof data.output === 'object' && data.output.tasks) {
						tasks.push(...data.output.tasks)
					}
				} else {
					hasError = true
					errorMessage = result.message || '请求失败'
				}

				if (hasError) {
					this.updateLastMessage('生成失败: ' + errorMessage)
					return
				}

				// 更新消息显示
				if (tasks.length > 0) {
					this.updateLastMessage(receivedContent || `成功生成 ${tasks.length} 个任务！`, tasks)
					this.$emit('tasks-generated', tasks)
				} else if (receivedContent) {
					// 如果有内容但没有任务，显示内容即可
					this.updateLastMessage(receivedContent)
				} else {
					// 添加新消息显示"未生成任务"，不替换之前的内容
					this.messages.push({
						type: 'ai',
						content: '未生成任何任务',
						status: 'completed',
						tasks: []
					})
				}
			} catch (error) {
				console.error('[AIChatModal] AI生成任务失败:', error)
				this.updateLastMessage('生成失败: ' + (error.message || error))
			} finally {
				this.isGenerating = false
				// 确保状态标记为完成
				if (this.messages.length > 0) {
					const lastMsg = this.messages[this.messages.length - 1]
					if (lastMsg.type === 'ai') {
						lastMsg.status = 'completed'
					}
				}
			}
		},
		updateLastMessage(content, tasks = []) {
			if (this.messages.length > 0) {
				const lastMsg = this.messages[this.messages.length - 1]
				if (lastMsg.type === 'ai') {
					lastMsg.content = content
					lastMsg.status = 'completed'
					if (tasks.length > 0) {
						lastMsg.tasks = tasks
					}
				}
			}
		},
		async handleSaveTasks(tasks) {
			if (!tasks || tasks.length === 0) {
				return
			}

			// 获取儿童信息
			const child = this.children[0]
			if (!child) {
				uni.showToast({ title: '请先添加儿童信息', icon: 'none' })
				return
			}

			this.isSaving = true
			uni.showLoading({ title: '保存中...' })

			try {
				const childId = child.id || ''
				let successCount = 0
				const savedTasks = []

				for (const task of tasks) {
					const taskData = {
						title: task.title || '未命名任务',
						description: task.description || '',
						type: task.type || '学习任务',
						difficulty: task.difficulty || '简单',
						base_points: task.base_points || 10,
						reward_points: task.reward_points || 0,
						start_time: new Date().getTime(),
						deadline_time: task.deadline_time ? Number(task.deadline_time) : '',
						need_audit: task.need_audit || false,
						child_id: childId,
						textbook_id: task.textbook_id || '',
						status: '未开始'
					}

					// 调用飞书多维表格添加任务
					const recordId = await feishuRequest.addRecord('任务表', taskData)
					if (recordId) {
						savedTasks.push({
							id: recordId,
							...taskData
						})
						successCount++
					}
				}

				uni.hideLoading()
				if (successCount > 0) {
					// 在对话框中显示保存结果
					this.messages.push({
						type: 'ai',
						content: `✅ 成功保存 ${successCount} 个任务到飞书多维表格！`,
						status: 'completed',
						tasks: savedTasks
					})
					uni.showToast({ title: `成功保存 ${successCount} 个任务`, icon: 'success' })
					// 通知父组件更新任务列表
					this.$emit('tasks-generated', savedTasks)
				} else {
					this.messages.push({
						type: 'ai',
						content: '❌ 保存任务失败，请重试',
						status: 'completed'
					})
					uni.showToast({ title: '保存失败', icon: 'none' })
				}
			} catch (error) {
				console.error('[AIChatModal] 保存任务失败:', error)
				uni.hideLoading()
				this.messages.push({
					type: 'ai',
					content: '❌ 保存任务失败: ' + (error.message || error),
					status: 'completed'
				})
				uni.showToast({ title: '保存失败', icon: 'none' })
			} finally {
				this.isSaving = false
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	z-index: 1000;
}

.chat-modal {
	width: 100%;
	max-height: 80vh;
	border-radius: 20rpx 20rpx 0 0;
	background: #fff;
	display: flex;
	flex-direction: column;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #eee;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.modal-close {
	font-size: 40rpx;
	color: #999;
	padding: 10rpx;
}

.chat-area {
	flex: 1;
	padding: 20rpx;
	overflow-y: auto;
}

.chat-messages {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.message {
	display: flex;
	gap: 16rpx;
	max-width: 100%;
	
	&.user {
		justify-content: flex-end;
		
		.avatar {
			order: 2;
		}
		
		.message-content {
			background: #07c160;
			color: #fff;
			border-radius: 20rpx 4rpx 20rpx 20rpx;
		}
	}
	
	&.ai {
		justify-content: flex-start;
		
		.message-content {
			background: #f5f5f5;
			color: #333;
			border-radius: 4rpx 20rpx 20rpx 20rpx;
		}
	}
	
	&.system-message {
		justify-content: center;
		
		.system-text {
			font-size: 24rpx;
			color: #999;
			background: #f5f5f5;
			padding: 16rpx 24rpx;
			border-radius: 20rpx;
		}
	}
}

.avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: #eee;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	flex-shrink: 0;
}

.message-content {
	max-width: 75%;
	padding: 20rpx 24rpx;
	position: relative;
}

.message-text {
	font-size: 28rpx;
	line-height: 1.6;
}

.task-list-preview {
	margin-top: 16rpx;
	padding-top: 16rpx;
	border-top: 1rpx dashed #ddd;
}

.task-list-title {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 12rpx;
}

.task-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 0;
	
	.task-number {
		font-size: 24rpx;
		color: #07c160;
		font-weight: bold;
	}
	
	.task-title {
		flex: 1;
		font-size: 26rpx;
		color: #333;
	}
	
	.task-meta {
		font-size: 22rpx;
		color: #999;
	}
}

.save-tasks-btn {
	width: 100%;
	margin-top: 16rpx;
	padding: 16rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	border: none;
	border-radius: 12rpx;
	font-size: 26rpx;
}

.typing-indicator {
	display: flex;
	gap: 8rpx;
	margin-top: 12rpx;
}

.typing-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #999;
	animation: typing 1.4s infinite ease-in-out;
	
	&:nth-child(1) { animation-delay: 0s; }
	&:nth-child(2) { animation-delay: 0.2s; }
	&:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes typing {
	0%, 80%, 100% { opacity: 0.2; }
	40% { opacity: 1; }
}

.input-area {
	padding: 20rpx;
	border-top: 1rpx solid #eee;
	background: #fff;
}

.quick-prompts {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.quick-prompt {
	padding: 8rpx 20rpx;
	background: #f0f0f0;
	border-radius: 20rpx;
	font-size: 24rpx;
	color: #666;
}

.input-row {
	display: flex;
	gap: 16rpx;
}

.chat-input {
	flex: 1;
	height: 80rpx;
	padding: 0 24rpx;
	background: #f5f5f5;
	border-radius: 40rpx;
	font-size: 28rpx;
}

.send-btn {
	width: 140rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	border: none;
	border-radius: 40rpx;
	font-size: 28rpx;
	
	&:disabled {
		opacity: 0.5;
	}
}
</style>