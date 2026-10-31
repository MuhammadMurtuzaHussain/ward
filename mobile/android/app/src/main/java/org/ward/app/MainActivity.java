package org.ward.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareInPlugin.class);
        registerPlugin(GemmaPhonePlugin.class);
        registerPlugin(PrivacyPlugin.class);
        registerPlugin(GiveWardPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
