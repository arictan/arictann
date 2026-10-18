// Capacitor plugin "SushiWidget" (app target only). Stores the snapshot in the App Group,
// refreshes the widget, and starts / ends the Live Activity.
import Foundation
import Capacitor
import WidgetKit
#if canImport(ActivityKit)
import ActivityKit
#endif

@objc(SushiWidgetPlugin)
public class SushiWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SushiWidgetPlugin"
    public let jsName = "SushiWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endActivity", returnType: CAPPluginReturnPromise),
    ]

    @objc func update(_ call: CAPPluginCall) {
        var s = SushiSnapshot()
        s.restaurant = call.getString("restaurant") ?? s.restaurant
        s.stars = call.getInt("stars") ?? s.stars
        s.tips = call.getInt("tips") ?? s.tips
        s.tipsMax = call.getInt("tipsMax") ?? s.tipsMax
        s.jarFullAt = call.getDouble("jarFullAt") ?? s.jarFullAt
        s.calendarDay = call.getInt("calendarDay") ?? s.calendarDay
        s.calendarReady = call.getBool("calendarReady") ?? s.calendarReady
        s.level = call.getInt("level") ?? s.level
        s.chef = call.getString("chef") ?? s.chef
        s.save()
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }

    @objc func startActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            guard ActivityAuthorizationInfo().areActivitiesEnabled else { call.resolve(); return }
            let endsAt = Date(timeIntervalSince1970: (call.getDouble("endsAt") ?? 0) / 1000)
            let state = SushiActivityAttributes.ContentState(endsAt: endsAt, detail: call.getString("detail") ?? "")
            Task {
                for a in Activity<SushiActivityAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
                _ = try? Activity.request(attributes: SushiActivityAttributes(title: call.getString("title") ?? "Sushi Stack"),
                                          content: .init(state: state, staleDate: endsAt))
                call.resolve()
            }
            return
        }
        #endif
        call.resolve()
    }

    @objc func endActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            Task {
                for a in Activity<SushiActivityAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
                call.resolve()
            }
            return
        }
        #endif
        call.resolve()
    }
}
