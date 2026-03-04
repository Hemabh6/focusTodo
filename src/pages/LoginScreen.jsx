import React, { useState, useEffect } from 'react';
import { Sparkles, Smartphone, User } from 'lucide-react';
import { signInAnonymously, GoogleAuthProvider, signInWithCredential, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { auth } from '../config/firebase';

export default function LoginScreen() {
  const [mode, setMode] = useState('select');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    // Initialize Google Auth plugin (needed for web; Android uses strings.xml)
    GoogleAuth.initialize({
      clientId: '262533805984-n1jqmkqnvrc1f5vn2c43n76jkbbau70d.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      await signInWithCredential(auth, credential);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleAnon = async () => {
    setError(''); setLoading(true);
    try { await signInAnonymously(auth); } 
    catch (err) { setError(err.message); setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setMode('otp');
    } catch (err) {
      setError(err.message);
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await confirmationResult.confirm(otp); } 
    catch (err) { setError("Invalid code."); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">FocusFlow</h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to sync your habits and tasks.</p>
        </div>

        {error && <div className="mb-6 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 text-center">{error}</div>}

        {mode === 'select' && (
          <div className="space-y-3">
            <button onClick={handleGoogle} disabled={loading} className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50">
              Continue with Google
            </button>
            <button onClick={() => setMode('phone')} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700">
              <Smartphone size={18} /> Continue with Phone
            </button>
            <button onClick={handleAnon} disabled={loading} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 mt-4">
              <User size={18} /> Continue as Guest
            </button>
          </div>
        )}

        {mode === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input type="tel" placeholder="+1 234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" autoFocus required />
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">{loading ? 'Sending...' : 'Send Code'}</button>
            <button type="button" onClick={() => { setMode('select'); setError(''); }} className="w-full text-slate-500 text-sm font-bold mt-2">Back to Options</button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input type="text" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center tracking-[0.5em] font-bold text-xl" maxLength={6} autoFocus required />
            <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">{loading ? 'Verifying...' : 'Verify & Login'}</button>
          </form>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
