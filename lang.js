// lang.js

window.LANGS = {
  ko: {
    home:      '홈 화면 Shorts 숨김',
    subs:      '구독 피드 Shorts 숨김',
    feeds:     '기타 피드 Shorts 숨김',
    recommend: '영상 화면 우측 추천 Shorts 숨김',
    channel:   '채널 페이지 Shorts 숨김',
    search:    '검색 결과 Shorts 숨김',
    redirect:  'Shorts를 일반 동영상 화면으로 리디렉션',
    scrollLock:'Shorts 페이지 스크롤 잠금',
    sidebar:   '사이드바 Shorts 메뉴 숨김'
  },
  en: {
    home:      'Hide Shorts on Home',
    subs:      'Hide Shorts in Subscriptions',
    feeds:     'Hide Shorts in Other Feeds',
    recommend: 'Hide Shorts in Recommendations',
    channel:   'Hide Shorts on Channel Page',
    search:    'Hide Shorts in Search',
    redirect:  'Redirect Shorts to Normal Videos',
    scrollLock:'Lock Scroll on Shorts Page',
    sidebar:   'Hide Shorts in Sidebar'
  },
  ja: {
    home:      'ホーム画面のShortsを非表示',
    subs:      '登録フィードのShortsを非表示',
    feeds:     'その他のフィードのShortsを非表示',
    recommend: '動画画面右側のShortsを非表示',
    channel:   'チャンネルページのShortsを非表示',
    search:    '検索結果のShortsを非表示',
    redirect:  'Shortsを通常動画へリダイレクト',
    scrollLock:'Shortsページのスクロールをロック',
    sidebar:   'サイドバーのShortsメニューを非表示'
  },
  zh: {
    home:      '隐藏首页 Shorts',
    subs:      '在订阅中隐藏 Shorts',
    feeds:     '在其他订阅源隐藏 Shorts',
    recommend: '隐藏视频右侧推荐 Shorts',
    channel:   '在频道页面隐藏 Shorts',
    search:    '在搜索结果中隐藏 Shorts',
    redirect:  '将 Shorts 重定向到普通视频',
    scrollLock:'锁定 Shorts 页面滚动',
    sidebar:   '隐藏侧边栏 Shorts 菜单'
  },
  es: {
    home:      'Ocultar Shorts en Inicio',
    subs:      'Ocultar Shorts en Suscripciones',
    feeds:     'Ocultar Shorts en Otros Feeds',
    recommend: 'Ocultar Shorts en Recomendaciones',
    channel:   'Ocultar Shorts en la Página del Canal',
    search:    'Ocultar Shorts en Búsqueda',
    redirect:  'Redirigir Shorts a Videos Normales',
    scrollLock:'Bloquear Desplazamiento en la Página de Shorts',
    sidebar:   'Ocultar Shorts en la Barra Lateral'
  },
  fr: {
    home:      'Masquer les Shorts sur la page d’accueil',
    subs:      'Masquer les Shorts dans Abonnements',
    feeds:     'Masquer les Shorts dans les autres flux',
    recommend: 'Masquer les Shorts dans les recommandations',
    channel:   'Masquer les Shorts sur la page de chaîne',
    search:    'Masquer les Shorts dans les résultats de recherche',
    redirect:  'Rediriger les Shorts vers les vidéos classiques',
    scrollLock:'Bloquer le défilement sur la page Shorts',
    sidebar:   'Masquer le menu Shorts dans la barre latérale'
  },
  de: {
    home:      'Shorts auf der Startseite ausblenden',
    subs:      'Shorts im Abofeed ausblenden',
    feeds:     'Shorts in anderen Feeds ausblenden',
    recommend: 'Shorts in Empfehlungen ausblenden',
    channel:   'Shorts auf der Kanalseite ausblenden',
    search:    'Shorts in der Suche ausblenden',
    redirect:  'Shorts zu normalen Videos umleiten',
    scrollLock:'Scrollen auf der Shorts-Seite sperren',
    sidebar:   'Shorts-Menü in der Seitenleiste ausblenden'
  },
  pt: {
    home:      'Ocultar Shorts na Página Inicial',
    subs:      'Ocultar Shorts em Inscrições',
    feeds:     'Ocultar Shorts em Outros Feeds',
    recommend: 'Ocultar Shorts em Recomendações',
    channel:   'Ocultar Shorts na Página do Canal',
    search:    'Ocultar Shorts na Pesquisa',
    redirect:  'Redirecionar Shorts para Vídeos Normais',
    scrollLock:'Bloquear Rolagem na Página de Shorts',
    sidebar:   'Ocultar Shorts na Barra Lateral'
  },
  ru: {
    home:      'Скрыть Shorts на главной странице',
    subs:      'Скрыть Shorts в подписках',
    feeds:     'Скрыть Shorts в других лентах',
    recommend: 'Скрыть Shorts в рекомендациях',
    channel:   'Скрыть Shorts на странице канала',
    search:    'Скрыть Shorts в поиске',
    redirect:  'Перенаправлять Shorts на обычные видео',
    scrollLock:'Заблокировать прокрутку на странице Shorts',
    sidebar:   'Скрыть Shorts в боковой панели'
  },
  ar: {
    home:      'إخفاء Shorts في الصفحة الرئيسية',
    subs:      'إخفاء Shorts في الاشتراكات',
    feeds:     'إخفاء Shorts في الخلاصات الأخرى',
    recommend: 'إخفاء Shorts في التوصيات',
    channel:   'إخفاء Shorts في صفحة القناة',
    search:    'إخفاء Shorts في نتائج البحث',
    redirect:  'إعادة توجيه Shorts إلى مقاطع الفيديو العادية',
    scrollLock:'قفل التمرير في صفحة Shorts',
    sidebar:   'إخفاء قائمة Shorts في الشريط الجانبي'
  }
};

function detectLang() {
  const saved = GM_getValue('userLang');
  if (saved && LANGS[saved]) return saved;

  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGS[nav] ? nav : 'en';
}

const labels = LANGS[detectLang()];
