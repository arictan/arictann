// Shared between the app and the widget extension (add this file to BOTH targets).
import Foundation
#if canImport(ActivityKit)
import ActivityKit
#endif

enum SushiShared {
    /// App Group that both the app and the widget can read. Create it in Signing & Capabilities.
    static let appGroup = "group.com.arictan.sushistack"
    static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }
}

struct SushiSnapshot: Codable {
    var restaurant: String = "Street Stall"
    var stars: Int = 1
    var tips: Int = 0
    var tipsMax: Int = 80
    var jarFullAt: Double = 0 // ms since 1970
    var calendarDay: Int = 1
    var calendarReady: Bool = false
    var level: Int = 1
    var chef: String = "Rookie"

    static func load() -> SushiSnapshot {
        guard let data = SushiShared.defaults?.data(forKey: "snapshot"),
              let s = try? JSONDecoder().decode(SushiSnapshot.self, from: data) else { return SushiSnapshot() }
        return s
    }

    func save() {
        if let data = try? JSONEncoder().encode(self) { SushiShared.defaults?.set(data, forKey: "snapshot") }
    }
}

#if canImport(ActivityKit)
@available(iOS 16.1, *)
struct SushiActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var endsAt: Date
        var detail: String
    }
    var title: String
}
#endif
