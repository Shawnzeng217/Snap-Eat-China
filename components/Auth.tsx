
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Language } from '../types';
import { LANGUAGES, NATIVE_LANGUAGE_NAMES } from '../constants';
import { UI_TRANSLATIONS } from '../translations';

interface AuthProps {
    uiLanguage: Language;
    onLanguageChange: (lang: Language) => void;
}

export const Auth: React.FC<AuthProps> = ({ uiLanguage, onLanguageChange }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('test@hilton.com');
    const [password, setPassword] = useState('password123');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [isLangOpen, setIsLangOpen] = useState(false);

    const t = UI_TRANSLATIONS[uiLanguage].auth;

    // ... (rest of handleAuth remains same) ...

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.user && data.session === null) {
                    setMessage({ type: 'success', text: t.check_email });
                } else {
                    setMessage({ type: 'success', text: t.account_created });
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || t.default_error });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 relative">
            
            {/* Language Selector Top Right */}
            <div className="absolute top-6 right-6 z-50">
                <div className="relative">
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="flex items-center gap-2 bg-white dark:bg-surface-dark px-3 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center justify-center size-6 rounded-lg bg-primary text-white shadow-sm overflow-hidden">
                             <span className="material-symbols-outlined text-[16px]">language</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {NATIVE_LANGUAGE_NAMES[uiLanguage]}
                        </span>
                        <span className={`material-symbols-outlined text-gray-400 text-[18px] transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {isLangOpen && (
                        <>
                            <div className="fixed inset-0 z-[-1]" onClick={() => setIsLangOpen(false)}></div>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/10 py-2 animate-[scaleIn_0.2s_ease-out] overflow-hidden z-[60]">
                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => {
                                                onLanguageChange(lang);
                                                setIsLangOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${uiLanguage === lang
                                                ? 'bg-primary/10 text-primary font-bold'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-sm font-medium">{NATIVE_LANGUAGE_NAMES[lang]}</span>
                                            {uiLanguage === lang && (
                                                <span className="material-symbols-outlined text-[18px] ml-auto">check</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="w-full max-w-sm">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 transform rotate-3">
                        <span className="material-symbols-outlined text-[32px]">restaurant_menu</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Snap <span className="text-primary">&</span> Eat</h1>
                </div>

                <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold mb-6 text-center">
                        {isSignUp ? t.create_account : t.welcome_back}
                    </h2>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm mb-4 font-medium ${message.type === 'error'
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">{t.email}</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">mail</span>
                                <input
                                    type="email"
                                    placeholder="hello@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5 ml-1">{t.password}</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">lock</span>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:font-normal placeholder:text-gray-400"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                            {isSignUp ? t.sign_up : t.sign_in}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 text-center">
                        <p className="text-sm text-gray-500">
                            {isSignUp ? t.switch_to_signin : t.switch_to_signup}
                            <button
                                onClick={() => {
                                    const nextMode = !isSignUp;
                                    setIsSignUp(nextMode);
                                    setMessage(null);
                                    if (nextMode) {
                                        setEmail('');
                                        setPassword('');
                                    } else {
                                        // Restore test credentials only when switching back to login
                                        setEmail('test@hilton.com');
                                        setPassword('password123');
                                    }
                                }}
                                className="ml-2 font-bold text-primary hover:text-primary-dark underline decoration-2 decoration-transparent hover:decoration-current transition-all"
                            >
                                {isSignUp ? t.sign_in : t.sign_up}
                            </button>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
