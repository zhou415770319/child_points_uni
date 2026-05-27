<template>
	<view class="container">
		<view class="header">
			<text class="title">设备信息插件测试</text>
		</view>
		
		<view class="section">
			<text class="section-title">📱 设备信息</text>
			<view class="info-list">
				<view class="info-item">
					<text class="info-label">设备型号</text>
					<text class="info-value">{{ deviceInfo.model }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">设备品牌</text>
					<text class="info-value">{{ deviceInfo.brand }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">系统版本</text>
					<text class="info-value">{{ deviceInfo.osVersion }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">系统类型</text>
					<text class="info-value">{{ deviceInfo.osType }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">应用版本</text>
					<text class="info-value">{{ deviceInfo.appVersion }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">屏幕分辨率</text>
					<text class="info-value">{{ deviceInfo.screenWidth }} × {{ deviceInfo.screenHeight }}</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">📡 网络信息</text>
			<view class="info-list">
				<view class="info-item">
					<text class="info-label">网络类型</text>
					<text class="info-value">{{ networkInfo.type }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">是否连接</text>
					<text class="info-value" :class="networkInfo.isConnected ? 'connected' : 'disconnected'">
						{{ networkInfo.isConnected ? '已连接' : '未连接' }}
					</text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">🔋 电池信息</text>
			<view class="info-list">
				<view class="info-item">
					<text class="info-label">电池电量</text>
					<text class="info-value">{{ batteryInfo.level === -1 ? '未知' : batteryInfo.level + '%' }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">是否充电</text>
					<text class="info-value" :class="batteryInfo.isCharging ? 'charging' : ''">
						{{ batteryInfo.isCharging ? '充电中' : '未充电' }}
					</text>
				</view>
			</view>
		</view>
		
		<view class="button-area">
			<button class="refresh-btn" @click="refreshInfo">刷新信息</button>
		</view>
	</view>
</template>

<script>
import { getDeviceInfo, getNetworkInfo, getBatteryInfo } from '@/uni_modules/uni-device-info/src/index.uts'

export default {
	data() {
		return {
			deviceInfo: {
				model: '',
				brand: '',
				osVersion: '',
				osType: '',
				uuid: '',
				appVersion: '',
				appVersionCode: '',
				deviceName: '',
				screenWidth: 0,
				screenHeight: 0,
				pixelRatio: 0
			},
			networkInfo: {
				type: '',
				isConnected: false
			},
			batteryInfo: {
				level: -1,
				isCharging: false
			}
		}
	},
	onLoad() {
		this.refreshInfo()
	},
	methods: {
		refreshInfo() {
			uni.showLoading({ title: '获取中...' })
			
			try {
				this.deviceInfo = getDeviceInfo()
				this.networkInfo = getNetworkInfo()
				this.batteryInfo = getBatteryInfo()
			} catch (error) {
				console.error('获取设备信息失败:', error)
				uni.showToast({ title: '获取失败', icon: 'error' })
			} finally {
				uni.hideLoading()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
}

.header {
	text-align: center;
	padding: 40rpx 0;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.section {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
	display: block;
}

.info-list {
	display: flex;
	flex-direction: column;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	&:last-child {
		border-bottom: none;
	}
}

.info-label {
	font-size: 28rpx;
	color: #999;
}

.info-value {
	font-size: 28rpx;
	color: #333;
	
	&.connected {
		color: #07c160;
	}
	
	&.disconnected {
		color: #ff4d4f;
	}
	
	&.charging {
		color: #1890ff;
	}
}

.button-area {
	padding: 40rpx 0;
}

.refresh-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	font-size: 32rpx;
	border-radius: 44rpx;
	border: none;
	
	&:active {
		opacity: 0.8;
	}
}
</style>