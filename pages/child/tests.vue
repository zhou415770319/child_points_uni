<template>
	<view class="container">
		<view class="header">
			<view class="header-bg"></view>
			<view class="header-content">
				<text class="header-title">🎯 能力测试</text>
				<text class="header-desc">发现你的潜力，探索无限可能</text>
			</view>
		</view>

		<view class="test-cards">
			<view class="test-card knowledge" @click="startTest('knowledge')">
				<view class="card-icon">📚</view>
				<view class="card-content">
					<text class="card-title">知识测试</text>
					<text class="card-desc">测试你的知识储备，了解学习进度</text>
				</view>
				<view class="card-arrow">›</view>
				<view class="card-progress" v-if="knowledgeResult">
					<text class="progress-text">已完成：{{ knowledgeResult.level }}</text>
				</view>
			</view>

			<view class="test-card personality" @click="startTest('personality')">
				<view class="card-icon">🌟</view>
				<view class="card-content">
					<text class="card-title">性格测试</text>
					<text class="card-desc">探索你的性格特质，发现独特优势</text>
				</view>
				<view class="card-arrow">›</view>
				<view class="card-progress" v-if="personalityResult">
					<text class="progress-text">已完成：{{ personalityResult.type }}</text>
				</view>
			</view>

			<view class="test-card career" @click="startTest('career')">
				<view class="card-icon">🚀</view>
				<view class="card-content">
					<text class="card-title">职业测试</text>
					<text class="card-desc">发现你的职业兴趣，规划未来方向</text>
				</view>
				<view class="card-arrow">›</view>
				<view class="card-progress" v-if="careerResult">
					<text class="progress-text">已完成：{{ careerResult.suggestion }}</text>
				</view>
			</view>
		</view>

		<view class="results-section" v-if="hasResults">
			<view class="section-header">
				<text class="section-title">📊 我的测试报告</text>
			</view>
			<view class="results-summary">
				<view class="summary-item" v-if="knowledgeResult">
					<text class="summary-label">知识掌握</text>
					<view class="summary-bar">
						<view class="summary-fill" :style="{ width: knowledgeResult.score + '%' }"></view>
					</view>
					<text class="summary-value">{{ knowledgeResult.score }}%</text>
				</view>
				<view class="summary-item" v-if="personalityResult">
					<text class="summary-label">性格类型</text>
					<text class="summary-value highlight">{{ personalityResult.type }}</text>
				</view>
				<view class="summary-item" v-if="careerResult">
					<text class="summary-label">职业倾向</text>
					<text class="summary-value highlight">{{ careerResult.suggestion }}</text>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="showTestModal" @click="closeTestModal">
			<view class="test-modal" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ currentTestTitle }}</text>
					<text class="modal-close" @click="closeTestModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="question-progress">
						<text class="progress-num">{{ currentQuestionIndex + 1 }}/{{ currentQuestions.length }}</text>
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: ((currentQuestionIndex + 1) / currentQuestions.length * 100) + '%' }"></view>
						</view>
					</view>

					<view class="question-content">
						<text class="question-text">{{ currentQuestion.text }}</text>
					</view>

					<view class="options-list">
						<view 
							class="option-item" 
							v-for="(option, index) in currentQuestion.options" 
							:key="index"
							:class="{ selected: currentAnswer === index }"
							@click="selectAnswer(index)"
						>
							<view class="option-indicator">{{ String.fromCharCode(65 + index) }}</view>
							<text class="option-text">{{ option.text }}</text>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn" :disabled="currentAnswer === -1" @click="nextQuestion">
						{{ currentQuestionIndex < currentQuestions.length - 1 ? '下一题' : '查看结果' }}
					</button>
				</view>
			</view>
		</view>

		<view class="modal-overlay" v-if="showResultModal" @click="closeResultModal">
			<view class="result-modal" @click.stop>
				<view class="result-header">
					<text class="result-icon">{{ resultIcon }}</text>
					<text class="result-title">{{ resultTitle }}</text>
				</view>
				<view class="result-body">
					<text class="result-desc">{{ resultDescription }}</text>
					<view class="result-details" v-if="resultDetails">
						<text class="details-title">详细分析</text>
						<text class="details-content">{{ resultDetails }}</text>
					</view>
					<view class="result-score" v-if="resultScore">
						<text class="score-label">综合得分</text>
						<text class="score-value">{{ resultScore }}</text>
						<text class="score-unit">分</text>
					</view>
				</view>
				<view class="result-footer">
					<button class="result-btn" @click="closeResultModal">完成</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				showTestModal: false,
				showResultModal: false,
				currentTestType: '',
				currentTestTitle: '',
				currentQuestions: [],
				currentQuestionIndex: 0,
				currentAnswer: -1,
				answers: [],
				knowledgeResult: null,
				personalityResult: null,
				careerResult: null,
				resultIcon: '',
				resultTitle: '',
				resultDescription: '',
				resultDetails: '',
				resultScore: 0
			}
		},
		computed: {
			hasResults() {
				return this.knowledgeResult || this.personalityResult || this.careerResult
			},
			currentQuestion() {
				return this.currentQuestions[this.currentQuestionIndex] || { text: '', options: [] }
			}
		},
		onShow() {
			this.loadResults()
		},
		methods: {
			loadResults() {
				const results = uni.getStorageSync('child_test_results') || {}
				this.knowledgeResult = results.knowledge || null
				this.personalityResult = results.personality || null
				this.careerResult = results.career || null
			},
			saveResults(type, result) {
				const results = uni.getStorageSync('child_test_results') || {}
				results[type] = result
				uni.setStorageSync('child_test_results', results)
			},
			startTest(type) {
				this.currentTestType = type
				this.currentQuestionIndex = 0
				this.currentAnswer = -1
				this.answers = []
				this.showResultModal = false

				switch (type) {
					case 'knowledge':
						this.currentTestTitle = '📚 知识测试'
						this.currentQuestions = this.getKnowledgeQuestions()
						break
					case 'personality':
						this.currentTestTitle = '🌟 性格测试'
						this.currentQuestions = this.getPersonalityQuestions()
						break
					case 'career':
						this.currentTestTitle = '🚀 职业测试'
						this.currentQuestions = this.getCareerQuestions()
						break
				}
				this.showTestModal = true
			},
			selectAnswer(index) {
				this.currentAnswer = index
			},
			nextQuestion() {
				if (this.currentAnswer === -1) return

				this.answers.push(this.currentAnswer)
				this.currentQuestionIndex++
				this.currentAnswer = -1

				if (this.currentQuestionIndex >= this.currentQuestions.length) {
					this.calculateResult()
				}
			},
			calculateResult() {
				this.showTestModal = false

				switch (this.currentTestType) {
					case 'knowledge':
						this.calculateKnowledgeResult()
						break
					case 'personality':
						this.calculatePersonalityResult()
						break
					case 'career':
						this.calculateCareerResult()
						break
				}

				this.showResultModal = true
			},
			getKnowledgeQuestions() {
				return [
					{
						text: '中国的首都是哪个城市？',
						options: [
							{ text: '上海', value: 0 },
							{ text: '北京', value: 1 },
							{ text: '广州', value: 0 },
							{ text: '深圳', value: 0 }
						]
					},
					{
						text: '水的化学式是什么？',
						options: [
							{ text: 'CO2', value: 0 },
							{ text: 'H2O', value: 1 },
							{ text: 'NaCl', value: 0 },
							{ text: 'O2', value: 0 }
						]
					},
					{
						text: '以下哪个是质数？',
						options: [
							{ text: '4', value: 0 },
							{ text: '9', value: 0 },
							{ text: '11', value: 1 },
							{ text: '15', value: 0 }
						]
					},
					{
						text: '《西游记》的作者是谁？',
						options: [
							{ text: '曹雪芹', value: 0 },
							{ text: '吴承恩', value: 1 },
							{ text: '施耐庵', value: 0 },
							{ text: '罗贯中', value: 0 }
						]
					},
					{
						text: '地球围绕太阳转一圈需要多长时间？',
						options: [
							{ text: '一天', value: 0 },
							{ text: '一个月', value: 0 },
							{ text: '一年', value: 1 },
							{ text: '一百年', value: 0 }
						]
					}
				]
			},
			calculateKnowledgeResult() {
				const questions = this.getKnowledgeQuestions()
				let correctCount = 0
				this.answers.forEach((answerIndex, qIndex) => {
					if (questions[qIndex].options[answerIndex].value === 1) {
						correctCount++
					}
				})
				const score = Math.round((correctCount / questions.length) * 100)
				let level = '初级'
				if (score >= 80) level = '优秀'
				else if (score >= 60) level = '良好'
				else if (score >= 40) level = '中等'

				this.resultIcon = '📚'
				this.resultTitle = `知识等级：${level}`
				this.resultDescription = `你答对了 ${correctCount} 道题，得分 ${score} 分！`
				this.resultDetails = score >= 80 
					? '太棒了！你的知识储备很扎实，继续保持学习的热情，探索更多知识领域吧！'
					: score >= 60
						? '不错的成绩！还有提升空间，多读书多学习，知识会让你更强大！'
						: '加油！知识需要积累，每天学习一点点，进步会很大的！'
				this.resultScore = score

				const result = { score, level, correctCount, totalCount: questions.length, updatedAt: Date.now() }
				this.knowledgeResult = result
				this.saveResults('knowledge', result)
			},
			getPersonalityQuestions() {
				return [
					{
						text: '周末你更喜欢做什么？',
						options: [
							{ text: '和朋友出去玩', value: 'E' },
							{ text: '在家看书或玩游戏', value: 'I' },
							{ text: '画画或做手工', value: 'A' },
							{ text: '帮家人做家务', value: 'S' }
						]
					},
					{
						text: '遇到难题时，你通常会？',
						options: [
							{ text: '马上找人帮忙', value: 'E' },
							{ text: '自己先思考解决', value: 'I' },
							{ text: '尝试不同方法', value: 'A' },
							{ text: '按步骤慢慢解决', value: 'S' }
						]
					},
					{
						text: '你觉得自己更偏向于？',
						options: [
							{ text: '外向开朗', value: 'E' },
							{ text: '安静内向', value: 'I' },
							{ text: '富有创意', value: 'A' },
							{ text: '踏实稳重', value: 'S' }
						]
					},
					{
						text: '你最喜欢的活动是？',
						options: [
							{ text: '参加聚会', value: 'E' },
							{ text: '独自思考', value: 'I' },
							{ text: '创作艺术', value: 'A' },
							{ text: '运动健身', value: 'S' }
						]
					},
					{
						text: '别人通常怎么评价你？',
						options: [
							{ text: '热情友好', value: 'E' },
							{ text: '聪明冷静', value: 'I' },
							{ text: '富有想象力', value: 'A' },
							{ text: '可靠踏实', value: 'S' }
						]
					}
				]
			},
			calculatePersonalityResult() {
				const questions = this.getPersonalityQuestions()
				const counts = { E: 0, I: 0, A: 0, S: 0 }
				this.answers.forEach((answerIndex, qIndex) => {
					const value = questions[qIndex].options[answerIndex].value
					counts[value]++
				})

				const maxCount = Math.max(...Object.values(counts))
				const types = Object.keys(counts).filter(k => counts[k] === maxCount)
				const type = types[0]

				let typeName = ''
				let description = ''
				let details = ''

				switch (type) {
					case 'E':
						typeName = '外向型'
						description = '你是一个外向开朗的人！'
						details = '你喜欢与人交往，充满活力，善于表达自己。团队合作和社交活动能让你感到快乐和充实。'
						break
					case 'I':
						typeName = '内向型'
						description = '你是一个内向思考的人！'
						details = '你喜欢独处，善于思考，内心世界丰富。深度思考和专注工作能让你发挥最大潜力。'
						break
					case 'A':
						typeName = '艺术型'
						description = '你是一个富有创意的人！'
						details = '你充满想象力和创造力，热爱艺术和美的事物。创作和表达是你最喜欢的事情。'
						break
					case 'S':
						typeName = '稳定型'
						description = '你是一个踏实可靠的人！'
						details = '你稳重可靠，注重实际，做事有条理。责任感强，是值得信赖的伙伴。'
						break
				}

				this.resultIcon = '🌟'
				this.resultTitle = `性格类型：${typeName}`
				this.resultDescription = description
				this.resultDetails = details
				this.resultScore = Math.round((maxCount / questions.length) * 100)

				const result = { type: typeName, code: type, counts, updatedAt: Date.now() }
				this.personalityResult = result
				this.saveResults('personality', result)
			},
			getCareerQuestions() {
				return [
					{
						text: '你对什么最感兴趣？',
						options: [
							{ text: '探索未知，发现新知识', value: 'research' },
							{ text: '创造新事物', value: 'creative' },
							{ text: '帮助别人', value: 'helpful' },
							{ text: '领导团队', value: 'leadership' }
						]
					},
					{
						text: '你最喜欢的学科是？',
						options: [
							{ text: '数学和科学', value: 'research' },
							{ text: '美术和音乐', value: 'creative' },
							{ text: '语文和历史', value: 'helpful' },
							{ text: '体育和团队活动', value: 'leadership' }
						]
					},
					{
						text: '你希望未来的工作能？',
						options: [
							{ text: '探索科学奥秘', value: 'research' },
							{ text: '发挥艺术才能', value: 'creative' },
							{ text: '帮助他人成长', value: 'helpful' },
							{ text: '影响和改变世界', value: 'leadership' }
						]
					},
					{
						text: '你觉得自己最擅长？',
						options: [
							{ text: '分析和推理', value: 'research' },
							{ text: '设计和创作', value: 'creative' },
							{ text: '沟通和理解', value: 'helpful' },
							{ text: '组织和管理', value: 'leadership' }
						]
					},
					{
						text: '你梦想的工作环境是？',
						options: [
							{ text: '实验室或研究室', value: 'research' },
							{ text: '工作室或艺术空间', value: 'creative' },
							{ text: '学校或社区', value: 'helpful' },
							{ text: '办公室或会议室', value: 'leadership' }
						]
					}
				]
			},
			calculateCareerResult() {
				const questions = this.getCareerQuestions()
				const counts = { research: 0, creative: 0, helpful: 0, leadership: 0 }
				this.answers.forEach((answerIndex, qIndex) => {
					const value = questions[qIndex].options[answerIndex].value
					counts[value]++
				})

				const maxCount = Math.max(...Object.values(counts))
				const types = Object.keys(counts).filter(k => counts[k] === maxCount)
				const type = types[0]

				let suggestion = ''
				let description = ''
				let details = ''

				switch (type) {
					case 'research':
						suggestion = '科研探索'
						description = '你适合从事科研探索类工作！'
						details = '科学家、工程师、研究员、医生等职业非常适合你。你喜欢探索未知，享受发现新知识的过程。'
						break
					case 'creative':
						suggestion = '艺术创意'
						description = '你适合从事艺术创意类工作！'
						details = '设计师、艺术家、作家、音乐家等职业非常适合你。你充满创造力，善于表达自己的想法。'
						break
					case 'helpful':
						suggestion = '教育服务'
						description = '你适合从事教育服务类工作！'
						details = '教师、医生、心理咨询师、社会工作者等职业非常适合你。你乐于助人，希望帮助他人成长。'
						break
					case 'leadership':
						suggestion = '管理领导'
						description = '你适合从事管理领导类工作！'
						details = '企业家、管理者、政治家、团队负责人等职业非常适合你。你有领导才能，善于组织和影响他人。'
						break
				}

				this.resultIcon = '🚀'
				this.resultTitle = `职业倾向：${suggestion}`
				this.resultDescription = description
				this.resultDetails = details
				this.resultScore = Math.round((maxCount / questions.length) * 100)

				const result = { suggestion, code: type, counts, updatedAt: Date.now() }
				this.careerResult = result
				this.saveResults('career', result)
			},
			closeTestModal() {
				this.showTestModal = false
			},
			closeResultModal() {
				this.showResultModal = false
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
		padding-bottom: 100rpx;
	}

	.header {
		position: relative;
		padding: 80rpx 40rpx 60rpx;
		text-align: center;
	}

	.header-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.1);
	}

	.header-content {
		position: relative;
		z-index: 1;
	}

	.header-title {
		font-size: 48rpx;
		font-weight: bold;
		color: #fff;
		display: block;
		margin-bottom: 16rpx;
	}

	.header-desc {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.test-cards {
		padding: 0 30rpx;
		margin-top: -30rpx;
	}

	.test-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 32rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
		transition: transform 0.2s;

		&:active {
			transform: scale(0.98);
		}

		&.knowledge {
			border-left: 8rpx solid #667eea;
		}

		&.personality {
			border-left: 8rpx solid #f093fb;
		}

		&.career {
			border-left: 8rpx solid #4facfe;
		}
	}

	.card-icon {
		font-size: 56rpx;
		margin-right: 24rpx;
	}

	.card-content {
		flex: 1;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}

	.card-desc {
		font-size: 24rpx;
		color: #999;
	}

	.card-arrow {
		font-size: 40rpx;
		color: #ccc;
		margin-left: 16rpx;
	}

	.card-progress {
		background: #f0f0f0;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		margin-left: 16rpx;
	}

	.progress-text {
		font-size: 22rpx;
		color: #667eea;
	}

	.results-section {
		margin-top: 40rpx;
		padding: 0 30rpx;
	}

	.section-header {
		margin-bottom: 24rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
	}

	.results-summary {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 24rpx;
		padding: 32rpx;
	}

	.summary-item {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.summary-label {
		font-size: 26rpx;
		color: #666;
		width: 140rpx;
	}

	.summary-bar {
		flex: 1;
		height: 20rpx;
		background: #f0f0f0;
		border-radius: 10rpx;
		margin: 0 20rpx;
		overflow: hidden;
	}

	.summary-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea, #764ba2);
		border-radius: 10rpx;
		transition: width 0.5s;
	}

	.summary-value {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		width: 80rpx;
		text-align: right;

		&.highlight {
			color: #667eea;
		}
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.test-modal {
		width: 90%;
		max-width: 640rpx;
		background: #fff;
		border-radius: 32rpx;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 32rpx;
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
		padding: 8rpx;
	}

	.modal-body {
		padding: 32rpx;
	}

	.question-progress {
		margin-bottom: 32rpx;
	}

	.progress-num {
		font-size: 24rpx;
		color: #999;
		display: block;
		text-align: center;
		margin-bottom: 12rpx;
	}

	.progress-bar {
		height: 12rpx;
		background: #f0f0f0;
		border-radius: 6rpx;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea, #764ba2);
		border-radius: 6rpx;
		transition: width 0.3s;
	}

	.question-content {
		margin-bottom: 32rpx;
	}

	.question-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		line-height: 1.6;
	}

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.option-item {
		display: flex;
		align-items: center;
		padding: 24rpx;
		background: #f8f8f8;
		border-radius: 16rpx;
		border: 2rpx solid transparent;
		transition: all 0.2s;

		&.selected {
			background: #f0f4ff;
			border-color: #667eea;
		}

		&:active {
			transform: scale(0.98);
		}
	}

	.option-indicator {
		width: 48rpx;
		height: 48rpx;
		background: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24rpx;
		font-weight: bold;
		color: #999;
		margin-right: 20rpx;
		border: 2rpx solid #ddd;

		.option-item.selected & {
			background: #667eea;
			color: #fff;
			border-color: #667eea;
		}
	}

	.option-text {
		font-size: 28rpx;
		color: #333;
		flex: 1;
	}

	.modal-footer {
		padding: 24rpx 32rpx 32rpx;
	}

	.modal-btn {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(90deg, #667eea, #764ba2);
		border-radius: 44rpx;
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
		border: none;

		&:disabled {
			background: #ccc;
		}
	}

	.result-modal {
		width: 85%;
		max-width: 600rpx;
		background: #fff;
		border-radius: 32rpx;
		overflow: hidden;
		text-align: center;
	}

	.result-header {
		padding: 40rpx;
		background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
	}

	.result-icon {
		font-size: 80rpx;
		display: block;
		margin-bottom: 16rpx;
	}

	.result-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}

	.result-body {
		padding: 40rpx;
	}

	.result-desc {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 24rpx;
	}

	.result-details {
		background: #f8f9fa;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 32rpx;
		text-align: left;
	}

	.details-title {
		font-size: 26rpx;
		font-weight: bold;
		color: #666;
		display: block;
		margin-bottom: 12rpx;
	}

	.details-content {
		font-size: 26rpx;
		color: #666;
		line-height: 1.6;
	}

	.result-score {
		display: flex;
		align-items: baseline;
		justify-content: center;
	}

	.score-label {
		font-size: 26rpx;
		color: #999;
		margin-right: 16rpx;
	}

	.score-value {
		font-size: 72rpx;
		font-weight: bold;
		color: #667eea;
	}

	.score-unit {
		font-size: 28rpx;
		color: #999;
		margin-left: 8rpx;
	}

	.result-footer {
		padding: 0 40rpx 40rpx;
	}

	.result-btn {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(90deg, #667eea, #764ba2);
		border-radius: 44rpx;
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
		border: none;
	}
</style>