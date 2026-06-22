<template>
	<view class="register-container">
		<view class="register-header">
			<view class="back-btn" @click="goBack">←</view>
			<text class="title">注册账号</text>
			<view class="placeholder"></view>
		</view>

		<view class="register-form">
			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">📱</text>
					<input class="form-input" v-model="phone" placeholder="请输入手机号" @blur="checkPhone" />
				</view>
				<text class="error-tip" v-if="phoneError">{{ phoneError }}</text>
			</view>

			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">🔑</text>
					<input class="form-input" :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="请设置密码（6-16位）" />
					<text class="eye-icon" @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</text>
				</view>
				<text class="error-tip" v-if="passwordError">{{ passwordError }}</text>
			</view>

			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">🔑</text>
					<input class="form-input" :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="请确认密码" />
					<text class="eye-icon" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? '🙈' : '👁️' }}</text>
				</view>
				<text class="error-tip" v-if="confirmPasswordError">{{ confirmPasswordError }}</text>
			</view>

			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">📧</text>
					<input class="form-input" v-model="code" placeholder="请输入验证码" />
					<button class="send-code-btn" :class="{ disabled: !canSendCode }" @click="sendCode">{{ sendBtnText }}</button>
				</view>
				<text class="error-tip" v-if="codeError">{{ codeError }}</text>
			</view>

			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">🔐</text>
					<input class="form-input" :type="showSecondPassword ? 'text' : 'password'" v-model="secondPassword" placeholder="请设置二级密码（用于家长身份验证）" />
					<text class="eye-icon" @click="showSecondPassword = !showSecondPassword">{{ showSecondPassword ? '🙈' : '👁️' }}</text>
				</view>
				<text class="error-tip" v-if="secondPasswordError">{{ secondPasswordError }}</text>
			</view>

			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">👤</text>
					<input class="form-input" v-model="nickname" placeholder="请输入昵称" />
				</view>
			</view>

			<view class="checkbox-wrap">
				<view class="checkbox" :class="{ checked: agreed }" @click="agreed = !agreed">
					<text v-if="agreed">✓</text>
				</view>
				<text class="checkbox-label">我已阅读并同意</text>
				<text class="agreement-link" @click="showAgreement">《用户服务协议》</text>
				<text class="checkbox-label">和</text>
				<text class="agreement-link" @click="showPrivacy">《隐私政策》</text>
			</view>

			<button class="register-btn" :class="{ disabled: !canRegister }" @click="register">注册</button>

			<view class="login-link">
				<text class="link-text">已有账号？</text>
				<text class="link-btn" @click="goToLogin">立即登录</text>
			</view>
		</view>

		<view class="modal-overlay" v-if="showModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ modalTitle }}</text>
					<text class="modal-close" @click="closeModal">✕</text>
				</view>
				<scroll-view class="modal-body" scroll-y>
					<view class="agreement-content">
						<text class="agreement-title">用户服务协议</text>
						<text class="agreement-text">
							一、服务条款的确认和接纳
							\n\n
							您通过完成注册程序并点击"同意"按钮，即表示您与我们达成协议，完全接受本服务条款的所有内容。
							\n\n
							二、服务内容
							\n\n
							我们提供儿童成长管理服务，包括任务管理、积分系统、学习打卡等功能。
							\n\n
							三、用户义务
							\n\n
							您应自行妥善保管您的账号密码，并对您账号下的所有活动和事件承担全部责任。
							\n\n
							四、隐私保护
							\n\n
							我们重视用户隐私保护，不会向第三方泄露您的个人信息。
							\n\n
							五、服务变更与终止
							\n\n
							我们有权根据业务发展需要变更或终止服务，并提前通知用户。
						</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
	import { feishuRequest } from '@/common/feishu-request.js'

	export default {
		data() {
			return {
				phone: '',
				password: '',
				confirmPassword: '',
				code: '',
				secondPassword: '',
				nickname: '',
				agreed: false,
				showModal: false,
				modalTitle: '',

				phoneError: '',
				passwordError: '',
				confirmPasswordError: '',
				codeError: '',
				secondPasswordError: '',

				codeTimer: 0,
				sendBtnText: '发送验证码',
				canSendCode: true,

				showPassword: false,
				showConfirmPassword: false,
				showSecondPassword: false
			}
		},
		computed: {
			canRegister() {
				return this.phone && this.password && this.confirmPassword && this.code && this.secondPassword && this.agreed &&
					!this.phoneError && !this.passwordError && !this.confirmPasswordError && !this.codeError && !this.secondPasswordError
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			goToLogin() {
				uni.navigateTo({ url: '/pages/login' })
			},
			checkPhone() {
				const phoneRegex = /^1[3-9]\d{9}$/
				if (!this.phone) {
					this.phoneError = '请输入手机号'
				} else if (!phoneRegex.test(this.phone)) {
					this.phoneError = '请输入正确的手机号格式'
				} else {
					this.phoneError = ''
				}
			},
			checkPasswords() {
				if (!this.password) {
					this.passwordError = '请输入密码'
				} else if (this.password.length < 6 || this.password.length > 16) {
					this.passwordError = '密码长度应在6-16位之间'
				} else {
					this.passwordError = ''
				}

				if (!this.confirmPassword) {
					this.confirmPasswordError = '请确认密码'
				} else if (this.confirmPassword !== this.password) {
					this.confirmPasswordError = '两次输入的密码不一致'
				} else {
					this.confirmPasswordError = ''
				}
			},
			sendCode() {
				this.checkPhone()
				if (this.phoneError) return

				uni.showLoading({ title: '发送中...' })
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({ title: '验证码已发送', icon: 'success' })
					this.startCodeTimer()
				}, 1000)
			},
			startCodeTimer() {
				this.canSendCode = false
				let count = 60
				this.sendBtnText = `${count}秒后重发`
				this.codeTimer = setInterval(() => {
					count--
					this.sendBtnText = `${count}秒后重发`
					if (count <= 0) {
						clearInterval(this.codeTimer)
						this.canSendCode = true
						this.sendBtnText = '发送验证码'
					}
				}, 1000)
			},
			showAgreement() {
				this.modalTitle = '用户服务协议'
				this.showModal = true
			},
			showPrivacy() {
				this.modalTitle = '隐私政策'
				this.showModal = true
			},
			closeModal() {
				this.showModal = false
			},
			async hashPassword(password) {
				const encoder = new TextEncoder()
				const data = encoder.encode(password)
				const hashBuffer = await crypto.subtle.digest('SHA-256', data)
				const hashArray = Array.from(new Uint8Array(hashBuffer))
				const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
				return hashHex
			},
			async register() {
				this.checkPhone()
				this.checkPasswords()

				if (!this.secondPassword) {
					this.secondPasswordError = '请输入二级密码'
					return
				} else {
					this.secondPasswordError = ''
				}

				if (!this.code) {
					this.codeError = '请输入验证码'
					return
				} else {
					this.codeError = ''
				}

				if (!this.canRegister) return

				uni.showLoading({ title: '注册中...' })

				try {
					const hashedPassword = await this.hashPassword(this.password)
					const hashedSecondPassword = await this.hashPassword(this.secondPassword)

					const userData = {
						phone: this.phone,
						password: hashedPassword,
						role: 'parent',
						second_password: hashedSecondPassword,
						nickname: this.nickname || this.phone.slice(-4),
						createdTime: Date.now(),
						updatedTime: Date.now()
					}

					const result = await feishuRequest.registerOrUpdateUser(userData)

					uni.hideLoading()

					if (result.success) {
						uni.showToast({ title: '注册成功', icon: 'success' })
						setTimeout(() => {
							uni.navigateTo({ url: '/pages/login' })
						}, 1500)
					} else if (result.action === 'exists') {
						uni.showToast({ title: '账号已注册', icon: 'none' })
					} else {
						uni.showToast({ title: result.message || '注册失败', icon: 'none' })
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({ title: error.message || '注册失败', icon: 'none' })
				}
			}
		},
		onUnload() {
			if (this.codeTimer) {
				clearInterval(this.codeTimer)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.register-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx;
		display: flex;
		flex-direction: column;
	}

	.register-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 0;
		margin-bottom: 60rpx;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		font-size: 32rpx;
		color: #fff;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.placeholder {
		width: 60rpx;
	}

	.register-form {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 30rpx;
		padding: 40rpx;
		flex: 1;
	}

	.form-item {
		margin-bottom: 25rpx;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		background: #f5f5f5;
		border-radius: 15rpx;
		padding: 0 25rpx;
	}

	.input-icon {
		font-size: 36rpx;
		margin-right: 15rpx;
	}

	.form-input {
		flex: 1;
		height: 80rpx;
		font-size: 28rpx;
		background: transparent;
	}

	.eye-icon {
		font-size: 32rpx;
		padding: 10rpx;
		cursor: pointer;
	}

	.send-code-btn {
		padding: 15rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
		margin-left: 10rpx;

		&.disabled {
			background: #ccc;
		}
	}

	.error-tip {
		font-size: 24rpx;
		color: #ff4d4f;
		margin-top: 10rpx;
		margin-left: 10rpx;
	}

	.checkbox-wrap {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		flex-wrap: wrap;
	}

	.checkbox {
		width: 40rpx;
		height: 40rpx;
		border: 2rpx solid #ccc;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 10rpx;
		font-size: 24rpx;
		color: #667eea;

		&.checked {
			background: #667eea;
			border-color: #667eea;
			color: #fff;
		}
	}

	.checkbox-label {
		font-size: 24rpx;
		color: #666;
	}

	.agreement-link {
		font-size: 24rpx;
		color: #667eea;
	}

	.register-btn {
		width: 100%;
		height: 88rpx;
		border-radius: 44rpx;
		font-size: 32rpx;
		font-weight: bold;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: none;
		margin-top: 20rpx;

		&.disabled {
			background: #ccc;
		}
	}

	.login-link {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 30rpx;
		gap: 10rpx;
	}

	.link-text {
		font-size: 26rpx;
		color: #666;
	}

	.link-btn {
		font-size: 26rpx;
		color: #667eea;
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
		max-height: 70vh;
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
		max-height: 50vh;
	}

	.agreement-content {
		font-size: 26rpx;
		line-height: 1.8;
		color: #666;
	}

	.agreement-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 20rpx;
		text-align: center;
	}
</style>