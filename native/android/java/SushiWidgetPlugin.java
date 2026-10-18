package com.arictan.sushistack;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Capacitor plugin "SushiWidget": saves the snapshot and refreshes the home-screen widget. */
@CapacitorPlugin(name = "SushiWidget")
public class SushiWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        SharedPreferences.Editor e = getContext().getSharedPreferences(SushiWidgetProvider.PREFS, Context.MODE_PRIVATE).edit();
        e.putString("restaurant", call.getString("restaurant", "Street Stall"));
        e.putInt("stars", call.getInt("stars", 1));
        e.putInt("tips", call.getInt("tips", 0));
        e.putInt("tipsMax", call.getInt("tipsMax", 80));
        e.putLong("jarFullAt", call.getDouble("jarFullAt", 0.0).longValue());
        e.putInt("calendarDay", call.getInt("calendarDay", 1));
        e.putBoolean("calendarReady", call.getBoolean("calendarReady", false));
        e.putInt("level", call.getInt("level", 1));
        e.apply();
        SushiWidgetProvider.refresh(getContext());
        call.resolve();
    }

    /** Live Activities are iOS-only; these resolve quietly on Android. */
    @PluginMethod
    public void startActivity(PluginCall call) { call.resolve(); }

    @PluginMethod
    public void endActivity(PluginCall call) { call.resolve(); }
}
