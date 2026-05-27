<template>
	<view class="forgot-container">
		<view class="forgot-header">
			<view class="back-btn" @click="goBack">←</view>
			<text class="title">忘记密码</text>
			<view class="placeholder"></view>
		</view>

		<view class="forgot-form">
			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">📱</text>
					<input class="form-input" v-model="phone" placeholder="请输入手机号" @blur="checkPhone" />
				</view>
				<text class="error-tip" v-if="phoneError">{{ phoneError }}</text>
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
					<text class="input-icon">🔑</text>
					<input class="form-input" :type="showNewPassword ? 'text' : 'password'" v-model="newPassword" placeholder="请设置新密码（6-16位）" />
					<text class="eye-icon" @click="showNewPassword = !showNewPassword">{{ showNewPassword ? '🙈' : '👁️' }}</text>
				</view>
				<text class="error-tip" v-if="newPasswordError">{{ newPasswordError }}</text>
			</view>

			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">🔑</text>
					<input class="form-input" :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="请确认新密码" />
					<text class="eye-icon" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? '🙈' : '👁️' }}</text>
				</view>
				<text class="error-tip" v-if="confirmPasswordError">{{ confirmPasswordError }}</text>
			</view>

			<view class="form-item">
				<view class="input-wrapper">
					<text class="input-icon">🔐</text>
					<input class="form-input" :type="showSecondPassword ? 'text' : 'password'" v-model="secondPassword" placeholder="请设置二级密码（用于家长身份验证）" />
					<text class="eye-icon" @click="showSecondPassword = !showSecondPassword">{{ showSecondPassword ? '🙈' : '👁️' }}</text>
				</view>
				<text class="error-tip" v-if="secondPasswordError">{{ secondPasswordError }}</text>
			</view>
			<button class="reset-btn" :class="{ disabled: !canReset }" @click="resetPassword">重置密码</button>

			<view class="login-link">
				<text class="link-text">记得密码了？</text>
				<text class="link-btn" @click="goToLogin">立即登录</text>
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
				code: '',
				newPassword: '',
				confirmPassword: '',
				secondPassword: '',

				phoneError: '',
				codeError: '',
				newPasswordError: '',
				confirmPasswordError: '',
				secondPasswordError: '',

				codeTimer: 0,
				sendBtnText: '发送验证码',
				canSendCode: true,

				showNewPassword: false,
				showConfirmPassword: false,
				showSecondPassword: false
			}
		},
		computed: {
			canReset() {
				return this.phone && this.code && this.newPassword && this.confirmPassword && this.secondPassword &&
					!this.phoneError && !this.codeError && !this.newPasswordError && !this.confirmPasswordError && !this.secondPasswordError
			}
		},
		methods: {
			async hashPassword(password) {
				const encoder = new TextEncoder()
				const data = encoder.encode(password)
				const hashBuffer = await crypto.subtle.digest('SHA-256', data)
				const hashArray = Array.from(new Uint8Array(hashBuffer))
				const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
				return hashHex
			},
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
				if (!this.newPassword) {
					this.newPasswordError = '请输入新密码'
				} else if (this.newPassword.length < 6 || this.newPassword.length > 16) {
					this.newPasswordError = '密码长度应在6-16位之间'
				} else {
					this.newPasswordError = ''
				}

				if (!this.confirmPassword) {
					this.confirmPasswordError = '请确认新密码'
				} else if (this.confirmPassword !== this.newPassword) {
					this.confirmPasswordError = '两次输入的密码不一致'
				} else {
					this.confirmPasswordError = ''
				}

				if (!this.secondPassword) {
					this.secondPasswordError = '请输入二级密码'
				} else if (this.secondPassword.length < 6 || this.secondPassword.length > 16) {
					this.secondPasswordError = '二级密码长度应在6-16位之间'
				} else {
					this.secondPasswordError = ''
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
			async resetPassword() {
				this.checkPhone()
				this.checkPasswords()

				if (!this.code) {
					this.codeError = '请输入验证码'
					return
				} else {
					this.codeError = ''
				}

				if (!this.canReset) return

				uni.showLoading({ title: '重置中...' })

				try {
					const user = await feishuRequest.getUserByPhone(this.phone)

					if (!user) {
						uni.hideLoading()
						uni.showToast({ title: '该手机号未注册', icon: 'none' })
						return
					}

					const hashedPassword = await this.hashPassword(this.newPassword)
					const hashedSecondPassword = await this.hashPassword(this.secondPassword)
					const result = await feishuRequest.updateRecord(
						'用户表',
						user.record_id,
						{
							password: hashedPassword,
							secondPassword: hashedSecondPassword,
							updatedTime: Date.now()
						}
					)

					uni.hideLoading()

					if (result.success) {
						uni.showToast({ title: '密码重置成功', icon: 'success' })
						setTimeout(() => {
							uni.navigateTo({ url: '/pages/login' })
						}, 1500)
					} else {
						uni.showToast({ title: '密码重置失败', icon: 'none' })
					}
				} catch (error) {
					uni.hideLoading()
					uni.showToast({ title: error.message || '密码重置失败', icon: 'none' })
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
	.forgot-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx;
		display: flex;
		flex-direction: column;
	}

	.forgot-header {
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

	.forgot-form {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 30rpx;
		padding: 40rpx;
		flex: 1;
	}

	.form-item {
		margin-bottom: 25rpx;
	}

	.input-wrapper {
		display: inline-flex;
		align-items: center;
		background: #f5f5f5;
		border-radius: 15rpx;
		padding: 20rpx 25rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.input-icon {
		font-size: 36rpx;
		margin-right: 15rpx;
		flex-shrink: 0;
	}

	.form-input {
		flex: 1;
		font-size: 28rpx;
		background: transparent;
		min-width: 0;
	}

	.eye-icon {
		font-size: 32rpx;
		padding: 10rpx;
		cursor: pointer;
		flex-shrink: 0;
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

	.reset-btn {
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
</style>