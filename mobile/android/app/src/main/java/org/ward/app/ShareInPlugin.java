package org.ward.app;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;

/**
 * "Share to Ward": WhatsApp's Export chat (and the gallery's share button) hand Ward a .txt, a .zip
 * or screenshots. The files are read here and passed to the web app, which reads them on the device
 * like a dropped file. Nothing is saved by this plugin, and the share is forgotten once taken.
 */
@CapacitorPlugin(name = "ShareIn")
public class ShareInPlugin extends Plugin {
    private static final int MAX_BYTES = 25 * 1024 * 1024;
    private Intent pending;

    @Override
    public void load() {
        Intent start = getActivity().getIntent();
        if (isShare(start)) pending = start;
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (isShare(intent)) {
            pending = intent;
            notifyListeners("shared", new JSObject(), true);
        }
    }

    private static boolean isShare(Intent i) {
        return i != null && (Intent.ACTION_SEND.equals(i.getAction()) || Intent.ACTION_SEND_MULTIPLE.equals(i.getAction()));
    }

    @PluginMethod
    public void take(PluginCall call) {
        Intent i = pending;
        pending = null;
        JSObject ret = new JSObject();
        JSArray files = new JSArray();
        if (i != null) {
            getActivity().setIntent(new Intent());
            ArrayList<Uri> uris = new ArrayList<>();
            if (Intent.ACTION_SEND_MULTIPLE.equals(i.getAction())) {
                ArrayList<Uri> many = i.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                if (many != null) uris.addAll(many);
            } else {
                Uri one = i.getParcelableExtra(Intent.EXTRA_STREAM);
                if (one != null) uris.add(one);
            }
            for (Uri uri : uris) {
                try {
                    JSObject f = read(uri);
                    if (f != null) files.put(f);
                } catch (Exception e) {
                    // One unreadable file shouldn't lose the rest.
                }
            }
            CharSequence text = i.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (text != null) ret.put("text", text.toString());
            String subject = i.getStringExtra(Intent.EXTRA_SUBJECT);
            if (subject != null) ret.put("subject", subject);
        }
        ret.put("files", files);
        call.resolve(ret);
    }

    private JSObject read(Uri uri) throws Exception {
        String name = "shared";
        try (Cursor c = getContext().getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int col = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (col >= 0) name = c.getString(col);
            }
        }
        if ("shared".equals(name) && uri.getLastPathSegment() != null) name = uri.getLastPathSegment();
        String mime = getContext().getContentResolver().getType(uri);
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) return null;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
                if (out.size() > MAX_BYTES) return null;
            }
            JSObject f = new JSObject();
            f.put("name", name);
            f.put("mime", mime == null ? "application/octet-stream" : mime);
            f.put("data", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
            return f;
        }
    }
}
