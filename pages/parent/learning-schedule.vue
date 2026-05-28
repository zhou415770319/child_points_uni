<template>
	<view class="container">
		<view class="header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="header-title">⏰ 学习时间设置</text>
			<view class="header-right"></view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">📅 每周学习计划</text>
				<text class="section-desc">设置每天的学习时间段和活动安排</text>
			</view>

			<view class="week-grid">
				<view 
					class="day-card" 
					v-for="(day, index) in weekDays" 
					:key="index"
					@click="selectDay(index)"
					:class="{ active: selectedDay === index }"
				>
					<text class="day-name">{{ day.name }}</text>
					<text class="day-date">{{ day.date }}</text>
					<view class="day-status" :class="getDayStatus(index)">
						{{ getDayStatusText(index) }}
					</view>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">🕐 {{ weekDays[selectedDay]?.name }} 安排</text>
			</view>

			<view class="day-settings">
				<view class="setting-item">
					<text class="setting-label">当天状态</text>
					<picker :value="currentDayStatus" :range="dayStatusOptions" @change="onDayStatusChange">
						<view class="setting-picker">
							{{ dayStatusOptions[currentDayStatus] }}
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>

				<view class="time-slots" v-if="currentDayStatus === 0">
					<view class="time-slot" v-for="(slot, index) in timeSlots" :key="index">
						<view class="slot-header">
							<text class="slot-title">时间段 {{ index + 1 }}</text>
							<text class="slot-delete" @click="removeSlot(index)" v-if="timeSlots.length > 1">✕</text>
						</view>
						<view class="slot-content">
							<view class="time-input-group">
								<view class="time-input-item">
									<text class="time-label">开始时间</text>
									<picker mode="time" :value="slot.startTime" @change="(e) => updateSlotTime(index, 'startTime', e)">
										<view class="time-input">{{ slot.startTime }}</view>
									</picker>
								</view>
								<text class="time-separator">~</text>
								<view class="time-input-item">
									<text class="time-label">结束时间</text>
									<picker mode="time" :value="slot.endTime" @change="(e) => updateSlotTime(index, 'endTime', e)">
										<view class="time-input">{{ slot.endTime }}</view>
									</picker>
								</view>
							</view>
							<view class="activity-input">
								<text class="time-label">学习活动</text>
								<input class="activity-input-field" v-model="slot.activity" placeholder="例如：画画、数学练习、阅读" />
							</view>
						</view>
					</view>
					<view class="add-slot-btn" @click="addSlot" v-if="timeSlots.length < 5">
						<text class="add-icon">+</text>
						<text class="add-text">添加时间段</text>
					</view>
				</view>

				<view class="activity-section" v-else-if="currentDayStatus === 1">
					<view class="activity-input">
						<text class="time-label">外出活动</text>
						<input class="activity-input-field" v-model="dayActivities[selectedDay]" placeholder="例如：周末出游、生日聚会、探亲访友" />
					</view>
					<view class="activity-tip">
						<text class="tip-icon">💡</text>
						<text class="tip-text">当天会根据活动类型智能安排较少的任务或相关活动任务</text>
					</view>
				</view>

				<view class="free-day-tip" v-else>
					<text class="tip-icon">🎉</text>
					<text class="tip-text">休息日，当天不安排任何学习任务</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-header">
				<text class="section-title">⚙️ 全局设置</text>
			</view>
			<view class="setting-item">
				<text class="setting-label">任务自动安排</text>
				<switch :checked="autoSchedule" @change="onAutoScheduleChange" />
			</view>
			<view class="setting-item">
				<text class="setting-label">学习提醒</text>
				<switch :checked="reminderEnabled" @change="onReminderChange" />
			</view>
		</view>

		<view class="save-btn-wrap">
			<button class="save-btn" @click="saveSchedule">保存设置</button>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'
	export default {
		data() {
			return {
				selectedDay: 0,
				weekDays: [],
				dayStatusOptions: ['正常学习', '外出活动', '休息日'],
				currentDayStatus: 0,
				timeSlots: [],
				dayActivities: ['', '', '', '', '', '', ''],
				autoSchedule: true,
				reminderEnabled: true,
				scheduleData: {}
			}
		},
		async onLoad() {
			this.initWeekDays()
			await this.loadSchedule()
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			initWeekDays() {
				const today = new Date()
				const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				this.weekDays = dayNames.map((name, index) => {
					const date = new Date(today)
					date.setDate(today.getDate() - today.getDay() + index)
					return {
						name: name,
						date: `${date.getMonth() + 1}/${date.getDate()}`,
						isToday: index === today.getDay()
					}
				})
			},
			async loadSchedule() {
				try {
					const result = await feishuRequest.queryRecords('学习时间表')
					if (result.success && result.data && result.data.length > 0) {
						const data = result.data[0].fields
						this.scheduleData = data
						this.autoSchedule = data.auto_schedule !== false
						this.reminderEnabled = data.reminder_enabled !== false
						this.dayActivities = data.activities ? JSON.parse(data.activities) : ['', '', '', '', '', '', '']
						this.loadDaySchedule(0)
					} else {
						this.initDefaultSchedule()
					}
				} catch (error) {
					console.error('[Learning Schedule] 加载学习时间表失败:', error)
					this.initDefaultSchedule()
				}
			},
			initDefaultSchedule() {
				this.timeSlots = [{
					startTime: '17:30',
					endTime: '19:00',
					activity: '画画'
				}]
			},
			loadDaySchedule(dayIndex) {
				if (this.scheduleData[`day_${dayIndex}_status`] !== undefined) {
					this.currentDayStatus = this.scheduleData[`day_${dayIndex}_status`]
				} else {
					this.currentDayStatus = 0
				}
				
				if (this.currentDayStatus === 0) {
					const slots = this.scheduleData[`day_${dayIndex}_slots`]
					this.timeSlots = slots ? JSON.parse(slots) : [{
						startTime: '17:30',
						endTime: '19:00',
						activity: ''
					}]
				}
				
				if (this.dayActivities[dayIndex] === undefined) {
					this.dayActivities[dayIndex] = ''
				}
			},
			selectDay(index) {
				this.saveCurrentDaySchedule()
				this.selectedDay = index
				this.loadDaySchedule(index)
			},
			saveCurrentDaySchedule() {
				this.scheduleData[`day_${this.selectedDay}_status`] = this.currentDayStatus
				if (this.currentDayStatus === 0) {
					this.scheduleData[`day_${this.selectedDay}_slots`] = JSON.stringify(this.timeSlots)
				}
			},
			onDayStatusChange(e) {
				this.currentDayStatus = e.detail.value
			},
			updateSlotTime(slotIndex, field, e) {
				this.timeSlots[slotIndex][field] = e.detail.value
			},
			addSlot() {
				this.timeSlots.push({
					startTime: '18:00',
					endTime: '19:30',
					activity: ''
				})
			},
			removeSlot(index) {
				if (this.timeSlots.length > 1) {
					this.timeSlots.splice(index, 1)
				}
			},
			onAutoScheduleChange(e) {
				this.autoSchedule = e.detail.value
			},
			onReminderChange(e) {
				this.reminderEnabled = e.detail.value
			},
			getDayStatus(index) {
				if (this.scheduleData[`day_${index}_status`] === 1) return 'activity'
				if (this.scheduleData[`day_${index}_status`] === 2) return 'rest'
				return 'normal'
			},
			getDayStatusText(index) {
				if (this.scheduleData[`day_${index}_status`] === 1) return '外出'
				if (this.scheduleData[`day_${index}_status`] === 2) return '休息'
				return '学习'
			},
			async saveSchedule() {
				this.saveCurrentDaySchedule()
				
				uni.showLoading({ title: '保存中...' })
				
				try {
					const saveData = {
						...this.scheduleData,
						auto_schedule: this.autoSchedule,
						reminder_enabled: this.reminderEnabled,
						activities: JSON.stringify(this.dayActivities)
					}
					
					const result = await feishuRequest.queryRecords('学习时间表')
					if (result.success && result.data && result.data.length > 0) {
						const recordId = result.data[0].record_id
						await feishuRequest.updateRecord('学习时间表', recordId, saveData)
					} else {
						await feishuRequest.addRecord('学习时间表', saveData)
					}
					
					uni.hideLoading()
					uni.showToast({ title: '保存成功', icon: 'success' })
				} catch (error) {
					console.error('[Learning Schedule] 保存失败:', error)
					uni.hideLoading()
					uni.showToast({ title: '保存失败', icon: 'none' })
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 160rpx;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 80rpx 30rpx 40rpx;
		display: flex;
		align-items: center;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		margin-right: 20rpx;
	}

	.back-icon {
		font-size: 40rpx;
		color: #fff;
		font-weight: bold;
	}

	.header-title {
		flex: 1;
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
		text-align: center;
	}

	.header-right {
		width: 60rpx;
	}

	.section {
		background-color: #fff;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 25rpx;
	}

	.section-header {
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}

	.section-desc {
		font-size: 24rpx;
		color: #999;
		margin-top: 5rpx;
	}

	.week-grid {
		display: flex;
		gap: 15rpx;
		overflow-x: auto;
		padding-bottom: 10rpx;
	}

	.day-card {
		flex-shrink: 0;
		width: 140rpx;
		text-align: center;
		padding: 20rpx 10rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
		border: 2rpx solid transparent;

		&.active {
			background-color: #e8eaf6;
			border-color: #667eea;
		}
	}

	.day-name {
		font-size: 26rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}

	.day-date {
		font-size: 22rpx;
		color: #999;
		display: block;
		margin-top: 5rpx;
	}

	.day-status {
		font-size: 20rpx;
		padding: 5rpx 12rpx;
		border-radius: 10rpx;
		margin-top: 10rpx;
		display: inline-block;

		&.normal {
			background-color: #e8f5e9;
			color: #4caf50;
		}

		&.activity {
			background-color: #fff3e0;
			color: #ff9500;
		}

		&.rest {
			background-color: #f3e5f5;
			color: #9c27b0;
		}
	}

	.day-settings {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.setting-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx;
		background-color: #fafafa;
		border-radius: 12rpx;
	}

	.setting-label {
		font-size: 28rpx;
		color: #333;
	}

	.setting-picker {
		display: flex;
		align-items: center;
		font-size: 28rpx;
		color: #667eea;
	}

	.picker-arrow {
		font-size: 32rpx;
		margin-left: 10rpx;
		color: #999;
	}

	.time-slots {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.time-slot {
		background-color: #fafafa;
		border-radius: 12rpx;
		padding: 20rpx;
	}

	.slot-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15rpx;
	}

	.slot-title {
		font-size: 26rpx;
		font-weight: bold;
		color: #333;
	}

	.slot-delete {
		font-size: 24rpx;
		color: #f44336;
		padding: 5rpx 10rpx;
	}

	.slot-content {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.time-input-group {
		display: flex;
		align-items: center;
		gap: 15rpx;
	}

	.time-input-item {
		flex: 1;
	}

	.time-label {
		font-size: 24rpx;
		color: #666;
		display: block;
		margin-bottom: 8rpx;
	}

	.time-input {
		width: 100%;
		height: 70rpx;
		padding: 0 20rpx;
		background-color: #fff;
		border-radius: 10rpx;
		font-size: 28rpx;
		text-align: center;
	}

	.time-separator {
		font-size: 32rpx;
		color: #999;
	}

	.activity-input {
		width: 100%;
	}

	.activity-input-field {
		width: 100%;
		height: 70rpx;
		padding: 0 20rpx;
		background-color: #fff;
		border-radius: 10rpx;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	.add-slot-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		padding: 20rpx;
		background-color: #f0f0f0;
		border-radius: 12rpx;
		margin-top: 10rpx;
	}

	.add-icon {
		font-size: 32rpx;
		color: #667eea;
	}

	.add-text {
		font-size: 26rpx;
		color: #667eea;
	}

	.activity-section {
		display: flex;
		flex-direction: column;
		gap: 15rpx;
	}

	.activity-tip, .free-day-tip {
		display: flex;
		align-items: flex-start;
		gap: 10rpx;
		padding: 20rpx;
		background-color: #fff3e0;
		border-radius: 12rpx;
	}

	.free-day-tip {
		background-color: #f3e5f5;
	}

	.tip-icon {
		font-size: 32rpx;
	}

	.tip-text {
		font-size: 24rpx;
		color: #666;
	}

	.save-btn-wrap {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 30rpx;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
		background-color: #fff;
		border-top: 1rpx solid #f0f0f0;
	}

	.save-btn {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
		border-radius: 44rpx;
		border: none;
	}
</style>