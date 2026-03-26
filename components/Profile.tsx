import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Language } from '../types';
import { LANGUAGES, COMMON_ALLERGENS, CHEF_CARD_DATA, NATIVE_LANGUAGE_NAMES } from '../constants';
import { UI_TRANSLATIONS } from '../translations';


interface ProfileProps {
    uiLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    onNavigateHistory: (tab: 'scans' | 'saved') => void;
    scanCount: number;
    savedCount: number;
    onLogout: () => void;
    userProfile: any;
    onUpdateProfile: (updates: any) => void;
}

export const Profile: React.FC<ProfileProps> = ({
    uiLanguage,
    onLanguageChange,
    onNavigateHistory,
    scanCount,
    savedCount,
    onLogout,
    userProfile,
    onUpdateProfile
}) => {
    const t = UI_TRANSLATIONS[uiLanguage].profile;
    const common = UI_TRANSLATIONS[uiLanguage].common;
    const [avatar, setAvatar] = useState("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200");

    const [isEditingName, setIsEditingName] = useState(false);
    const [userName, setUserName] = useState<string>("");
    const nameInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dietary Restrictions State
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
    const [dietaryNotes, setDietaryNotes] = useState(() => {
        const notes = userProfile?.dietary_notes || "";
        return notes === "I cannot eat cucumber" ? "" : notes;
    });
    const [showDietaryModal, setShowDietaryModal] = useState(false);

    // Chef Card State
    const [customAllergen, setCustomAllergen] = useState("");
    const [allergenSelectValue, setAllergenSelectValue] = useState(""); // Track dropdown selection
    const [showCustomAllergenInput, setShowCustomAllergenInput] = useState(false);

    // Chef Card State
    const [showChefCard, setShowChefCard] = useState(false);
    const [cardLanguage, setCardLanguage] = useState<Language>(uiLanguage);
    const [isCardLangOpen, setIsCardLangOpen] = useState(false);
    const [translatedNotes, setTranslatedNotes] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);

    // Sync from props
    useEffect(() => {
        if (userProfile) {
            if (userProfile.full_name) setUserName(userProfile.full_name);
            if (userProfile.allergens) setSelectedAllergens(userProfile.allergens);
            if (userProfile.dietary_notes) {
                const notes = userProfile.dietary_notes;
                setDietaryNotes(notes === "I cannot eat cucumber" ? "" : notes);
            }
            if (userProfile.avatar_url) setAvatar(userProfile.avatar_url);
        }
    }, [userProfile]);



    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [isEditingName]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setAvatar(imageUrl);
            // In a real app, upload to storage and get URL, then onUpdateProfile({ avatar_url: url })
        }
    };

    const handleNameSave = () => {
        setIsEditingName(false);
        if (userName !== userProfile?.full_name) {
            onUpdateProfile({ full_name: userName });
        }
    };

    const handleAllergenToggle = (allergen: string) => {
        let newAllergens;
        if (selectedAllergens.includes(allergen)) {
            newAllergens = selectedAllergens.filter(a => a !== allergen);
        } else {
            newAllergens = [...selectedAllergens, allergen];
        }
        setSelectedAllergens(newAllergens);
        onUpdateProfile({ allergens: newAllergens });
    };

    const handleAllergenSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "custom") {
            setAllergenSelectValue("custom");
            setShowCustomAllergenInput(true);
        } else if (value) {
            handleAllergenToggle(value);
            setAllergenSelectValue(""); // Reset dropdown
            setShowCustomAllergenInput(false);
        } else {
            setAllergenSelectValue("");
            setShowCustomAllergenInput(false);
        }
    };

    const handleAddCustomAllergen = () => {
        if (customAllergen.trim() && !selectedAllergens.includes(customAllergen.trim())) {
            const newAllergen = customAllergen.trim();
            const newAllergens = [...selectedAllergens, newAllergen];
            setSelectedAllergens(newAllergens);
            onUpdateProfile({ allergens: newAllergens });
            setCustomAllergen("");
            setShowCustomAllergenInput(false); // Hide input after adding
            setAllergenSelectValue(""); // Reset dropdown
        }
    };

    const handleSaveDietaryNotes = () => {
        setShowDietaryModal(false);
        onUpdateProfile({ dietary_notes: dietaryNotes });
    };

    const handleShowCard = async () => {
        setShowChefCard(true);

        // If no notes, clear translated and return
        if (!dietaryNotes.trim()) {
            setTranslatedNotes("");
            return;
        }

        // Translate notes
        setIsTranslating(true);

        try {
            const dashscopeApiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY || "";
            const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${dashscopeApiKey}`,
                },
                body: JSON.stringify({
                    model: 'qwen3-omni-flash-2025-12-01',
                    messages: [
                        {
                            role: 'user',
                            content: `Translate the following dietary restriction note into ${cardLanguage} for a chef to read. Keep it clear, polite and concise. Return ONLY the translated text, no explanation.\n\nText: "${dietaryNotes}"`
                        }
                    ],
                    stream: true,
                    modalities: ["text"],
                    temperature: 0.3,
                    max_tokens: 512
                })
            });

            if (!response.ok) {
                throw new Error(`DashScope API error (${response.status})`);
            }

            // Parse SSE stream
            const reader = response.body!.getReader();
            const decoder = new TextDecoder('utf-8');
            let accumulated = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const chunk = JSON.parse(trimmed.slice(6));
                            const delta = chunk.choices?.[0]?.delta?.content;
                            if (delta) accumulated += delta;
                        } catch { /* skip malformed chunks */ }
                    }
                }
            }

            if (accumulated.trim()) {
                setTranslatedNotes(accumulated.trim());
            } else {
                console.warn("Translation returned empty text");
                setTranslatedNotes(dietaryNotes);
            }
        } catch (error) {
            console.error("Translation failed", error);
            setTranslatedNotes(dietaryNotes); // Fallback to original
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#e65000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <div className="absolute top-[-20%] right-[-30%] w-96 h-96 bg-primary/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none"></div>

            <header className="relative z-10 flex items-center justify-between px-6 py-4 shrink-0">
                <div className="w-11"></div> {/* Spacer for symmetry */}

                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2">
                    {t.my_profile}
                </h1>

                <button
                    onClick={onLogout}
                    className="flex items-center justify-center size-11 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm"
                    title={t.sign_out}
                >
                    <span className="material-symbols-outlined text-[24px]">logout</span>
                </button>
            </header>

            <main className="relative z-10 flex-1 w-full overflow-y-auto no-scrollbar pb-24">
                <div className="flex flex-col items-center px-6 mb-8 pt-2">
                    {/* Avatar Upload */}
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="size-28 rounded-full bg-surface-light dark:bg-surface-dark p-1.5 border-2 border-primary/20 shadow-glow overflow-hidden">
                            <img src={avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-2 border-4 border-surface-light dark:border-surface-dark shadow-md transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-[16px] block">camera_alt</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                        {isEditingName ? (
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                onBlur={handleNameSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                                className="bg-transparent text-2xl font-extrabold text-gray-900 dark:text-white text-center border-b-2 border-primary outline-none min-w-[100px]"
                            />
                        ) : (
                            <h2
                                onClick={() => {
                                    if (userName === "Guest User" || userName === t.guest_user) {
                                        setUserName("");
                                    }
                                    setIsEditingName(true);
                                }}
                                className="text-2xl font-extrabold text-gray-900 dark:text-white text-center cursor-pointer hover:opacity-80 flex items-center gap-2"
                            >
                                {(userName && userName !== "Guest User") ? userName : t.guest_user}
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">edit</span>
                            </h2>
                        )}
                    </div>



                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-6 w-full max-w-[280px] bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div 
                            onClick={() => onNavigateHistory('scans')}
                            className="flex-1 flex flex-col items-center border-r border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors py-1 rounded-l-xl"
                        >
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{scanCount}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{t.scans}</span>
                        </div>
                        <div 
                            onClick={() => onNavigateHistory('saved')}
                            className="flex-1 flex flex-col items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors py-1 rounded-r-xl"
                        >
                            <span className="text-xl font-bold text-primary">{savedCount}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{t.saved_dishes}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Language Settings Section */}
                    <div className="px-6 pt-2">
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">{t.language}</h3>
                        <div className="relative">
                            <button
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="w-full bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between group transition-all hover:border-primary/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary p-2 rounded-xl">
                                        <span className="material-symbols-outlined text-[20px]">language</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{NATIVE_LANGUAGE_NAMES[uiLanguage]}</span>
                                </div>
                                <span className={`material-symbols-outlined text-gray-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {isLangOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-[fadeInDown_0.3s_ease-out] max-h-[300px] overflow-y-auto no-scrollbar">
                                    <div className="grid grid-cols-2 p-2 gap-1">
                                        {LANGUAGES.map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => {
                                                    onLanguageChange(lang);
                                                    setIsLangOpen(false);
                                                }}
                                                className={`flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all ${uiLanguage === lang
                                                    ? 'bg-primary text-white shadow-md scale-[1.02]'
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                {NATIVE_LANGUAGE_NAMES[lang]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dietary Restrictions Section */}
                    <div className="px-6">
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">{t.preferences}</h3>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col divide-y divide-gray-100 dark:divide-gray-800/50">

                            {/* Row 1: Allergens Dropdown */}
                            <div className="p-4 pb-6 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-[18px]">no_food</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.allergens}</span>
                                </div>

                                <div>
                                    <select
                                        value={allergenSelectValue}
                                        onChange={handleAllergenSelectChange}
                                        className={`w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 transition-colors ${!allergenSelectValue ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}
                                    >
                                        <option value="">{t.select_allergen}</option>
                                        {COMMON_ALLERGENS.map(a => (
                                            <option key={a} value={a} disabled={selectedAllergens.includes(a)}>
                                                {CHEF_CARD_DATA[uiLanguage].allergens[a] || a}
                                            </option>
                                        ))}
                                        <option value="custom">{t.custom_allergen_opt}</option>
                                    </select>
                                </div>

                                {showCustomAllergenInput && (
                                    <div className="flex gap-2 animate-[fadeIn_0.2s_ease-out] w-full">
                                        <input
                                            type="text"
                                            value={customAllergen}
                                            onChange={(e) => setCustomAllergen(e.target.value)}
                                            placeholder={t.enter_custom}
                                            className="flex-1 min-w-0 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAllergen()}
                                            autoFocus
                                        />
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={handleAddCustomAllergen}
                                                disabled={!customAllergen.trim()}
                                                className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t.add_btn}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCustomAllergenInput(false);
                                                    setAllergenSelectValue("");
                                                    setCustomAllergen("");
                                                }}
                                                className="bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 font-bold px-3 py-2 rounded-xl text-sm transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedAllergens.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {selectedAllergens.map(allergen => (
                                            <span key={allergen} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30">
                                                {CHEF_CARD_DATA[uiLanguage].allergens[allergen] || allergen}
                                                <button onClick={() => handleAllergenToggle(allergen)} className="ml-1.5 hover:text-red-900 dark:hover:text-white">
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Row 2: Preferences */}
                            <div className="p-4 pb-6 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-2 rounded-lg">
                                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.dislikes}</span>
                                </div>

                                <button
                                    onClick={() => setShowDietaryModal(true)}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 text-left flex items-center justify-between group transition-colors hover:border-primary/50"
                                >
                                    <span className={`block truncate ${dietaryNotes ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                        {dietaryNotes || t.dislikes_placeholder}
                                    </span>
                                    <span className="material-symbols-outlined text-gray-400 text-[20px] group-hover:text-primary transition-colors shrink-0 ml-2">
                                        edit
                                    </span>
                                </button>
                            </div>


                        </div>
                    </div>

                    <div className="px-6">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-2">
                            <div className="w-full flex-col p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl">
                                            <span className="material-symbols-outlined text-[20px]">badge</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{t.info_card}</span>
                                            <span className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">{t.info_card_desc}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleShowCard}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all font-bold text-sm"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        {t.view_card}
                                    </button>
                                </div>

                                {/* Card Language Selector */}
                                <div className="pt-3 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.display_lang}</span>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsCardLangOpen(!isCardLangOpen)}
                                                className="flex items-center gap-1.5 py-1.5 px-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                                            >
                                                {NATIVE_LANGUAGE_NAMES[cardLanguage]}
                                                <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isCardLangOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                            </button>

                                            {isCardLangOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[100]" onClick={() => setIsCardLangOpen(false)}></div>
                                                    <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/10 py-1 z-[110] animate-[scaleIn_0.2s_ease-out] overflow-hidden">
                                                        <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                            {LANGUAGES.map((lang) => (
                                                                <button
                                                                    key={lang}
                                                                    onClick={() => {
                                                                        setCardLanguage(lang);
                                                                        setIsCardLangOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${cardLanguage === lang
                                                                        ? 'bg-primary/10 text-primary font-bold'
                                                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                                        }`}
                                                                >
                                                                    {NATIVE_LANGUAGE_NAMES[lang]}
                                                                    {cardLanguage === lang && (
                                                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">{t.history_data}</h3>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <button
                                onClick={() => onNavigateHistory('scans')}
                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-100 dark:bg-orange-900/30 text-primary p-1.5 rounded-lg">
                                        <span className="material-symbols-outlined text-[20px]">history</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.scan_history}</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">chevron_right</span>
                            </button>
                            <button
                                onClick={() => onNavigateHistory('saved')}
                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-500 p-1.5 rounded-lg">
                                        <span className="material-symbols-outlined text-[20px]">favorite</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.saved_dishes}</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Modal: Edit Dislikes */}
                {
                    showDietaryModal && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] font-display">
                            <div className="w-full max-w-[320px] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 animate-[scaleIn_0.2s_ease-out]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.modal_title}</h3>
                                    <button onClick={() => setShowDietaryModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    {t.modal_desc}
                                </p>
                                <textarea
                                    value={dietaryNotes}
                                    onChange={(e) => setDietaryNotes(e.target.value)}
                                    className="w-full h-32 p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                    placeholder={t.dislikes_placeholder}
                                ></textarea>
                                <button
                                    onClick={handleSaveDietaryNotes}
                                    className="w-full mt-4 bg-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-primary-dark transition-colors"
                                >
                                    {t.modal_save}
                                </button>
                            </div>
                        </div>,
                        document.body
                    )
                }

                {/* Modal: Chef Card (Card Style) */}
                {
                    showChefCard && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] font-display">
                            <div className="w-full max-w-[340px] bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[scaleIn_0.2s_ease-out] relative">

                                {/* Close Button */}
                                {/* Close Button */}
                                <button
                                    onClick={() => setShowChefCard(false)}
                                    className="absolute top-3 right-3 z-50 size-8 rounded-full bg-gray-100/80 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>

                                <div className="overflow-y-auto p-0 no-scrollbar relative flex-1 bg-gray-50 dark:bg-black/40">

                                    {/* 1. ORIGINAL LANGUAGE (Top Half) */}
                                    <div className="p-6 pb-8 bg-white dark:bg-[#1a1a1a] shadow-sm relative z-10">
                                        <div className="flex items-center gap-2 mb-4 opacity-50">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                                {NATIVE_LANGUAGE_NAMES[uiLanguage]}
                                            </span>
                                        </div>

                                        <div className="text-center mb-6">
                                                {CHEF_CARD_DATA[uiLanguage].title}
                                        </div>

                                        {/* Content in English */}
                                        <div className="flex flex-col gap-4">
                                            {selectedAllergens.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                                        {CHEF_CARD_DATA[uiLanguage].allergyWarning}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {selectedAllergens.map(allergen => (
                                                            <div key={allergen} className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30 px-2.5 py-1 rounded-lg font-bold text-sm">
                                                                {/* Display original allergen name if it's common, else just string */}
                                                                {COMMON_ALLERGENS.includes(allergen) ? CHEF_CARD_DATA[uiLanguage].allergens[allergen] : allergen}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {dietaryNotes && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                                                        {CHEF_CARD_DATA[uiLanguage].avoidText}
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                                                        {dietaryNotes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. TARGET LANGUAGE (Bottom Half) */}
                                    <div className="p-6 pt-8 text-white bg-primary">
                                        <div className="flex items-center gap-2 mb-4 text-white/70">
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                {`${t.display_in} (${NATIVE_LANGUAGE_NAMES[cardLanguage]})`}
                                            </span>
                                        </div>

                                        <div className="text-center mb-6">
                                            <span className="material-symbols-outlined text-[40px] mb-2 text-white/90">warning</span>
                                            <h1 className="text-2xl font-black uppercase tracking-wide text-white">
                                                {CHEF_CARD_DATA[cardLanguage].title}
                                            </h1>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            {selectedAllergens.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-bold text-white/70 mb-2 uppercase tracking-wide">
                                                        {CHEF_CARD_DATA[cardLanguage].allergyWarning}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedAllergens.map(allergen => (
                                                            <div key={allergen} className="bg-white text-red-600 px-3 py-1.5 rounded-lg font-bold text-lg shadow-sm">
                                                                {/* Try to translate allergen, fallback to English/Original */}
                                                                {CHEF_CARD_DATA[cardLanguage].allergens[allergen] || allergen}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {dietaryNotes && (
                                                <div>
                                                    <p className="text-sm font-bold text-white/70 mb-2 uppercase tracking-wide">
                                                        {CHEF_CARD_DATA[cardLanguage].avoidText}
                                                    </p>
                                                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 relative min-h-[60px]">
                                                        {isTranslating ? (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-lg font-medium text-white leading-relaxed whitespace-pre-wrap">
                                                                {translatedNotes || dietaryNotes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-center pt-4 border-t border-white/20">
                                                <p className="text-lg font-bold text-white">
                                                    {CHEF_CARD_DATA[cardLanguage].thankYou}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                }

            </main >
        </div >
    );
};

