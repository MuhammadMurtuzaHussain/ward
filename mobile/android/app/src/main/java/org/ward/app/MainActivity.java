package org.ward.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareInPlugin.class);
        registerPlugin(PrivacyPlugin.class);
        registerPlugin(GiveWardPlugin.class);
        // GemmaPhone in the gemma flavour only (src/lite and src/gemma).
        for (Class<? extends Plugin> p : FlavourPlugins.all) registerPlugin(p);
        super.onCreate(savedInstanceState);
    }
}
