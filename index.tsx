import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, update, remove } from "firebase/database";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { GoogleGenAI } from "@google/genai";
import { 
  Settings, User, Book, Layers, Layout, Video, 
  Menu, X, Upload, LogOut, Moon, Sun, Monitor, 
  Cloud, Lock, Edit, Plus, Trash, Search, ExternalLink,
  MessageCircle, FileText, CheckCircle
} from 'lucide-react';

// --- تهيئة Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAklmsuYWvws9GiMuKLRRG9NrW8wKgryeA",
  authDomain: "happyhome-bc5e7.firebaseapp.com",
  databaseURL: "https://happyhome-bc5e7-default-rtdb.firebaseio.com",
  projectId: "happyhome-bc5e7",
  storageBucket: "happyhome-bc5e7.firebasestorage.app",
  messagingSenderId: "1057692254640",
  appId: "1:1057692254640:web:529edffc6161fee4025675",
  measurementId: "G-8SQ0EGSFN1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

// --- تهيئة Gemini AI ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- مكون الساعة والتاريخ ---
const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return (
    <div className="flex flex-col text-xs md:text-sm font-semibold opacity-90 leading-tight">
      <span>{time.toLocaleDateString('ar-EG', options)}</span>
      <span>{time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
    </div>
  );
};

// --- التطبيق الرئيسي ---
const App = () => {
  const [theme, setTheme] = useState('default');
  const [user, setUser] = useState<any>(null); // مستخدم Firebase العادي
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // home, login, register, admin, admin_ads, etc.
  const [appSettings, setAppSettings] = useState({ name: 'المتميزون', whatsapp: '' });
  const [ads, setAds] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [content, setContent] = useState<any>({});
  
  // حالة الشرح والذكاء الاصطناعي
  const [generatedExplanation, setGeneratedExplanation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // جلب البيانات عند التحميل
  useEffect(() => {
    // تعيين الثيم
    document.documentElement.setAttribute('data-theme', theme);
    
    // مراقبة حالة تسجيل الدخول للمستخدمين العاديين
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // جلب الإعدادات
    onValue(ref(db, 'settings'), (snap) => {
      const val = snap.val();
      if (val) setAppSettings(val);
    });

    // جلب الإعلانات
    onValue(ref(db, 'ads'), (snap) => {
      const data = snap.val();
      setAds(data ? Object.values(data) : []);
    });

    // جلب البرامج المقترحة
    onValue(ref(db, 'programs'), (snap) => {
      const data = snap.val();
      setPrograms(data ? Object.values(data) : []);
    });

    // جلب المحتوى التعليمي
    onValue(ref(db, 'content'), (snap) => {
      const data = snap.val();
      setContent(data || {});
    });

    return () => unsub();
  }, [theme]);

  // تسجيل دخول الأدمن (حسب طلبك: اسم مستخدم وباسورد محددين)
  const handleAdminLogin = (u: string, p: string) => {
    onValue(ref(db, 'adminSettings'), (snap) => {
      const val = snap.val() || {};
      // نتأكد من وجود قيم افتراضية في حالة عدم وجود البيانات في قاعدة البيانات
      // أو في حالة وجود الباسورد فقط (إذا تم تغييره سابقاً)
      const settings = { 
        user: val.user || 'admin', 
        pass: val.pass || 'admin' 
      };
      
      if (u === settings.user && p === settings.pass) {
        setIsAdmin(true);
        setCurrentView('admin');
      } else {
        alert('بيانات الدخول غير صحيحة، حاول admin/admin');
      }
    }, { onlyOnce: true });
  };

  const changeTheme = () => {
    const themes = ['default', 'dark', 'nature', 'sunset', 'ocean'];
    const currentIdx = themes.indexOf(theme);
    setTheme(themes[(currentIdx + 1) % themes.length]);
  };

  // الخلفية البيضاء وقت الشرح
  const containerClass = generatedExplanation 
    ? 'min-h-screen flex flex-col text-right bg-white text-black' 
    : 'min-h-screen flex flex-col text-right';

  return (
    <div className={containerClass}>
      {/* شريط الإعلانات المتحرك */}
      {ads.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-yellow-500 text-white h-10 flex items-center overflow-hidden relative shadow-lg z-40">
          <div className="ticker-wrap w-full">
            <div className="ticker-content flex gap-16 items-center">
              {ads.map((ad, idx) => (
                <a key={idx} href={ad.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline cursor-pointer group">
                  {ad.image && <img src={ad.image} alt="icon" className="w-6 h-6 rounded-full object-cover border border-white"/>}
                  <span className="font-bold text-sm md:text-base group-hover:text-yellow-200">{ad.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* الهيدر العلوي */}
      <header className={`p-4 flex justify-between items-center glass-header sticky top-0 z-30 ${generatedExplanation ? 'bg-white text-black border-b' : 'text-white'}`}>
        <div className="flex items-center gap-4">
          <Clock />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold drop-shadow-md">{appSettings.name}</h1>
        
        <div className="flex items-center gap-3">
          <button onClick={changeTheme} title="تغيير الثيم" className={`p-2 rounded-full transition ${generatedExplanation ? 'bg-gray-200 hover:bg-gray-300' : 'glass hover:bg-white/20'}`}>
            <Layout size={20} />
          </button>
          
          {isAdmin ? (
            <button onClick={() => { setIsAdmin(false); setCurrentView('home'); }} className="p-2 glass rounded-full bg-red-500/80 hover:bg-red-600 text-white flex gap-2 px-4 items-center text-sm">
              <LogOut size={16} /> خروج أدمن
            </button>
          ) : (
            <div className="flex gap-2">
              {!user ? (
                <>
                  <button onClick={() => setCurrentView('login')} className="px-4 py-1 glass rounded-full hover:bg-white/20 text-sm">دخول</button>
                  <button onClick={() => setCurrentView('register')} className="px-4 py-1 glass rounded-full bg-blue-500/40 hover:bg-blue-500/60 text-sm">تسجيل</button>
                  <button onClick={() => setCurrentView('adminLogin')} className="px-3 py-1 glass rounded-full text-xs opacity-70 hover:opacity-100 flex items-center gap-1"><Lock size={12}/> أدمن</button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded-lg">{user.email?.split('@')[0]}</span>
                  <button onClick={() => auth.signOut()} className="p-1 glass rounded-full hover:bg-red-500/50"><LogOut size={14}/></button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden relative">
        
        {/* القائمة الجانبية للأدمن */}
        {isAdmin && currentView.startsWith('admin') && (
          <aside className="w-full md:w-64 glass p-4 flex flex-col gap-3 h-fit md:h-full animate-fade-in shrink-0">
            <div className="font-bold text-xl text-center border-b pb-2 border-white/20 mb-2">لوحة التحكم</div>
            <button onClick={() => setCurrentView('admin')} className={`flex items-center gap-2 p-3 rounded transition ${currentView === 'admin' ? 'bg-white/30 font-bold' : 'hover:bg-white/10'}`}>
                <Layers size={18}/> المحتوى التعليمي
            </button>
            <button onClick={() => setCurrentView('admin_ads')} className={`flex items-center gap-2 p-3 rounded transition ${currentView === 'admin_ads' ? 'bg-white/30 font-bold' : 'hover:bg-white/10'}`}>
                <Monitor size={18}/> الإعلانات
            </button>
            <button onClick={() => setCurrentView('admin_programs')} className={`flex items-center gap-2 p-3 rounded transition ${currentView === 'admin_programs' ? 'bg-white/30 font-bold' : 'hover:bg-white/10'}`}>
                <FileText size={18}/> البرامج المقترحة
            </button>
            <button onClick={() => setCurrentView('admin_settings')} className={`flex items-center gap-2 p-3 rounded transition ${currentView === 'admin_settings' ? 'bg-white/30 font-bold' : 'hover:bg-white/10'}`}>
                <Settings size={18}/> الإعدادات والأمان
            </button>
          </aside>
        )}

        {/* منطقة العرض المتغيرة */}
        <div className={`flex-1 ${generatedExplanation ? 'bg-white text-black p-8 rounded-lg shadow-xl border border-gray-200' : 'glass p-6'} overflow-y-auto custom-scrollbar relative transition-all duration-300`}>
          
          {/* زر إغلاق الشرح */}
          {generatedExplanation && (
             <button onClick={() => setGeneratedExplanation('')} className="absolute top-4 left-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full z-10 shadow-lg flex items-center gap-2 px-4">
                 <X size={20}/> إغلاق الشرح
             </button>
          )}

          {/* عرض المستخدم العادي */}
          {currentView === 'home' && (
            <UserView 
              content={content} 
              onExplain={(text) => setGeneratedExplanation(text)}
              setLoadingAI={setLoadingAI}
              loadingAI={loadingAI}
            />
          )}

          {/* عروض الأدمن */}
          {currentView === 'admin' && isAdmin && <AdminContentManager content={content} />}
          {currentView === 'admin_ads' && isAdmin && <AdminAdsManager />}
          {currentView === 'admin_programs' && isAdmin && <AdminProgramsManager />}
          {currentView === 'admin_settings' && isAdmin && <AdminSettingsManager currentName={appSettings.name} currentWhatsapp={appSettings.whatsapp} />}

          {/* نماذج التسجيل والدخول */}
          {currentView === 'login' && <AuthForm type="login" onSuccess={() => setCurrentView('home')} />}
          {currentView === 'register' && <AuthForm type="register" onSuccess={() => setCurrentView('home')} />}
          {currentView === 'adminLogin' && <AdminLoginForm onLogin={handleAdminLogin} />}

          {/* منطقة عرض الشرح المولد بالذكاء الاصطناعي */}
          {generatedExplanation && (
             <div className="mt-8 max-w-4xl mx-auto animate-fade-in" dir="rtl">
                <div className="prose lg:prose-xl max-w-none text-right">
                    <div dangerouslySetInnerHTML={{ __html: generatedExplanation }} />
                </div>
                <div className="mt-12 border-t pt-6 flex items-center gap-2 text-gray-500">
                  <Monitor size={20} className="text-blue-500"/>
                  <span className="text-sm font-semibold">تم توليد هذا الشرح بواسطة الذكاء الاصطناعي (Gemini)</span>
                </div>
             </div>
          )}
          
          {/* شاشة التحميل */}
          {loadingAI && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-50 rounded-lg backdrop-blur-sm text-white animate-fade-in">
              <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                  <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-4 border-b-4 border-purple-500 animate-spin opacity-50" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              </div>
              <p className="text-xl font-bold animate-pulse">جاري تحضير الشرح بالذكاء الاصطناعي...</p>
              <p className="text-sm opacity-80 mt-2">يرجى الانتظار قليلاً</p>
            </div>
          )}

        </div>
      </main>

      {/* الفوتر */}
      <footer className="glass m-4 p-4 mt-0 shrink-0">
        {/* البرامج المقترحة */}
        {programs.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-sm"><Book size={16}/> برامج مقترحة من المصمم</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {programs.map((prog, i) => (
                <a key={i} href={prog.link} target="_blank" className="min-w-[100px] flex flex-col items-center gap-2 p-2 glass hover:bg-white/20 rounded-xl transition group">
                  <img src={prog.thumb || 'https://via.placeholder.com/60'} alt={prog.name} className="w-14 h-14 rounded-lg object-cover bg-white/50 shadow-md group-hover:scale-105 transition"/>
                  <span className="text-xs font-bold text-center truncate w-full">{prog.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center text-sm opacity-80 border-t border-white/10 pt-2 gap-2">
          <div>المطور: <span className="font-bold text-accent-color text-lg mx-1">Amir Lamay</span></div>
          <div className="flex gap-4 items-center">
            {appSettings.whatsapp && (
              <a href={`https://wa.me/${appSettings.whatsapp}`} target="_blank" className="flex items-center gap-1 hover:text-green-400 font-bold bg-white/10 px-2 py-1 rounded-full">
                 <MessageCircle size={14}/> واتساب
              </a>
            )}
            <span>© 2024 جميع الحقوق محفوظة</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- المكونات الفرعية ---

const UserView = ({ content, onExplain, setLoadingAI, loadingAI }) => {
  const [stage, setStage] = useState('الابتدائية');
  const [grade, setGrade] = useState('الأول');
  const [subject, setSubject] = useState('');
  
  const STAGES = ['الابتدائية', 'الاعدادية', 'الثانوية'];
  const GRADES_PRI = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  const GRADES_OTH = ['الأول', 'الثاني', 'الثالث'];
  
  const currentGrades = stage === 'الابتدائية' ? GRADES_PRI : GRADES_OTH;
  
  const dbSubjects = content?.[stage]?.[grade] ? Object.keys(content[stage][grade]) : [];
  const defaultSubjects = ['اللغة العربية', 'اللغة الانجليزية', 'الرياضيات', 'التاريخ', 'الجغرافيا', 'العلوم'];
  const allSubjects = Array.from(new Set([...defaultSubjects, ...dbSubjects]));

  const currentData = content?.[stage]?.[grade]?.[subject] || {};

  const handleAIExplain = async (type: string) => {
    if (!subject) return alert("يرجى اختيار المادة أولاً");
    setLoadingAI(true);
    try {
        let prompt = "";
        const context = `المادة: ${subject}، الصف: ${grade}، المرحلة: ${stage}.`;
        
        if (type === 'general') {
            prompt = `اشرح لي منهج ${context} بشكل تفاعلي ومبسط مع ذكر الأمثلة وتقسيم الشرح إلى نقاط واضحة.`;
        } else if (type === 'review') {
            prompt = `أعطني مراجعة نهائية وشاملة لـ ${context} في شكل ملخص لأهم النقاط والقوانين والتعريفات.`;
        } else if (type === 'exam') {
             prompt = `اكتب لي اختباراً قصيراً (Quiz) لـ ${context} مكون من 5 أسئلة اختيار من متعدد مع الإجابات النموذجية في النهاية لتحديد المستوى.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "أنت معلم ذكي ومحترف. قم بتنسيق الإجابة باستخدام HTML tags بسيطة مثل <h2> للعناوين الرئيسية، <h3> للعناوين الفرعية، <ul> و <li> للقوائم، و <p> للفقرات. اجعل الشرح ملوناً وجذاباً باستخدام inline styles عند الحاجة. الخلفية ستكون بيضاء، فاستخدم ألوان نص داكنة.",
            }
        });
        
        const text = (await response).text;
        onExplain(text);
    } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي، يرجى المحاولة لاحقاً.");
    } finally {
        setLoadingAI(false);
    }
  };

  const handleExtractExplain = async (url: string, label: string) => {
    setLoadingAI(true);
    try {
        const prompt = `الرابط التالي يحتوي على مادة تعليمية (${label}) لمادة ${subject}: ${url} \n قم بتوقع محتوى هذا الملف وتلخيص أهم ما قد يحتويه من دروس ونقاط بناءً على اسم المادة والصف الدراسي.`;
        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
        });
        onExplain(`<h2>شرح مستخرج من: ${label}</h2>` + (await response).text);
    } catch(e) {
        handleAIExplain('general');
    } finally {
        setLoadingAI(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="text-center mb-4">
         <h2 className="text-2xl font-bold mb-2">اختر مرحلتك الدراسية</h2>
         <p className="opacity-70">ابدأ رحلتك التعليمية باختيار الصف والمادة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass p-6 rounded-xl">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm flex items-center gap-1"><Layers size={14}/> المرحلة</label>
          <select value={stage} onChange={e => setStage(e.target.value)} className="p-3 rounded-lg font-bold">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm flex items-center gap-1"><Book size={14}/> الصف</label>
          <select value={grade} onChange={e => setGrade(e.target.value)} className="p-3 rounded-lg font-bold">
            {currentGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm flex items-center gap-1"><FileText size={14}/> المادة</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} className="p-3 rounded-lg font-bold">
            <option value="">-- اختر المادة --</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {subject && (
        <div className="glass bg-white/5 p-6 rounded-xl animate-scale-up shadow-2xl border border-white/10">
           <h2 className="text-2xl font-bold mb-6 text-center border-b border-white/20 pb-4">
             {subject} <span className="text-accent-color mx-2">|</span> {grade} <span className="text-xs opacity-60">({stage})</span>
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* قسم الملفات */}
              <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Upload size={18}/> المحتوى التعليمي</h3>
                  
                  {['term1pdf', 'term2pdf'].map((key, idx) => {
                      const url = currentData[key];
                      const label = idx === 0 ? "ملخص الترم الأول" : "ملخص الترم الثاني";
                      if(!url) return null;
                      return (
                        <div key={key} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition gap-4">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-red-500 rounded-lg text-white"><FileText size={20}/></div>
                               <span className="font-bold">{label}</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <a href={url} target="_blank" className="flex-1 sm:flex-none p-2 bg-blue-600 rounded text-white text-sm hover:bg-blue-700 text-center flex items-center justify-center gap-1"><ExternalLink size={14}/> فتح</a>
                                <button onClick={() => handleExtractExplain(url, label)} className="flex-1 sm:flex-none p-2 bg-purple-600 rounded text-white text-sm hover:bg-purple-700 flex items-center justify-center gap-1"><Monitor size={14}/> شرح</button>
                            </div>
                        </div>
                      );
                  })}

                  {!currentData.term1pdf && !currentData.term2pdf && (
                      <div className="text-center opacity-60 py-8 border-2 border-dashed border-white/20 rounded-lg">
                          لا يوجد ملفات PDF مضافة لهذه المادة بعد.
                          <br/>يمكنك استخدام الشرح الذكي بالأسفل.
                      </div>
                  )}
              </div>

              {/* قسم الذكاء الاصطناعي */}
              <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-r md:pr-6 border-white/10 pt-6 md:pt-0">
                 <h3 className="font-bold text-lg flex items-center gap-2"><Monitor size={18}/> المعلم الذكي</h3>
                 
                 <button onClick={() => handleAIExplain('general')} className="glass p-5 rounded-xl hover:bg-white/30 text-right flex items-center justify-between transition group border border-white/20 bg-gradient-to-r from-blue-500/20 to-transparent">
                    <div>
                        <div className="font-bold text-lg group-hover:text-blue-200 transition">شرح شامل للمادة</div>
                        <div className="text-xs opacity-70 mt-1">شرح تفاعلي لجميع دروس المادة مدعوم بالذكاء الاصطناعي</div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full"><Monitor className="group-hover:scale-110 transition text-blue-300" /></div>
                 </button>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => handleAIExplain('review')} className="glass p-4 rounded-xl hover:bg-green-500/20 text-center font-bold text-sm flex flex-col items-center gap-2 transition">
                        <CheckCircle size={24} className="text-green-400"/>
                        مراجعة نهائية
                     </button>
                     <button onClick={() => handleAIExplain('exam')} className="glass p-4 rounded-xl hover:bg-orange-500/20 text-center font-bold text-sm flex flex-col items-center gap-2 transition">
                        <Edit size={24} className="text-orange-400"/>
                        تحديد مستوى
                     </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- لوحات تحكم الأدمن ---

const AdminContentManager = ({ content }) => {
    const [stage, setStage] = useState('الابتدائية');
    const [grade, setGrade] = useState('الأول');
    const [subject, setSubject] = useState('');
    const [newSubject, setNewSubject] = useState('');
    
    const [term1, setTerm1] = useState('');
    const [term2, setTerm2] = useState('');

    const STAGES = ['الابتدائية', 'الاعدادية', 'الثانوية'];
    const GRADES_PRI = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
    const GRADES_OTH = ['الأول', 'الثاني', 'الثالث'];
    
    // قائمة المواد الافتراضية
    const SUBJECTS_DEF = ['اللغة العربية', 'اللغة الانجليزية', 'اللغة الألمانية', 'اللغة الفرنسية', 'التاريخ', 'الجغرافيا', 'الرياضيات', 'الهندسة', 'الفيزياء', 'الكيمياء', 'الأحياء'];
    const currentGrades = stage === 'الابتدائية' ? GRADES_PRI : GRADES_OTH;
    
    // تحميل البيانات عند التغيير
    useEffect(() => {
        if(stage && grade && subject) {
            const data = content?.[stage]?.[grade]?.[subject] || {};
            setTerm1(data.term1pdf || '');
            setTerm2(data.term2pdf || '');
        }
    }, [stage, grade, subject, content]);

    const handleSave = () => {
        if (!subject) return alert("اختر المادة");
        const path = `content/${stage}/${grade}/${subject}`;
        update(ref(db, path), {
            term1pdf: term1,
            term2pdf: term2
        }).then(() => alert("تم حفظ البيانات بنجاح!"));
    };
    
    const handleUpload = async (e: any, term: number) => {
        const file = e.target.files[0];
        if (!file) return;
        const storageRef = sRef(storage, `pdfs/${Date.now()}_${file.name}`);
        try {
            alert("جاري الرفع... يرجى الانتظار");
            const snap = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snap.ref);
            if(term === 1) setTerm1(url);
            else setTerm2(url);
            alert("تم رفع الملف بنجاح");
        } catch (err) {
            console.error(err);
            alert("فشل الرفع: تأكد من الاتصال بالإنترنت");
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Layers/> إدارة المحتوى التعليمي</h2>
            
            <div className="glass p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="font-bold">المرحلة</label>
                    <select value={stage} onChange={e=>setStage(e.target.value)} className="p-3 rounded-lg font-bold">
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-bold">الصف</label>
                    <select value={grade} onChange={e=>setGrade(e.target.value)} className="p-3 rounded-lg font-bold">
                        {currentGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="font-bold">المادة</label>
                    <select value={subject} onChange={e=>setSubject(e.target.value)} className="p-3 rounded-lg font-bold">
                        <option value="">-- اختر --</option>
                        {SUBJECTS_DEF.map(s => <option key={s} value={s}>{s}</option>)}
                        <option disabled>---</option>
                        {/* المواد المضافة يدويا يمكن تحميلها هنا أيضا إذا لزم الأمر */}
                    </select>
                    
                    <div className="flex gap-2 mt-2">
                        <input placeholder="إضافة مادة أخرى..." value={newSubject} onChange={e=>setNewSubject(e.target.value)} className="p-2 text-sm rounded flex-1"/>
                        <button onClick={()=>{ if(newSubject) { setSubject(newSubject); alert(`تم اختيار المادة الجديدة: ${newSubject}`); }}} className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"><Plus size={16}/></button>
                    </div>
                 </div>
            </div>

            {subject && (
                <div className="glass p-6 rounded-xl animate-fade-in space-y-6 bg-white/5 border border-white/10">
                     <div className="flex justify-between items-center border-b border-white/20 pb-4">
                        <h3 className="font-bold text-xl text-accent-color">{subject} - {grade}</h3>
                     </div>
                     
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <label className="block mb-3 font-bold text-lg flex items-center gap-2"><FileText size={18}/> ملخص الترم الأول</label>
                            <input type="text" placeholder="رابط ملف PDF مباشر..." value={term1} onChange={e=>setTerm1(e.target.value)} className="w-full p-3 rounded-lg mb-4 text-sm font-mono" dir="ltr"/>
                            
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg transition">
                                    <Upload size={16}/> <span>رفع ملف PDF</span>
                                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleUpload(e, 1)}/>
                                </label>
                                {term1 && <a href={term1} target="_blank" className="text-blue-400 hover:underline text-sm">معاينة الملف</a>}
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <label className="block mb-3 font-bold text-lg flex items-center gap-2"><FileText size={18}/> ملخص الترم الثاني</label>
                            <input type="text" placeholder="رابط ملف PDF مباشر..." value={term2} onChange={e=>setTerm2(e.target.value)} className="w-full p-3 rounded-lg mb-4 text-sm font-mono" dir="ltr"/>
                            
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg transition">
                                    <Upload size={16}/> <span>رفع ملف PDF</span>
                                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleUpload(e, 2)}/>
                                </label>
                                {term2 && <a href={term2} target="_blank" className="text-blue-400 hover:underline text-sm">معاينة الملف</a>}
                            </div>
                        </div>
                     </div>
                     
                     <div className="flex justify-end pt-4 border-t border-white/10">
                        <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white py-3 px-10 rounded-xl font-bold shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                           <CheckCircle size={20}/> حفظ التغييرات
                        </button>
                     </div>
                </div>
            )}
        </div>
    );
};

const AdminAdsManager = () => {
    const [ads, setAds] = useState([]);
    const [form, setForm] = useState({ title: '', image: '', duration: '1', link: '' });

    useEffect(() => {
        onValue(ref(db, 'ads'), s => setAds(s.val() ? Object.entries(s.val()) : []));
    }, []);

    const saveAd = () => {
        if(!form.title || !form.link) return alert("الرجاء إكمال البيانات");
        push(ref(db, 'ads'), form).then(() => {
            setForm({ title: '', image: '', duration: '1', link: '' });
            alert("تم نشر الإعلان");
        });
    };

    const deleteAd = (id) => {
        if(confirm("هل أنت متأكد من حذف هذا الإعلان؟")) remove(ref(db, `ads/${id}`));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Monitor/> إدارة شريط الإعلانات</h2>
            <div className="glass p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 border border-white/20">
                 <input placeholder="عنوان الإعلان" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="p-3 rounded-lg"/>
                 <input placeholder="رابط الصورة (URL)" value={form.image} onChange={e=>setForm({...form, image: e.target.value})} className="p-3 rounded-lg" dir="ltr"/>
                 <input placeholder="الرابط المستهدف عند النقر" value={form.link} onChange={e=>setForm({...form, link: e.target.value})} className="p-3 rounded-lg" dir="ltr"/>
                 <select value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})} className="p-3 rounded-lg font-bold">
                     {[...Array(15)].map((_, i) => <option key={i} value={i+1}>{i+1} يوم</option>)}
                 </select>
                 <button onClick={saveAd} className="col-span-1 md:col-span-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500 font-bold shadow-lg transition">تأكيد ونشر الإعلان في الشريط العلوي</button>
            </div>
            
            <div className="grid gap-3">
                <h3 className="font-bold opacity-80">الإعلانات الحالية:</h3>
                {ads.length === 0 && <p className="opacity-50 text-sm">لا توجد إعلانات حالياً.</p>}
                {ads.map(([id, ad]: any) => (
                    <div key={id} className="glass p-4 flex justify-between items-center rounded-lg hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                             {ad.image && <img src={ad.image} className="w-12 h-12 rounded-lg object-cover border border-white/20"/>}
                             <div>
                                 <div className="font-bold">{ad.title}</div>
                                 <div className="text-xs opacity-60 flex gap-2">
                                     <span>المدة: {ad.duration} يوم</span>
                                     <a href={ad.link} target="_blank" className="hover:text-blue-400">الرابط</a>
                                 </div>
                             </div>
                        </div>
                        <button onClick={()=>deleteAd(id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition"><Trash size={20}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminProgramsManager = () => {
    const [progs, setProgs] = useState([]);
    const [form, setForm] = useState({ name: '', thumb: '', link: '' });

    useEffect(() => {
        onValue(ref(db, 'programs'), s => setProgs(s.val() ? Object.entries(s.val()) : []));
    }, []);

    const save = () => {
        if(!form.name || !form.link) return alert("أكمل البيانات");
        push(ref(db, 'programs'), form).then(() => {
            setForm({ name: '', thumb: '', link: '' });
            alert("تم إضافة البرنامج");
        });
    };

    const del = (id) => {
        if(confirm("حذف؟")) remove(ref(db, `programs/${id}`));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Book/> إدارة البرامج المقترحة</h2>
            <div className="glass p-6 rounded-xl grid gap-4 border border-white/20">
                 <input placeholder="اسم البرنامج" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="p-3 rounded-lg"/>
                 <input placeholder="رابط الصورة المصغرة (URL)" value={form.thumb} onChange={e=>setForm({...form, thumb: e.target.value})} className="p-3 rounded-lg" dir="ltr"/>
                 <input placeholder="رابط البرنامج" value={form.link} onChange={e=>setForm({...form, link: e.target.value})} className="p-3 rounded-lg" dir="ltr"/>
                 <button onClick={save} className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-500 font-bold shadow-lg transition">إضافة للقائمة السفلية</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {progs.map(([id, p]: any) => (
                    <div key={id} className="glass p-3 flex flex-col items-center gap-2 relative rounded-xl group hover:bg-white/10 transition">
                        <button onClick={()=>del(id)} className="absolute top-2 left-2 text-white bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
                        <img src={p.thumb || 'https://via.placeholder.com/100'} className="w-full h-32 object-cover rounded-lg bg-black/20"/>
                        <span className="font-bold text-sm text-center line-clamp-2">{p.name}</span>
                        <a href={p.link} target="_blank" className="text-xs text-blue-300 hover:text-blue-100">زيارة</a>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminSettingsManager = ({ currentName, currentWhatsapp }) => {
    const [name, setName] = useState(currentName);
    const [whatsapp, setWhatsapp] = useState(currentWhatsapp);
    const [newPass, setNewPass] = useState('');

    const saveMain = () => {
        update(ref(db, 'settings'), { name, whatsapp }).then(()=>alert("تم تحديث إعدادات التطبيق"));
    };

    const savePass = () => {
        if(!newPass) return;
        update(ref(db, 'adminSettings'), { pass: newPass }).then(()=> {
            alert("تم تغيير كلمة سر الأدمن بنجاح");
            setNewPass('');
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Settings/> الإعدادات العامة</h2>
            
            <div className="glass p-6 rounded-xl space-y-4 border border-white/20">
                 <h3 className="text-lg font-bold border-b border-white/10 pb-2">بيانات التطبيق</h3>
                 <div>
                    <label className="block mb-2 text-sm opacity-80">اسم البرنامج (يظهر في الأعلى)</label>
                    <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 rounded-lg"/>
                 </div>
                 <div>
                    <label className="block mb-2 text-sm opacity-80">رقم واتساب للدعم (مع كود الدولة)</label>
                    <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="مثال: 201000000000" className="w-full p-3 rounded-lg" dir="ltr"/>
                 </div>
                 <button onClick={saveMain} className="bg-green-600 text-white p-3 px-8 rounded-lg font-bold shadow hover:bg-green-700 transition">حفظ التعديلات</button>
            </div>

            <div className="glass p-6 rounded-xl space-y-4 border border-red-500/30 bg-red-500/5">
                 <h3 className="text-xl font-bold text-red-300 flex items-center gap-2"><Lock size={20}/> المنطقة الأمنة</h3>
                 <div>
                    <label className="block mb-2 text-sm opacity-80">تغيير كلمة مرور الأدمن</label>
                    <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="اكتب كلمة المرور الجديدة" className="w-full p-3 rounded-lg"/>
                 </div>
                 <button onClick={savePass} className="bg-red-600 text-white p-3 px-8 rounded-lg font-bold shadow hover:bg-red-700 transition">تغيير كلمة السر</button>
            </div>
        </div>
    );
};

// --- نماذج الدخول ---

const AuthForm = ({ type, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [err, setErr] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            if (type === 'login') {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                await createUserWithEmailAndPassword(auth, email, pass);
            }
            onSuccess();
        } catch (error: any) {
            setErr("حدث خطأ: " + error.message);
        }
    };

    return (
        <div className="flex justify-center items-center h-full min-h-[50vh]">
            <form onSubmit={handleSubmit} className="glass p-8 rounded-2xl w-full max-w-md flex flex-col gap-5 animate-scale-up shadow-2xl border border-white/30">
                <div className="text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{type === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
                    <p className="text-sm opacity-60">مرحباً بك في منصة المتميزون</p>
                </div>
                
                <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)} className="p-4 rounded-xl" required dir="ltr"/>
                <input type="password" placeholder="كلمة المرور" value={pass} onChange={e=>setPass(e.target.value)} className="p-4 rounded-xl" required dir="ltr"/>
                
                {err && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">{err}</p>}
                
                <button type="submit" className="bg-accent-color text-white p-4 rounded-xl font-bold hover:brightness-110 transition shadow-lg mt-2">
                    {type === 'login' ? 'دخول' : 'تسجيل حساب جديد'}
                </button>
            </form>
        </div>
    );
};

const AdminLoginForm = ({ onLogin }) => {
    const [u, setU] = useState('');
    const [p, setP] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(u, p);
    };

    return (
        <div className="flex justify-center items-center h-full min-h-[50vh]">
            <form onSubmit={handleSubmit} className="glass p-8 rounded-2xl w-full max-w-md flex flex-col gap-5 animate-scale-up border-2 border-red-500/30 shadow-2xl bg-gradient-to-b from-red-900/10 to-transparent">
                <div className="text-center">
                     <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-red-200">لوحة تحكم الأدمن</h2>
                    <p className="text-sm opacity-60">يقتصر الدخول على المشرفين فقط</p>
                </div>
                
                <input placeholder="اسم المستخدم" value={u} onChange={e=>setU(e.target.value)} className="p-4 rounded-xl" dir="ltr"/>
                <input type="password" placeholder="كلمة المرور" value={p} onChange={e=>setP(e.target.value)} className="p-4 rounded-xl" dir="ltr"/>
                
                <button type="submit" className="bg-red-600 text-white p-4 rounded-xl font-bold hover:bg-red-700 transition shadow-lg mt-2">
                    دخول
                </button>
            </form>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);