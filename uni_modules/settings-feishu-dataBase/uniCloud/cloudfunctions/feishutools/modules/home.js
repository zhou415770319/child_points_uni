'use strict';

const { getAccessToken } = require('../utils/token')
const { buildFilter } = require('../utils/common')
const { getImageUrls } = require('./media')

/**
 * 批量获取首页数据（减少云函数调用次数）
 * @param {Object} params
 * @param {string} params.baseToken - 多维表格Token
 * @param {string} params.childId - 儿童ID
 * @param {Object} params.tables - 表名到表ID的映射
 */
async function getHomeData(params) {
	console.log('[FeishuTools] 获取首页数据:', JSON.stringify(params))
	
	const { baseToken, childId, tables } = params
	
	if (!baseToken || !childId || !tables) {
		throw new Error('baseToken、childId和tables不能为空')
	}
	
	const tokenResult = await getAccessToken()
	const results = {
		tasks: [],
		otherTasks: [],
		rewards: [],
		textbooks: []
	}
	
	// 并行获取所有数据
	const promises = []
	
	// 计算今日的开始时间戳和结束时间戳
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const todayStart = today.getTime()
	const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1 // 当天23:59:59
	
	// 1. 获取今日任务（start_time 为空或在今日范围内）
	if (tables['任务表']) {
		promises.push((async () => {
			try {
				const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tables['任务表']}/records/search`
				
				// 简化筛选条件：只按 child_id 筛选，然后在代码中过滤
				const filter = {
					"conjunction": "and",
					"conditions": [
						{
							"field_name": "child_id",
							"operator": "is",
							"value": [childId]
						}
					]
				}
				
				console.log('[FeishuTools] 获取任务请求参数:', {
					childId,
					todayStart,
					todayEnd,
					todayDate: new Date(todayStart).toISOString(),
					filter: JSON.stringify(filter)
				})
				
				const response = await uniCloud.httpclient.request(url, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + tokenResult.accessToken,
						'Content-Type': 'application/json'
					},
					data: {
						filter: filter
					},
					dataType: 'json'
				})
				
				console.log('[FeishuTools] 获取任务响应:', {
					status: response.status,
					code: response.data.code,
					message: response.data.msg || response.data.message,
					total: response.data.data?.total || 0,
					itemsCount: response.data.data?.items?.length || 0
				})
				
				if (response.data.code === 0) {
					const allTasks = response.data.data.items || []
					
					// 在代码中筛选今日任务和其他任务
					results.tasks = []
					results.otherTasks = []
					
					allTasks.forEach(item => {
						const startTime = item.fields.start_time
						
						// 判断是否为空值
						const isEmpty = startTime === null || startTime === undefined || startTime === ''
						
						if (isEmpty) {
							// start_time 为空的任务，归为"其他任务"
							results.otherTasks.push(item)
						} else {
							// start_time 有值的任务，判断是否在今日范围内
							const startTimeNum = Number(startTime)
							if (startTimeNum >= todayStart && startTimeNum <= todayEnd) {
								results.tasks.push(item)
							}
						}
					})
					
					console.log('[FeishuTools] 任务数据解析成功，今日任务:', results.tasks.length, '条，其他任务:', results.otherTasks.length, '条')
				} else {
					console.error('[FeishuTools] 获取任务失败，错误码:', response.data.code, '错误信息:', response.data.msg || response.data.message)
				}
			} catch (error) {
				console.error('[FeishuTools] 获取任务数据失败:', error.message, error.stack)
				results.tasks = []
				results.otherTasks = []
			}
		})())
	}
	
	// 2. 获取兑换记录（最近10条）
	if (tables['兑换记录表']) {
		promises.push((async () => {
			try {
				const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tables['兑换记录表']}/records/search`
				const response = await uniCloud.httpclient.request(url, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + tokenResult.accessToken,
						'Content-Type': 'application/json'
					},
					data: {
						filter: buildFilter({ child_id: childId }),
						page_size: 10
					},
					dataType: 'json'
				})
				if (response.data.code === 0) {
					let rewards = response.data.data.items || []
					
					// 提取所有图片的 file_token
					const fileTokens = []
					rewards.forEach(reward => {
						if (reward.fields.gift_image && reward.fields.gift_image.type === 17 && 
							reward.fields.gift_image.value && reward.fields.gift_image.value.length > 0) {
							reward.fields.gift_image.value.forEach(img => {
								if (img.file_token) {
									fileTokens.push(img.file_token)
								}
							})
						}
					})
					
					// 如果有图片需要获取URL，批量请求
					if (fileTokens.length > 0) {
						try {
							const urlResult = await getImageUrls({ fileTokens: fileTokens })
							if (urlResult.success && urlResult.urlMap) {
								// 将获取到的URL回填到奖励数据中
								rewards = rewards.map(reward => {
									if (reward.fields.gift_image && reward.fields.gift_image.type === 17 && 
										reward.fields.gift_image.value && reward.fields.gift_image.value.length > 0) {
										reward.fields.gift_image.value = reward.fields.gift_image.value.map(img => {
											if (img.file_token && urlResult.urlMap[img.file_token]) {
												return {
													...img,
													tmp_download_url: urlResult.urlMap[img.file_token]
												}
											}
											return img
										})
									}
									return reward
								})
								console.log('[FeishuTools] 奖励图片URL批量获取成功，共', Object.keys(urlResult.urlMap).length, '张')
							}
						} catch (imgError) {
							console.error('[FeishuTools] 获取奖励图片URL失败:', imgError.message)
						}
					}
					
					results.rewards = rewards
				}
			} catch (error) {
				console.error('[FeishuTools] 获取兑换记录失败:', error.message)
				results.rewards = []
			}
		})())
	}
	
	// 3. 获取教材数据
	if (tables['教材表']) {
		promises.push((async () => {
			try {
				const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${baseToken}/tables/${tables['教材表']}/records/search`
				const response = await uniCloud.httpclient.request(url, {
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + tokenResult.accessToken,
						'Content-Type': 'application/json'
					},
					data: {
						filter: buildFilter({ child_id: childId, status: "开启" })
					},
					dataType: 'json'
				})
				if (response.data.code === 0) {
					results.textbooks = response.data.data.items || []
				}
			} catch (error) {
				console.error('[FeishuTools] 获取教材数据失败:', error.message)
				results.textbooks = []
			}
		})())
	}
	
	// 等待所有请求完成
	await Promise.all(promises)
	
	console.log('[FeishuTools] 获取首页数据完成:', JSON.stringify(results))
	
	return {
		success: true,
		data: results
	}
}

/**
 * 滚动字幕内容数据
 */
const scrollContentData = {
	idiom: [
		{ title: '成语故事', content: '一鸣惊人：比喻平时没有突出的表现，一下子做出惊人的成绩。出自《史记·滑稽列传》。' },
		{ title: '成语故事', content: '画蛇添足：比喻做了多余的事，非但无益，反而不合适。出自《战国策·齐策二》。' },
		{ title: '成语故事', content: '亡羊补牢：比喻出了问题以后想办法补救，可以防止继续受损失。出自《战国策·楚策》。' },
		{ title: '成语故事', content: '刻舟求剑：比喻拘泥成例，不知道跟着情势的变化而改变看法或办法。出自《吕氏春秋·察今》。' },
		{ title: '成语故事', content: '拔苗助长：比喻违反事物发展的客观规律，急于求成，反而坏事。出自《孟子·公孙丑上》。' },
		{ title: '成语故事', content: '守株待兔：比喻不主动努力，而存万一的侥幸心理，希望得到意外的收获。出自《韩非子·五蠹》。' },
		{ title: '成语故事', content: '狐假虎威：比喻依仗别人的势力欺压人。出自《战国策·楚策一》。' }
	],
	english: [
		{ title: '英语短句', content: 'Practice makes perfect. 熟能生巧。' },
		{ title: '英语短句', content: 'Actions speak louder than words. 行动胜于言语。' },
		{ title: '英语短句', content: 'Knowledge is power. 知识就是力量。' },
		{ title: '英语短句', content: 'A journey of a thousand miles begins with a single step. 千里之行，始于足下。' },
		{ title: '英语短句', content: 'Time flies. 时光飞逝。' },
		{ title: '英语短句', content: 'Where there is a will, there is a way. 有志者，事竟成。' },
		{ title: '英语短句', content: 'Reading makes a full man. 读书使人充实。' }
	],
	technology: [
		{ title: '科技知识', content: '中国的"天眼"FAST是世界上最大的单口径射电望远镜，口径达500米。' },
		{ title: '科技知识', content: '人工智能（AI）是研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。' },
		{ title: '科技知识', content: '5G技术可以提供比4G快100倍的数据传输速度，延迟低至1毫秒。' },
		{ title: '科技知识', content: '太阳能是一种可再生能源，通过光伏板将阳光转化为电能。' },
		{ title: '科技知识', content: '北斗卫星导航系统是中国自主研发的全球卫星导航系统，已服务全球200多个国家和地区。' },
		{ title: '科技知识', content: '量子计算机利用量子力学现象来进行计算，比传统计算机处理某些问题快得多。' },
		{ title: '科技知识', content: '电动汽车使用电池作为动力源，相比燃油汽车更加环保。' }
	],
	literature: [
		{ title: '文学常识', content: '《红楼梦》是中国古典四大名著之一，作者是曹雪芹，描写了一个封建贵族家庭由盛而衰的过程。' },
		{ title: '文学常识', content: '李白是唐代著名诗人，被称为"诗仙"，代表作有《静夜思》《望庐山瀑布》等。' },
		{ title: '文学常识', content: '鲁迅是中国现代文学的奠基人，代表作有《呐喊》《彷徨》等。' },
		{ title: '文学常识', content: '《西游记》是明代吴承恩创作的神话小说，讲述了唐僧师徒西天取经的故事。' },
		{ title: '文学常识', content: '唐诗宋词是中国古代文学的瑰宝，涌现出了杜甫、苏轼等伟大的文学家。' },
		{ title: '文学常识', content: '四大名著包括《红楼梦》《三国演义》《水浒传》《西游记》。' },
		{ title: '文学常识', content: '朱自清是现代著名散文家，代表作《背影》《荷塘月色》等。' }
	],
	riddle: [
		{ title: '脑筋急转弯', content: '什么东西越洗越脏？答案：水' },
		{ title: '脑筋急转弯', content: '什么车没有轮？答案：风车' },
		{ title: '脑筋急转弯', content: '什么东西打破了才能用？答案：鸡蛋' },
		{ title: '脑筋急转弯', content: '什么东西天天都在走，但从来不会移动？答案：钟表' },
		{ title: '脑筋急转弯', content: '什么东西有四条腿却不会走路？答案：桌子' },
		{ title: '脑筋急转弯', content: '什么东西越擦越黑？答案：黑板' },
		{ title: '脑筋急转弯', content: '什么东西买的人知道，卖的人也知道，只有用的人不知道？答案：棺材' }
	]
}

/**
 * 获取滚动字幕内容
 * @param {Object} params
 * @param {string} params.type - 内容类型（兼容旧版本）
 * @param {string[]} params.types - 多选类型数组：idiom(成语故事), english(英语短句), technology(科技知识), literature(文学常识), riddle(脑筋急转弯), custom(自定义)
 * @param {string} params.customContent - 自定义内容（type为custom时使用）
 */
async function getScrollContent(params) {
	console.log('[FeishuTools] 获取滚动字幕内容:', JSON.stringify(params))
	
	const { types = [], type = 'idiom', customContent = '' } = params
	
	// 如果包含自定义类型且有自定义内容，直接返回自定义内容
	if (types.includes('custom') && customContent.trim()) {
		return {
			success: true,
			data: {
				title: '自定义内容',
				content: customContent.trim()
			}
		}
	}
	
	// 从多选类型中随机选择一个（排除custom，因为上面已经处理）
	let selectedType = type
	if (types.length > 0) {
		const validTypes = types.filter(t => t !== 'custom' && scrollContentData[t])
		if (validTypes.length > 0) {
			// 根据日期选择类型（确保每天展示同一类型）
			const today = new Date()
			const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
			selectedType = validTypes[dayOfYear % validTypes.length]
		}
	}
	
	// 根据类型获取内容
	const contentList = scrollContentData[selectedType] || scrollContentData.idiom
	
	// 根据日期选择内容（每天展示不同内容）
	const today = new Date()
	const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
	const index = dayOfYear % contentList.length
	
	return {
		success: true,
		data: contentList[index]
	}
}

module.exports = {
	getHomeData,
	getScrollContent
}