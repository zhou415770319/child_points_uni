import type { DeviceInfo, NetworkInfo, BatteryInfo } from '../types/device'

/**
 * 获取设备信息 - Web实现
 */
export function getDeviceInfo(): DeviceInfo {
	const navigator = window.navigator
	const screen = window.screen
	
	// 判断操作系统类型
	let osType: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown' = 'unknown'
	const userAgent = navigator.userAgent.toLowerCase()
	
	if (userAgent.includes('windows')) {
		osType = 'windows'
	} else if (userAgent.includes('mac os')) {
		osType = 'macos'
	} else if (userAgent.includes('linux')) {
		osType = 'linux'
	} else if (userAgent.includes('android')) {
		osType = 'android'
	} else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
		osType = 'ios'
	}
	
	// 获取浏览器版本
	const appVersion = navigator.appVersion
	
	return {
		model: navigator.platform,
		brand: navigator.vendor || 'unknown',
		osVersion: appVersion,
		osType,
		uuid: '', // Web端无法获取唯一标识
		appVersion: '1.0.0', // Web应用版本需手动配置
		appVersionCode: '1',
		deviceName: navigator.platform,
		screenWidth: screen.width,
		screenHeight: screen.height,
		pixelRatio: window.devicePixelRatio || 1
	}
}

/**
 * 获取网络信息 - Web实现
 */
export function getNetworkInfo(): NetworkInfo {
	const navigator = window.navigator
	const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
	
	let type: 'wifi' | '4g' | '3g' | '2g' | 'none' | 'unknown' = 'unknown'
	
	if (!navigator.onLine) {
		return {
			type: 'none',
			isConnected: false
		}
	}
	
	if (connection) {
		const effectiveType = connection.effectiveType
		switch (effectiveType) {
			case '4g':
				type = '4g'
				break
			case '3g':
				type = '3g'
				break
			case '2g':
				type = '2g'
				break
			case 'slow-2g':
				type = '2g'
				break
			case 'wifi':
				type = 'wifi'
				break
			default:
				type = 'unknown'
		}
	} else if (navigator.userAgent.includes('wifi')) {
		type = 'wifi'
	}
	
	return {
		type,
		isConnected: navigator.onLine
	}
}

/**
 * 获取电池信息 - Web实现
 */
export function getBatteryInfo(): BatteryInfo {
	const navigator = window.navigator
	const batteryPromise = (navigator as any).getBattery?.()
	
	if (batteryPromise) {
		batteryPromise.then((battery: any) => {
			return {
				level: Math.round(battery.level * 100),
				isCharging: battery.charging
			}
		}).catch(() => {
			return {
				level: -1,
				isCharging: false
			}
		})
	}
	
	return {
		level: -1,
		isCharging: false
	}
}