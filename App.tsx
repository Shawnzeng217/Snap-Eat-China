
import React, { useState, useEffect, useRef } from 'react';
import { Home } from './components/Home';
import { Scanning } from './components/Scanning';
import { Results } from './components/Results';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { BottomNav } from './components/BottomNav';
import { Screen, Language, Dish, SavedItem, ScanType } from './types';
import { MOCK_SAVED } from './constants';
import { supabase } from './lib/supabase';
import { UI_TRANSLATIONS } from './translations';
import { trackPageView } from './lib/adobeTracking';


const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // App State
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scanType, setScanType] = useState<ScanType>('dish');

  // State for Features
  const [uiLanguage, setUiLanguage] = useState<Language>('English');
  const uiLanguageRef = useRef<Language>(uiLanguage);
  const [targetLanguage, setTargetLanguage] = useState<Language>('English');

  // Keep ref in sync
  useEffect(() => {
    uiLanguageRef.current = uiLanguage;
  }, [uiLanguage]);

  const [currentResults, setCurrentResults] = useState<Dish[]>([]);
  const [history, setHistory] = useState<Dish[]>([]); // All scanned items
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  // Profile State
  const [userProfile, setUserProfile] = useState<any>(null);

  // State for History Tabs
  const [historyTab, setHistoryTab] = useState<'scans' | 'saved'>('scans');

  useEffect(() => {
    const pageName = currentScreen === 'home' ? '首页' : 
                     currentScreen === 'scanning' ? '扫描页' : 
                     currentScreen === 'results' ? '结果页' : 
                     currentScreen === 'history' ? '历史记录' : 
                     currentScreen === 'profile' ? '个人主页' : currentScreen;
    const langCode = uiLanguage === 'Chinese (Simplified)' ? 'zh-CN' : 
                     uiLanguage === 'English' ? 'en-US' : 'zh-CN';
    
    // Default to track login/auth if no user
    trackPageView(session ? pageName : '登录注册页', langCode);
  }, [currentScreen, session, uiLanguage]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (session) fetchData(session.user.id, session.user.email, false); // Initial load, use profile
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      setSession(session);
      if (session) {
        // Only prioritize current UI language if it was a fresh login/sign-up
        const isFreshLogin = event === 'SIGNED_IN' || event === 'SIGNED_UP';
        fetchData(session.user.id, session.user.email, isFreshLogin);
      }
      else {
        setHistory([]);
        setSavedItems([]);
        setUserProfile(null);
        // Fix: Clear session-specific search results and inputs
        setCurrentResults([]);
        setUploadedImage(null);
        setCurrentScreen('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string, userEmail: string = '', isLoginEvent: boolean = false) => {
    setLoading(true);
    try {
      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        // By user request: allergens should not be checked by default for the test user
        if (userEmail === 'test@hilton.com') {
          profile.allergens = [];
        }
        setUserProfile(profile);
        
        const profileLang = profile.default_language as Language;
        
        const currentUiLang = uiLanguageRef.current;
        if (isLoginEvent && currentUiLang !== profileLang) {
          // User changed language on login screen, update profile to match
          await supabase.from('profiles').update({ default_language: currentUiLang }).eq('id', userId);
          setUserProfile((prev: any) => ({ ...prev, default_language: currentUiLang }));
        } else if (profileLang) {
          // Initial load or no change, use profile language
          setUiLanguage(profileLang);
          setTargetLanguage(profileLang);
        }
      }

      // Fetch Scans
      const { data: scans } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (scans) {
        const formattedScans: Dish[] = scans.map((s: any) => ({
          id: s.id,
          name: s.name,
          originalName: s.original_name,
          description: s.description,
          image: s.image_url,
          tags: s.tags || [],
          allergens: s.allergens || [],
          spiceLevel: s.spice_level,
          category: s.category,
          boundingBox: s.bounding_box,
          isMenu: s.is_menu
        }));

        setHistory(formattedScans);

        // Filter saved items
        const saved = scans.filter((s: any) => s.is_saved).map((s: any) => ({
          id: s.id,
          name: s.name,
          originalName: s.original_name,
          description: s.description,
          image: s.image_url,
          tags: s.tags || [],
          allergens: s.allergens || [],
          spiceLevel: s.spice_level,
          category: s.category,
          boundingBox: s.bounding_box,
          isMenu: s.is_menu,
          savedAt: new Date(s.saved_at || s.created_at)
        }));
        setSavedItems(saved);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    setUiLanguage(lang);
    setTargetLanguage(lang);
    if (session?.user) {
      await supabase.from('profiles').update({ default_language: lang }).eq('id', session.user.id);
      setUserProfile((prev: any) => ({ ...prev, default_language: lang }));
    }
  };

  const handleImageSelect = (file: File, type: ScanType) => {
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setScanType(type);
    setCurrentScreen('scanning');
  };

  const handleScanCancel = () => {
    setCurrentScreen('home');
    setUploadedImage(null);
  };

  const handleScanComplete = async (results: Dish[]) => {
    setCurrentResults(results);
    setCurrentScreen('results');

    // Save to Database
    if (session?.user) {
      const newScans = results.map(dish => ({
        user_id: session.user.id,
        name: dish.name,
        original_name: dish.originalName,
        description: dish.description,
        image_url: dish.image, // Note: In real app, verify this is a persistent URL or Base64 is okay for small scale
        tags: dish.tags,
        allergens: dish.allergens,
        spice_level: dish.spiceLevel,
        category: dish.category,
        bounding_box: dish.boundingBox,
        is_menu: dish.isMenu,
        is_saved: false
      }));

      const { data, error } = await supabase.from('scans').insert(newScans).select();

      if (data) {
        const formattedNew: Dish[] = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          originalName: s.original_name,
          description: s.description,
          image: s.image_url,
          tags: s.tags || [],
          allergens: s.allergens || [],
          spiceLevel: s.spice_level,
          category: s.category,
          boundingBox: s.bounding_box,
          isMenu: s.is_menu
        }));
        setHistory(prev => [...formattedNew, ...prev]);
      }
    }
  };

  const handleToggleSave = async (dishId: string) => {
    const isAlreadySaved = savedItems.some(item => item.id === dishId);
    let newSavedItems = [...savedItems];

    if (isAlreadySaved) {
      newSavedItems = newSavedItems.filter(item => item.id !== dishId);
    } else {
      const dishToSave = currentResults.find(d => d.id === dishId) || history.find(d => d.id === dishId);
      if (dishToSave) {
        newSavedItems = [{ ...dishToSave, savedAt: new Date() }, ...newSavedItems];
      }
    }

    setSavedItems(newSavedItems);

    if (session?.user) {
      await supabase
        .from('scans')
        .update({
          is_saved: !isAlreadySaved,
          saved_at: !isAlreadySaved ? new Date().toISOString() : null
        })
        .eq('id', dishId);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error, forcing local cleanup:", error);
    } finally {
      // Force local state cleanup even if network request fails

      setHistory([]);
      setSavedItems([]);
      setUserProfile(null);
      // Fix: Clear session-specific search results and inputs
      setCurrentResults([]);
      setUploadedImage(null);
      setCurrentScreen('home');
    }
  };

  const updateProfile = async (updates: any) => {
    if (session?.user) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      if (!error) {
        setUserProfile((prev: any) => ({ ...prev, ...updates }));
      }
    }
  };

  // Pass profile data to child
  const profileProps = {
    uiLanguage,
    onLanguageChange: handleLanguageChange,
    onNavigateHistory: (tab: 'scans' | 'saved') => {
      setHistoryTab(tab);
      setCurrentScreen('history');
    },
    scanCount: history.length,
    savedCount: savedItems.length,
    onLogout: handleLogout,
    userProfile: userProfile,
    onUpdateProfile: updateProfile
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <Home
            onImageSelect={handleImageSelect}
            targetLanguage={targetLanguage}
            setTargetLanguage={setTargetLanguage}
            uiLanguage={uiLanguage}
          />
        );
      case 'scanning':
        return (
          <Scanning
            uploadedImage={uploadedImage}
            scanType={scanType}
            targetLanguage={targetLanguage}
            onCancel={handleScanCancel}
            onComplete={handleScanComplete}
            uiLanguage={uiLanguage}
          />
        );
      case 'results':
        return (
          <Results
            uploadedImage={uploadedImage}
            results={currentResults}
            savedIds={savedItems.map(s => s.id)}
            onBack={() => setCurrentScreen('home')}
            onSave={handleToggleSave}
            uiLanguage={uiLanguage}
          />
        );
      case 'history':
        return (
          <History
            historyItems={history}
            savedItems={savedItems}
            activeTab={historyTab}
            onTabChange={setHistoryTab}
            onBack={() => setCurrentScreen('home')}
            onToggleSave={handleToggleSave}
            uiLanguage={uiLanguage}
          />
        );
      case 'profile':
        return (
          <Profile
            uiLanguage={uiLanguage}
            onLanguageChange={handleLanguageChange}
            onNavigateHistory={(tab) => {
              setHistoryTab(tab);
              setCurrentScreen('history');
            }}
            scanCount={history.length}
            savedCount={savedItems.length}
            onLogout={handleLogout}
            userProfile={userProfile}
            onUpdateProfile={updateProfile}
          />
        );
      default:
        return <Home
          onImageSelect={handleImageSelect}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          uiLanguage={uiLanguage}
        />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark select-none cursor-default">
        <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin pointer-events-none"></span>
      </div>
    );
  }

  if (!session) {
    return <Auth uiLanguage={uiLanguage} onLanguageChange={handleLanguageChange} />;
  }

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-background-light dark:bg-background-dark shadow-xl overflow-hidden text-[#181310] dark:text-gray-100 font-display">

      {/* Screen Content */}
      <div className="flex-1 overflow-hidden h-full">
        {renderScreen()}
      </div>

      {/* Navigation (Only show on certain screens) */}
      {currentScreen !== 'scanning' && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          uiLanguage={uiLanguage}
        />
      )}
    </div>
  );
};

export default App;