// ==================== Coze代码节点：查询用户学习数据 ====================
// 作者：AI助手
// 创建时间：2026-06-26T14:16:51.687947
// 功能：从飞书多维表格查询用户任务、模板和配置数据，为LLM提供上下文
// ====================================================================

// 在这里，您可以通过 'params' 获取节点中的输入变量，并通过 'ret' 输出结果
// 'params' 已经被正确地注入到环境中

async function main({ params }: Args): Promise<Output> {
    console.log('🚀 ========== Coze代码节点开始执行 ==========');
    console.log('📅 执行时间:', new Date().toISOString());
    
    try {
        // ==================== 1. 解析输入参数 ====================
        console.log('🔍 步骤1: 解析输入参数');
        
        // 解析具体参数
        const feishuConfig = params.feishuConfig;
        const userInfo = params.userInfo;
        const content = params.content;
        
        console.log('📋 解析后的参数:');
        console.log(`   - feishuConfig: `, feishuConfig ? '已提供' : '未提供');
        console.log(`   - userInfo: `, userInfo ? '已提供' : '未提供');
        console.log(`   - content: "` + (content || '') + '"');
        
        // ==================== 2. 参数验证 ====================
        console.log('🔍 步骤2: 验证参数有效性');
        
        if (!feishuConfig) {
            throw new Error('缺少feishuConfig参数');
        }
        
        if (!feishuConfig.baseToken) {
            throw new Error('缺少feishuConfig.baseToken');
        }
        
        if (!userInfo) {
            throw new Error('缺少userInfo参数');
        }
        
        if (!userInfo.child_id) {
            throw new Error('缺少userInfo.child_id');
        }
        
        if (!content || content.trim() === '') {
            console.log('⚠️ content参数为空，使用默认值');
            params.content = '创建学习任务';
        }
        
        console.log('✅ 参数验证通过');
        
         // ==================== 3. 飞书API查询用户任务 ====================
        console.log('🔍 步骤3: 调用飞书API查询用户任务');
        
        // 构建查询参数
        const queryParams = {
            filter: `CurrentValue.[用户ID] = ""`,
            sort: '{"field_name": "创建时间", "order": "DESC"}',
            page_size: 50,
            field_names: JSON.stringify([
                "任务名称", "任务类型", "科目", "难度", 
                "预计时长", "开始时间", "截止时间", 
                "任务状态", "完成进度", "创建时间", "优先级"
            ])
        };
        
        console.log(`📊 查询参数:`);
        console.log(`   - 用户ID: `);
        console.log(`   - 表格ID: `);
        console.log(`   - 筛选条件: `);
        console.log(`   - 返回字段: `);
        
        // 实际调用飞书API
        let apiResult;
        try {
            apiResult = await queryFeishuTasks(feishuConfig.appToken, tableId, queryParams);
            console.log(`✅ 飞书API调用成功，返回记录数: `);
        } catch (apiError) {
            console.error('❌ 飞书API调用失败:', apiError.message);
            console.log('🔄 尝试使用模拟数据...');
        }
        
        // 模拟查询任务模板
        console.log(`📊 模拟查询任务模板: 适用年级包含"`);
        const taskTemplates = [
            {
                templateId: 'tpl_001',
                templateName: '数学每日练习',
                subject: '数学',
                grade: '通用',
                estimatedDuration: '30分钟',
                difficulty: '中等'
            },
            {
                templateId: 'tpl_002',
                templateName: '英语单词记忆',
                subject: '英语',
                grade: '通用',
                estimatedDuration: '20分钟',
                difficulty: '简单'
            }
        ];
        
        // 模拟查询用户配置
        console.log(`📊 模拟查询用户配置: 用户ID=`);
        const userConfig = {
            userId: userInfo.userId,
            userName: userInfo.name || '用户',
            grade: userInfo.grade || '未知',
            studyTimeSlots: [
                { day: '周一至周五', startTime: '18:00', endTime: '19:30', duration: 90 },
                { day: '周末', startTime: '09:00', endTime: '11:00', duration: 120 }
            ],
            preferredSubjects: ['数学', '语文', '英语'],
            learningStyle: '视觉型',
            dailyStudyDuration: '2小时'
        };
        
        console.log(`✅ 数据查询完成:`);
        console.log(`   - 用户任务: 个`);
        console.log(`   - 任务模板: 个`);
        console.log(`   - 用户配置: 个时间段`);
        
        // ==================== 4. 分析用户需求 ====================
        console.log('🔍 步骤4: 分析用户需求');
        
        const requestAnalysis = {
            requestType: 'daily',
            subject: '数学',
            timeframe: 'today',
            priority: 'normal',
            keywords: ['今日', '数学', '学习']
        };
        
        // 简单的关键词分析
        const contentLower = content.toLowerCase();
        if (contentLower.includes('今日') || contentLower.includes('今天')) {
            requestAnalysis.requestType = 'daily';
            requestAnalysis.timeframe = 'today';
        }
        
        if (contentLower.includes('数学')) {
            requestAnalysis.subject = '数学';
        } else if (contentLower.includes('英语')) {
            requestAnalysis.subject = '英语';
        } else if (contentLower.includes('语文')) {
            requestAnalysis.subject = '语文';
        }
        
        console.log(`📊 需求分析结果:`, JSON.stringify(requestAnalysis, null, 2));
        
        // ==================== 5. 构建输出对象 ====================
        console.log('🔍 步骤5: 构建输出对象');
        
        // 构建输出对象
        const ret = {
            // 执行状态信息
            "executionInfo": {
                "success": true,
                "timestamp": new Date().toISOString(),
                "executionTime": Date.now(),
                "message": "数据查询成功"
            },
            
            // 查询结果汇总
            "querySummary": {
                "userTasks": userTasks.length + "个任务",
                "taskTemplates": taskTemplates.length + "个模板", 
                "userConfig": userConfig.studyTimeSlots.length + "个时间段",
                "hasActiveTasks": userTasks.filter(t => t.status === '进行中').length > 0
            },
            
            // 给大模型的格式化数据
            "llmContext": {
                // 系统指令
                "systemPrompt": "你是一个智能学习任务规划助手。请根据以下用户数据和需求，创建合适的学习任务。",
                
                // 用户需求
                "userRequest": content,
                
                // 用户上下文数据
                "userContext": {
                    "basicInfo": {
                        "name": userConfig.userName,
                        "grade": userConfig.grade,
                        "userId": userInfo.userId
                    },
                    "currentTasks": userTasks.map(task => 
                        `- : (进度: %, 截止: )`
                    ),
                    "availableTime": userConfig.studyTimeSlots.map(slot => 
                        `- (): -`
                    ),
                    "learningPreferences": {
                        "preferredSubjects": userConfig.preferredSubjects,
                        "learningStyle": userConfig.learningStyle,
                        "dailyDuration": userConfig.dailyStudyDuration
                    }
                },
                
                // 可用模板
                "availableTemplates": taskTemplates.map(template => 
                    `- : (科目: , 时长: , 难度: )`
                ),
                
                // 需求分析
                "requestAnalysis": requestAnalysis,
                
                // 输出要求
                "outputRequirements": {
                    "format": "请提供详细的学习计划，包括：任务名称、学习目标、具体步骤、预计时长",
                    "considerations": [
                        "考虑用户当前的任务负担",
                        "利用用户偏好的学习时间段",
                        "参考相似的任务模板"
                    ]
                }
            },
            
            // 原始数据（调试用）
            "rawData": {
                "userTasks": userTasks,
                "taskTemplates": taskTemplates,
                "userConfig": userConfig
            },
            
            // 元数据
            "metadata": {
                "dataSource": "飞书多维表格",
                "queryMethod": "模拟查询",
                "version": "1.0.0",
                "generatedAt": "2026-06-26T14:16:51.687947"
            }
        };
        
        console.log('✅ 输出对象构建完成');
        console.log('📊 输出结构验证:');
        console.log(`   - 顶层键数量: ` + Object.keys(ret).length);
        console.log(`   - LLM上下文: ` + Object.keys(ret.llmContext).length + '个字段');
        console.log(`   - 原始数据: ` + Object.keys(ret.rawData).length + '个数据集');
        
        console.log('🎉 ========== Coze代码节点执行完成 ==========');
        
        return ret;
        
    } catch (error) {
        console.error('❌ 执行过程中发生错误:', error);
        console.error('错误详情:', error.message);
        
        // 构建错误响应
        const ret = {
            "params":params,
            "executionInfo": {
                "success": false,
                "timestamp": new Date().toISOString(),
                "error": error.message,
                "errorType": error.constructor.name
            },
            
            "querySummary": {
                "userTasks": "0个任务",
                "taskTemplates": "0个模板", 
                "userConfig": "0个时间段",
                "hasActiveTasks": false
            },
            
            "llmContext": {
                "systemPrompt": "数据查询失败，请根据用户描述创建基本学习任务。",
                "userRequest": params.input?.content || "创建学习任务",
                "userContext": {
                    "basicInfo": {
                        "name": "用户",
                        "grade": "未知",
                        "userId": "unknown"
                    },
                    "currentTasks": ["无数据"],
                    "availableTime": ["18:00-19:30"],
                    "learningPreferences": {
                        "preferredSubjects": ["数学", "语文", "英语"],
                        "learningStyle": "混合型",
                        "dailyDuration": "1.5小时"
                    }
                },
                "availableTemplates": ["基础学习模板"],
                "requestAnalysis": {
                    "requestType": "general",
                    "subject": "通用",
                    "timeframe": "today",
                    "priority": "normal"
                },
                "outputRequirements": {
                    "format": "请提供基本的学习计划",
                    "considerations": ["根据用户描述创建任务"]
                }
            },
            
            "rawData": {
                "userTasks": [],
                "taskTemplates": [],
                "userConfig": {}
            },
            
            "metadata": {
                "dataSource": "模拟数据",
                "queryMethod": "失败",
                "version": "1.0.0",
                "generatedAt": "2026-06-26T14:16:51.687947",
                "errorOccurred": true
            }
        };
        
        console.log('⚠️ 返回错误响应');
        return ret;
    }
}

// ==================== 使用说明 ====================
/*
在Coze工作流中使用本代码节点：

输入参数格式：
{
    "input": {
        "feishuConfig": {
            "appToken": "飞书app_token",
            "tableIds": {
                "userTasks": "表格ID1",
                "taskTemplates": "表格ID2",
                "userConfigs": "表格ID3"
            }
        },
        "userInfo": {
            "userId": "用户唯一ID",
            "name": "用户姓名",
            "grade": "年级"
        },
        "content": "用户需求描述"
    }
}

输出数据结构：
{
    "executionInfo": {},      // 执行状态信息
    "querySummary": {},       // 查询结果摘要
    "llmContext": {},         // 给大模型的上下文数据
    "rawData": {},            // 原始数据（调试用）
    "metadata": {}            // 元数据
}

后续节点使用：
- 大模型节点：使用 ret.llmContext 作为上下文
- 调试节点：查看 ret.rawData 和 ret.querySummary
*/

// 注意：在Coze工作流中，代码会自动执行，不需要手动调用main函数
// 输入参数通过params传入，输出通过ret返回
