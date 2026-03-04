import { registerPlugin } from '@capacitor/core';

// Bridges to AlarmPlugin.java on Android.
// On web/iOS the call is a no-op (rejects silently).
const AlarmPlugin = registerPlugin('AlarmPlugin');

export default AlarmPlugin;
