export interface DeviceInfo {
	/**
	 * 设备型号
	 */
	model: string
	/**
	 * 设备品牌
	 */
	brand: string
	/**
	 * 操作系统版本
	 */
	osVersion: string
	/**
	 * 操作系统类型
	 */
	osType: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown'
	/**
	 * 设备唯一标识
	 */
	uuid: string
	/**
	 * 应用版本号
	 */
	appVersion: string
	/**
	 * 应用版本代码
	 */
	appVersionCode: string
	/**
	 * 设备名称
	 */
	deviceName: string
	/**
	 * 屏幕宽度（px）
	 */
	screenWidth: number
	/**
	 * 屏幕高度（px）
	 */
	screenHeight: number
	/**
	 * 屏幕密度
	 */
	pixelRatio: number
}

export interface NetworkInfo {
	/**
	 * 网络类型
	 */
	type: 'wifi' | '4g' | '3g' | '2g' | 'none' | 'unknown'
	/**
	 * 是否连接网络
	 */
	isConnected: boolean
}

export interface BatteryInfo {
	/**
	 * 电池电量（0-100）
	 */
	level: number
	/**
	 * 是否正在充电
	 */
	isCharging: boolean
}