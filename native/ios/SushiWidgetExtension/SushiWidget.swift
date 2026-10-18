// Widget extension: a small and a medium home-screen widget, plus the Live Activity UI.
import WidgetKit
import SwiftUI
#if canImport(ActivityKit)
import ActivityKit
#endif

struct SushiEntry: TimelineEntry {
    let date: Date
    let s: SushiSnapshot
}

struct SushiProvider: TimelineProvider {
    func placeholder(in context: Context) -> SushiEntry { SushiEntry(date: .now, s: SushiSnapshot()) }
    func getSnapshot(in context: Context, completion: @escaping (SushiEntry) -> Void) { completion(SushiEntry(date: .now, s: .load())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<SushiEntry>) -> Void) {
        // Refresh every 30 minutes so the tip jar fills up on the widget too.
        let now = Date()
        let entries = (0..<8).map { SushiEntry(date: now.addingTimeInterval(Double($0) * 1800), s: .load()) }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct SushiWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: SushiEntry

    var jar: Double {
        let s = entry.s
        guard s.jarFullAt > 0 else { return Double(s.tips) / Double(max(1, s.tipsMax)) }
        let left = s.jarFullAt / 1000 - entry.date.timeIntervalSince1970
        return left <= 0 ? 1 : max(Double(s.tips) / Double(max(1, s.tipsMax)), 1 - left / (8 * 3600))
    }

    var body: some View {
        let s = entry.s
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("🏯").font(.title2)
                VStack(alignment: .leading) {
                    Text(s.restaurant).font(.headline).foregroundStyle(.white).lineLimit(1)
                    Text(String(repeating: "★", count: s.stars)).font(.caption).foregroundStyle(.yellow)
                }
            }
            ProgressView(value: jar) { Text(jar >= 1 ? "💰 Tip jar full!" : "💰 Tips filling…").font(.caption).foregroundStyle(.white) }
                .tint(.yellow)
            if family != .systemSmall {
                HStack {
                    Text(s.calendarReady ? "📅 Day \(s.calendarDay) reward ready" : "📅 Day \(s.calendarDay) tomorrow").font(.caption)
                    Spacer()
                    Text("Lv \(s.level)").font(.caption.bold())
                }.foregroundStyle(.white)
            }
        }
        .padding()
        .containerBackground(for: .widget) { LinearGradient(colors: [Color(red: 0.35, green: 0.16, blue: 0.37), Color(red: 0.1, green: 0.05, blue: 0.13)], startPoint: .top, endPoint: .bottom) }
        .widgetURL(URL(string: "sushistack://restaurant"))
    }
}

struct SushiWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SushiWidget", provider: SushiProvider()) { SushiWidgetView(entry: $0) }
            .configurationDisplayName("Sushi Stack")
            .description("Your restaurant’s tip jar and today’s calendar reward.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#if canImport(ActivityKit)
@available(iOS 16.2, *)
struct SushiLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SushiActivityAttributes.self) { ctx in
            HStack {
                Text("🍣").font(.title)
                VStack(alignment: .leading) {
                    Text(ctx.attributes.title).font(.headline)
                    Text(ctx.state.detail).font(.caption)
                }
                Spacer()
                Text(ctx.state.endsAt, style: .timer).font(.title3.monospacedDigit())
            }.padding()
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Text("🍣") }
                DynamicIslandExpandedRegion(.trailing) { Text(ctx.state.endsAt, style: .timer).monospacedDigit() }
                DynamicIslandExpandedRegion(.bottom) { Text(ctx.attributes.title).font(.caption) }
            } compactLeading: { Text("🍣") } compactTrailing: { Text(ctx.state.endsAt, style: .timer).monospacedDigit().frame(width: 50) } minimal: { Text("🍣") }
        }
    }
}
#endif

@main
struct SushiWidgets: WidgetBundle {
    var body: some Widget {
        SushiWidget()
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) { SushiLiveActivity() }
        #endif
    }
}
