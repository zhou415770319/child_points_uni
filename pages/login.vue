<template>
	<view class="container">
		<view class="feishu-config-btn" @click="goToFeishuConfig">
			<text class="config-icon">⚙️</text>
			<text class="config-text">飞书配置</text>
		</view>
		<view class="logo-section">
			<view class="logo">🎨</view>
			<text class="app-name">童趣乐园</text>
			<text class="app-desc">让学习更有趣，让成长看得见</text>
		</view>

		<view class="login-form">
			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">👤</text>
					<input class="form-input" v-model="phone" placeholder="请输入手机号" />
				</view>
			</view>
			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">🔒</text>
					<input class="form-input" :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="请输入密码" />
					<text class="eye-icon" @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</text>
				</view>
			</view>
			<view class="role-section">
				<view class="role-tabs">
					<view 
						class="role-tab" 
						v-for="option in roleOptions" 
						:key="option.value"
						:class="{ active: role === option.value }" 
						@click="switchRole(option.value)"
					>
						{{ option.value === 'parent' ? '👨‍👩‍👧' : '👧' }} {{ option.label }}
					</view>
				</view>
			</view>
			<view class="form-item" v-if="role === 'parent'">
				<view class="input-wrapper">
					<text class="input-icon">🔐</text>
					<input class="form-input" :type="showSecondPassword ? 'text' : 'password'" v-model="secondPassword" placeholder="请输入二级密码" />
					<text class="eye-icon" @click="showSecondPassword = !showSecondPassword">{{ showSecondPassword ? '🙈' : '👁️' }}</text>
				</view>
			</view>
			<view class="form-options">
				<view class="remember-me" @click="toggleRememberMe">
					<view class="check-box" :class="{ checked: rememberMe }">
						<text v-if="rememberMe" class="check-icon">✓</text>
					</view>
					<text class="remember-text">记住我</text>
				</view>
				<view class="forgot-wrap" @click="forgotPassword">
					<text class="forgot-link">忘记密码？</text>
				</view>
			</view>
			<button class="login-btn" @click="login">登录</button>
			<button class="register-btn" @click="register">注册新账号</button>
		</view>

		<view class="quick-login">
			<text class="quick-label">快捷登录</text>
			<view class="quick-btns">
				<button class="quick-btn" @click="loginWithFeishu">
					<text class="quick-icon">💬</text>
					<text class="quick-text">飞书登录</text>
				</button>
				<button class="quick-btn" @click="loginWithWechat">
					<text class="quick-icon">💚</text>
					<text class="quick-text">微信登录</text>
				</button>
			</view>
		</view>

		<view class="modal-overlay" v-if="showChildSelect" @click="closeChildSelect">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">👧 选择儿童账号</text>
					<text class="modal-close" @click="closeChildSelect">✕</text>
				</view>
				<view class="modal-body">
					<view class="child-list">
						<view class="child-item" v-for="child in children" :key="child.id" @click="selectChild(child)">
							<view class="child-avatar">
								<image v-if="child.avatar && child.avatar.startsWith('http')" class="avatar-img" :src="child.avatar" mode="aspectFill" />
								<text v-else>{{ child.avatar }}</text>
							</view>
							<view class="child-info">
								<text class="child-name">{{ child.name }}</text>
								<text class="child-detail">{{ child.age }}岁 · {{ child.grade }}</text>
							</view>
							<text class="child-arrow">→</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'
	import CategoryManager from '@/common/category-manager.js'
	import UserManager from '@/common/user-manager.js'

	export default {
		data() {
			return {
				phone: '',
				password: '',
				secondPassword: '',
				rememberMe: false,
				role: 'parent',
				showChildSelect: false,
				children: [],
				showPassword: false,
				showSecondPassword: false,
				roleOptions: []  // 角色选项（从分类表获取）
			}
		},
		onLoad() {
			console.log('[Login] ===== 页面加载开始 =====')
			// 页面加载时初始化角色选项
			this.initRoleOptions()
			// 加载上次登录的角色
			this.loadLastLoginRole()
			// 页面加载时自动检查是否有保存的记住我信息
			this.autoLoadRememberMeInfo()
			console.log('[Login] ===== 页面加载完成 =====')
		},
		methods: {
			async initRoleOptions() {
				// 先尝试从缓存获取
				const cachedRoles = CategoryManager.getRoleOptions()
				if (cachedRoles && cachedRoles.length > 0) {
					this.roleOptions = cachedRoles
					console.log('[Login] 从缓存加载角色选项:', this.roleOptions)
				}
				
				// 无论缓存是否有数据，都尝试从云函数刷新（缓存优先）
				await CategoryManager.loadCategories('login-init')
				this.roleOptions = CategoryManager.getRoleOptions()
				
				// 如果角色选项为空，使用默认值作为备用
				if (!this.roleOptions || this.roleOptions.length === 0) {
					this.roleOptions = [
						{ label: '家长端', value: 'parent' },
						{ label: '儿童端', value: 'child' }
					]
				}
				console.log('[Login] 角色选项初始化完成:', this.roleOptions)
			},
			switchRole(role) {
				this.role = role
				this.secondPassword = ''
				this.showPassword = false
				this.showSecondPassword = false
				// 检查是否有该角色的记住我信息
				this.loadRememberMeInfoByRole(role)
			},
			loadLastLoginRole() {
				try {
					const lastRole = uni.getStorageSync('lastLoginRole')
					if (lastRole && (lastRole === 'parent' || lastRole === 'child')) {
						this.role = lastRole
						console.log('[Login] loadLastLoginRole - 加载上次登录角色:', this.role)
					} else {
						console.log('[Login] loadLastLoginRole - 无上次登录记录，使用默认角色:', this.role)
					}
				} catch (error) {
					console.error('[Login] 加载上次登录角色失败:', error)
				}
			},
			autoLoadRememberMeInfo() {
				console.log('[Login] autoLoadRememberMeInfo - 当前角色:', this.role)
				try {
					const rememberMeInfo = uni.getStorageSync('rememberMeInfo')
					console.log('[Login] autoLoadRememberMeInfo - 存储中的rememberMeInfo:', rememberMeInfo)
					if (rememberMeInfo) {
						const info = JSON.parse(rememberMeInfo)
						console.log('[Login] autoLoadRememberMeInfo - 解析后的info:', info)
						if (this.role === 'parent' && info.parent) {
							this.phone = info.parent.phone || ''
							this.password = info.parent.password || ''
							this.rememberMe = true
							console.log('[Login] autoLoadRememberMeInfo - 加载家长端信息:', this.phone, this.password)
						} else if (this.role === 'child' && info.child) {
							this.phone = info.child.phone || ''
							this.password = info.child.password || ''
							this.rememberMe = true
							console.log('[Login] autoLoadRememberMeInfo - 加载儿童端信息:', this.phone, this.password)
						} else {
							console.log('[Login] autoLoadRememberMeInfo - 没有对应角色的信息')
						}
					} else {
						console.log('[Login] autoLoadRememberMeInfo - 存储中无rememberMeInfo')
					}
				} catch (error) {
					console.error('[Login] 自动加载记住我信息失败:', error)
				}
			},
			loadRememberMeInfoByRole(role) {
				try {
					const rememberMeInfo = uni.getStorageSync('rememberMeInfo')
					if (rememberMeInfo) {
						const info = JSON.parse(rememberMeInfo)
						if (role === 'parent' && info.parent) {
							this.phone = info.parent.phone || ''
							this.password = info.parent.password || ''
							this.rememberMe = true
						} else if (role === 'child' && info.child) {
							this.phone = info.child.phone || ''
							this.password = info.child.password || ''
							this.rememberMe = true
						} else {
							// 该角色没有保存的信息，重置记住我状态
							this.rememberMe = false
						}
					} else {
						this.rememberMe = false
					}
				} catch (error) {
					console.error('[Login] 加载记住我信息失败:', error)
					this.rememberMe = false
				}
			},
			loadRememberMeInfo() {
				this.loadRememberMeInfoByRole(this.role)
			},
			onRememberMeChange(e) {
				console.log('[Login] onRememberMeChange - 触发事件:', e)
				if (e && e.detail !== undefined && e.detail.value !== undefined) {
					this.rememberMe = e.detail.value
				} else {
					this.rememberMe = !this.rememberMe
				}
				console.log('[Login] onRememberMeChange - 新状态:', this.rememberMe)
				this.handleRememberMeChange()
			},
			onRememberMeClick() {
				console.log('[Login] onRememberMeClick - 触发点击')
				this.rememberMe = !this.rememberMe
				console.log('[Login] onRememberMeClick - 新状态:', this.rememberMe)
				this.handleRememberMeChange()
			},
			handleRememberMeChange() {
				if (this.rememberMe) {
					console.log('[Login] handleRememberMeChange - 勾选，加载保存的信息')
					this.loadRememberMeInfoByRole(this.role)
				} else {
					console.log('[Login] handleRememberMeChange - 取消勾选，清除密码和存储')
					this.password = ''
					this.secondPassword = ''
					uni.removeStorageSync('rememberMeInfo')
					console.log('[Login] handleRememberMeChange - 已清除rememberMeInfo存储')
				}
			},
			toggleRememberMe() {
				console.log('[Login] toggleRememberMe - 点击前 rememberMe:', this.rememberMe)
				this.rememberMe = !this.rememberMe
				console.log('[Login] toggleRememberMe - 点击后 rememberMe:', this.rememberMe)
			},
			saveRememberMeInfo() {
				console.log('[Login] saveRememberMeInfo - rememberMe:', this.rememberMe)
				console.log('[Login] saveRememberMeInfo - 当前角色:', this.role)

				try {
					let rememberMeInfo = {}
					const existingInfo = uni.getStorageSync('rememberMeInfo')
					if (existingInfo) {
						rememberMeInfo = JSON.parse(existingInfo)
					}
					console.log('[Login] saveRememberMeInfo - 现有存储:', rememberMeInfo)

					if (!this.rememberMe) {
						// 未勾选记住我，只清除当前角色的信息，保留另一角色的信息
						console.log('[Login] saveRememberMeInfo - 未勾选记住我，清除当前角色信息')
						if (this.role === 'parent') {
							delete rememberMeInfo.parent
							console.log('[Login] saveRememberMeInfo - 已清除家长端信息')
						} else if (this.role === 'child') {
							delete rememberMeInfo.child
							console.log('[Login] saveRememberMeInfo - 已清除儿童端信息')
						}
					} else {
						// 勾选记住我，保存当前角色的信息
						if (this.role === 'parent') {
							rememberMeInfo.parent = {
								phone: this.phone,
								password: this.password
							}
							console.log('[Login] saveRememberMeInfo - 保存家长端信息:', this.phone)
						} else if (this.role === 'child') {
							rememberMeInfo.child = {
								phone: this.phone,
								password: this.password
							}
							console.log('[Login] saveRememberMeInfo - 保存儿童端信息:', this.phone)
						}
					}

					// 如果还有剩余信息则保存，否则清除整个存储
					if (Object.keys(rememberMeInfo).length > 0) {
						uni.setStorageSync('rememberMeInfo', JSON.stringify(rememberMeInfo))
						console.log('[Login] saveRememberMeInfo - 最终保存:', rememberMeInfo)
					} else {
						uni.removeStorageSync('rememberMeInfo')
						console.log('[Login] saveRememberMeInfo - 所有信息已清空，移除存储')
					}
				} catch (error) {
					console.error('[Login] 保存记住我信息失败:', error)
				}
			},
			async login() {
				if (!this.phone) {
					uni.showToast({ title: '请输入手机号', icon: 'none' })
					return
				}
				if (!this.password) {
					uni.showToast({ title: '请输入密码', icon: 'none' })
					return
				}

				uni.showLoading({ title: '登录中...' })

				try {
					const result = await feishuRequest.loginUser(this.phone, this.password, this.role, this.secondPassword)
					uni.hideLoading()

					if (!result.success) {
						uni.showToast({ title: result.message, icon: 'none' })
						return
					}

					// 保存记住我信息（不保存二级密码）
					this.saveRememberMeInfo()

					// 保存当前角色
					uni.setStorageSync('userRole', this.role)
					// 记录上次登录的角色
					uni.setStorageSync('lastLoginRole', this.role)
					uni.setStorageSync('currentUser', JSON.stringify(result.user))

					await this.loadCategories()

					if (this.role === 'parent') {
						uni.switchTab({ url: '/pages/parent/dashboard' })
					} else {
						this.loadChildren()
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({ title: error.message || '登录失败', icon: 'none' })
				}
			},
			async loadCategories() {
				await CategoryManager.loadCategories('login')
				// 从分类管理器获取角色选项
				this.roleOptions = CategoryManager.getRoleOptions()
				console.log('[Login] 角色选项已加载:', this.roleOptions)
				
				// 如果角色选项为空，使用默认值作为备用
				if (!this.roleOptions || this.roleOptions.length === 0) {
					this.roleOptions = [
						{ label: '家长端', value: 'parent' },
						{ label: '儿童端', value: 'child' }
					]
				}
			},
			async loadChildren() {
			uni.showLoading({ title: '加载中...' })
			try {
				// 使用UserManager从用户表获取当前登录的家长账号
				const parent = await UserManager.getCurrentParent()
				const parentAccount = parent?.phone || ''
				console.log('当前家长---', parent);
				
				// 使用UserManager获取儿童列表
				const children = await UserManager.getChildrenByParent(parentAccount)
				console.log('儿童列表---', children);
				
				if (children && children.length > 0) {
					this.children = children.map(item => ({
						...item,
						id: item.child_id || item.id,
						avatar: item.avatar || this.getRandomAvatar()
					}))
				} else {
					this.children = []
				}
				
				// 如果没有绑定的儿童，提示用户
				if (this.children.length === 0) {
					uni.showToast({ title: '暂无绑定的儿童账号', icon: 'none' })
					return
				}
				
				this.showChildSelect = true
			} catch (error) {
				console.error('加载儿童列表失败:', error)
				uni.showToast({ title: '加载失败', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		},
			getRandomAvatar() {
				const avatars = ['👦', '👧', '🧒', '👶']
				return avatars[Math.floor(Math.random() * avatars.length)]
			},
			selectChild(child) {
				uni.setStorageSync('currentChild', JSON.stringify(child))
				this.showChildSelect = false
				uni.switchTab({ url: '/pages/child/home' })
			},
			closeChildSelect() {
				this.showChildSelect = false
			},
			forgotPassword() {
				uni.navigateTo({ url: '/pages/forgot-password/index' })
			},
			register() {
				uni.navigateTo({ url: '/pages/register/index' })
			},
			loginWithFeishu() {
				uni.showToast({ title: '飞书登录开发中', icon: 'none' })
			},
			loginWithWechat() {
				uni.showToast({ title: '微信登录开发中', icon: 'none' })
			},
			goToFeishuConfig() {
				uni.navigateTo({
					url: '/uni_modules/settings-feishu-database/pages/config/index'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.feishu-config-btn {
		position: absolute;
		top: 80rpx;
		right: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 24rpx;
		background-color: rgba(255, 255, 255, 0.25);
		border-radius: 16rpx;
		backdrop-filter: blur(10px);
	}

	.config-icon {
		font-size: 36rpx;
	}

	.config-text {
		font-size: 22rpx;
		color: #fff;
	}

	.logo-section {
		text-align: center;
		padding: 80rpx 0 60rpx;
	}

	.logo {
		width: 160rpx;
		height: 160rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 80rpx;
		margin: 0 auto 30rpx;
	}

	.app-name {
		font-size: 40rpx;
		font-weight: bold;
		color: #fff;
		display: block;
		margin-bottom: 15rpx;
	}

	.app-desc {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.login-form {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 40rpx;
	}

	.form-item {
		margin-bottom: 25rpx;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		background-color: #f5f5f5;
		border-radius: 12rpx;
		padding: 0 20rpx;
	}

	.input-icon {
		font-size: 32rpx;
		margin-right: 15rpx;
	}

	.form-input {
		flex: 1;
		height: 80rpx;
		font-size: 28rpx;
		background-color: transparent;
	}

	.eye-icon {
		font-size: 32rpx;
		padding: 10rpx;
		cursor: pointer;
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.remember-me {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 10rpx 15rpx;
		cursor: pointer;
	}

	.check-box {
		width: 40rpx;
		height: 40rpx;
		border: 2rpx solid #ccc;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #fff;
	}

	.check-box.checked {
		background-color: #667eea;
		border-color: #667eea;
	}

	.check-icon {
		font-size: 24rpx;
		color: #fff;
		font-weight: bold;
	}

	.remember-text {
		font-size: 26rpx;
		color: #666;
	}

	.forgot-wrap {
		padding: 10rpx 15rpx;
		cursor: pointer;
	}

	.forgot-link {
		font-size: 26rpx;
		color: #667eea;
	}

	.login-btn {
		width: 100%;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 32rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
		margin-bottom: 20rpx;
	}

	.register-btn {
		width: 100%;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 32rpx;
		background-color: transparent;
		color: #667eea;
		border: 2rpx solid #667eea;
	}

	.role-section {
		margin: 25rpx 0;
	}

	.role-tabs {
		display: flex;
		gap: 20rpx;
	}

	.role-tab {
		flex: 1;
		padding: 20rpx;
		border-radius: 15rpx;
		text-align: center;
		font-size: 28rpx;
		background: #f5f5f5;
		transition: all 0.3s;

		&.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
		}
	}

	.quick-login {
		margin-top: 40rpx;
		text-align: center;
	}

	.quick-label {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.8);
		display: block;
		margin-bottom: 20rpx;
	}

	.quick-btns {
		display: flex;
		justify-content: center;
		gap: 30rpx;
	}

	.quick-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
		width: 150rpx;
		height: 150rpx;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 20rpx;
		border: none;
		padding: 20rpx;
	}

	.quick-icon {
		font-size: 48rpx;
	}

	.quick-text {
		font-size: 24rpx;
		color: #fff;
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
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.modal-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}

	.modal-close {
		font-size: 36rpx;
		color: #999;
		padding: 10rpx;
	}

	.modal-body {
		padding: 20rpx;
		max-height: 60vh;
		overflow-y: auto;
	}

	.child-list {
		display: flex;
		flex-direction: column;
	}

	.child-item {
		display: flex;
		align-items: center;
		padding: 25rpx 20rpx;
		border-radius: 15rpx;
		margin-bottom: 15rpx;
		background-color: #fafafa;

		&:active {
			background-color: #f0f0f0;
		}
	}

	.child-avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background-color: #667eea;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		margin-right: 20rpx;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}

	.child-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.child-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.child-detail {
		font-size: 24rpx;
		color: #999;
		margin-top: 8rpx;
	}

	.child-arrow {
		font-size: 40rpx;
		color: #ccc;
	}
</style>