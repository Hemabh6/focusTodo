package com.aaviskar.focusflow;

import android.content.Intent;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.CalendarContract;

import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;

@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        try {
            int hour = call.getInt("hour", 9);
            int minutes = call.getInt("minutes", 0);
            String message = call.getString("message", "Task Reminder");

            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
            intent.putExtra(AlarmClock.EXTRA_HOUR, hour);
            intent.putExtra(AlarmClock.EXTRA_MINUTES, minutes);
            intent.putExtra(AlarmClock.EXTRA_MESSAGE, message);
            intent.putExtra(AlarmClock.EXTRA_SKIP_UI, false);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            // Optional recurring days (Android Calendar constants: 1=Sun, 2=Mon, ... 7=Sat)
            JSArray days = call.getArray("days");
            if (days != null && days.length() > 0) {
                ArrayList<Integer> daysList = new ArrayList<>();
                for (int i = 0; i < days.length(); i++) {
                    daysList.add(days.getInt(i));
                }
                intent.putIntegerArrayListExtra(AlarmClock.EXTRA_DAYS, daysList);
            }

            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to schedule alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void addCalendarEvent(PluginCall call) {
        try {
            String title = call.getString("title", "Task");
            long beginTime = call.getLong("beginTime", System.currentTimeMillis());
            long endTime = call.getLong("endTime", beginTime + 3600000L);
            String description = call.getString("description", "");

            Intent intent = new Intent(Intent.ACTION_INSERT);
            intent.setData(CalendarContract.Events.CONTENT_URI);
            intent.putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, beginTime);
            intent.putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endTime);
            intent.putExtra(CalendarContract.Events.TITLE, title);
            intent.putExtra(CalendarContract.Events.DESCRIPTION, description);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to add calendar event: " + e.getMessage());
        }
    }
}
