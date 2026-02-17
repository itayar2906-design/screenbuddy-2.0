import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {
  
  private let store = ManagedSettingsStore()
  private var activeTimers: [String: Timer] = [:]
  
  // MARK: - Request Authorization
  
  @objc
  func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        resolve(true)
      } catch {
        reject("PERMISSION_DENIED", "Failed to get Screen Time permissions", error)
      }
    }
  }
  
  // MARK: - Block App
  
  @objc
  func blockApp(_ bundleId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let token = ApplicationToken(bundleIdentifier: bundleId) else {
      reject("INVALID_BUNDLE_ID", "Invalid bundle identifier", nil)
      return
    }
    
    DispatchQueue.main.async {
      self.store.shield.applications = [token]
      resolve(true)
    }
  }
  
  // MARK: - Unblock App for Minutes
  
  @objc
  func unblockAppForMinutes(_ bundleId: String, minutes: NSNumber, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let token = ApplicationToken(bundleIdentifier: bundleId) else {
      reject("INVALID_BUNDLE_ID", "Invalid bundle identifier", nil)
      return
    }
    
    let minutesInt = minutes.intValue
    
    DispatchQueue.main.async {
      // Remove shield to unblock
      self.store.shield.applications?.remove(token)
      
      // Cancel existing timer if any
      self.activeTimers[bundleId]?.invalidate()
      
      // Send 2-minute warning
      let warningTime = TimeInterval((minutesInt - 2) * 60)
      if minutesInt > 2 {
        DispatchQueue.main.asyncAfter(deadline: .now() + warningTime) {
          self.sendEvent(withName: "onTwoMinuteWarning", body: ["bundleId": bundleId, "remainingMinutes": 2])
        }
      }
      
      // Set timer to re-block after minutes
      let timer = Timer.scheduledTimer(withTimeInterval: TimeInterval(minutesInt * 60), repeats: false) { _ in
        self.store.shield.applications = [token]
        self.sendEvent(withName: "onTimerExpired", body: ["bundleId": bundleId])
        self.activeTimers.removeValue(forKey: bundleId)
      }
      
      self.activeTimers[bundleId] = timer
      
      resolve([
        "bundleId": bundleId,
        "minutes": minutesInt,
        "expiresAt": Date().addingTimeInterval(TimeInterval(minutesInt * 60)).timeIntervalSince1970
      ])
    }
  }
  
  // MARK: - Get Blocked Apps
  
  @objc
  func getBlockedApps(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let blockedApps = self.store.shield.applications?.map { token in
        return token.bundleIdentifier ?? "unknown"
      } ?? []
      
      resolve(blockedApps)
    }
  }
  
  // MARK: - Get Remaining Minutes
  
  @objc
  func getRemainingMinutes(_ bundleId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let timer = activeTimers[bundleId], timer.isValid else {
      resolve(0)
      return
    }
    
    let remainingSeconds = timer.fireDate.timeIntervalSinceNow
    let remainingMinutes = Int(ceil(remainingSeconds / 60))
    
    resolve(max(0, remainingMinutes))
  }
  
  // MARK: - React Native Bridge
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func supportedEvents() -> [String] {
    return ["onTimerExpired", "onTwoMinuteWarning"]
  }
  
  private func sendEvent(withName name: String, body: Any) {
    // This will be handled by RCTEventEmitter in the bridge
    NotificationCenter.default.post(name: NSNotification.Name(name), object: body)
  }
}

// MARK: - React Native Bridge Module

@objc(ScreenTimeModuleBridge)
class ScreenTimeModuleBridge: RCTEventEmitter {
  
  private let module = ScreenTimeModule()
  
  override func supportedEvents() -> [String]! {
    return ["onTimerExpired", "onTwoMinuteWarning"]
  }
  
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    module.requestPermissions(resolve, rejecter: reject)
  }
  
  @objc
  func blockApp(_ bundleId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    module.blockApp(bundleId, resolver: resolve, rejecter: reject)
  }
  
  @objc
  func unblockAppForMinutes(_ bundleId: String, minutes: NSNumber, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    module.unblockAppForMinutes(bundleId, minutes: minutes, resolver: resolve, rejecter: reject)
  }
  
  @objc
  func getBlockedApps(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    module.getBlockedApps(resolve, rejecter: reject)
  }
  
  @objc
  func getRemainingMinutes(_ bundleId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    module.getRemainingMinutes(bundleId, resolver: resolve, rejecter: reject)
  }
  
  override init() {
    super.init()
    
    // Listen for events from the module
    NotificationCenter.default.addObserver(self, selector: #selector(handleTimerExpired(_:)), name: NSNotification.Name("onTimerExpired"), object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(handleTwoMinuteWarning(_:)), name: NSNotification.Name("onTwoMinuteWarning"), object: nil)
  }
  
  @objc
  private func handleTimerExpired(_ notification: Notification) {
    if let body = notification.object {
      sendEvent(withName: "onTimerExpired", body: body)
    }
  }
  
  @objc
  private func handleTwoMinuteWarning(_ notification: Notification) {
    if let body = notification.object {
      sendEvent(withName: "onTwoMinuteWarning", body: body)
    }
  }
}
