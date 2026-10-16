package com.lumitechsystems.lumiledger;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Keeps the app process alive while the POS screen is open, with a persistent
 * notification, so Android's background-process killer (MIUI in particular is
 * far more aggressive than stock Android) doesn't tear down the USB printer
 * connection the way it would with a plain backgrounded browser tab.
 */
public class PrinterForegroundService extends Service {

    private static final String CHANNEL_ID = "lumiledger_pos";
    private static final int NOTIFICATION_ID = 1001;

    @Override
    public void onCreate() {
        super.onCreate();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "LumiLedger POS", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Keeps the till and receipt printer connection alive");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0;
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, launchIntent, piFlags);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("LumiLedger POS")
                .setContentText("Running — keeping the receipt printer connected")
                .setSmallIcon(android.R.drawable.ic_menu_manage)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .build();

        // Matches the single foregroundServiceType="specialUse" declared in the manifest —
        // the type passed here must be a subset of what's declared there, on every OS
        // version that enforces it (29+), so this stays one constant, not SDK-branched.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
