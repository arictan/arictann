package com.arictan.sushistack;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Home-screen widget: restaurant, tip jar progress and the calendar reward. */
public class SushiWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "sushi_widget";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, views(context));
    }

    static void refresh(Context context) {
        AppWidgetManager m = AppWidgetManager.getInstance(context);
        int[] ids = m.getAppWidgetIds(new ComponentName(context, SushiWidgetProvider.class));
        for (int id : ids) m.updateAppWidget(id, views(context));
    }

    static RemoteViews views(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.sushi_widget);
        int stars = p.getInt("stars", 1);
        StringBuilder s = new StringBuilder();
        for (int i = 0; i < stars; i++) s.append('★');
        v.setTextViewText(R.id.sw_name, "🏯 " + p.getString("restaurant", "Street Stall") + "  " + s);
        long fullAt = p.getLong("jarFullAt", 0);
        long left = fullAt - System.currentTimeMillis();
        int progress = fullAt == 0 ? 0 : (int) Math.max(0, Math.min(100, 100 - left / (8 * 36000L)));
        v.setProgressBar(R.id.sw_jar, 100, progress, false);
        v.setTextViewText(R.id.sw_tips, left <= 0 && fullAt > 0 ? "💰 Tip jar full!" : "💰 Tips filling…");
        boolean ready = p.getBoolean("calendarReady", false);
        v.setTextViewText(R.id.sw_calendar, (ready ? "📅 Day " + p.getInt("calendarDay", 1) + " reward ready" : "📅 Next reward tomorrow") + " · Lv " + p.getInt("level", 1));
        Intent open = new Intent(context, MainActivity.class);
        v.setOnClickPendingIntent(R.id.sw_root, PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        return v;
    }
}
