/* ===============================
   共通：スムーズスクロール/バインド
   =============================== */
const smoothScrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const bindClickToScroll = (btnId, targetId) => {
  const el = document.getElementById(btnId);
  if (!el) return;
  el.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScrollTo(targetId);
  });
};


/* ===============================
   ヘッダー内（ロゴ/右端ボタン）は個別バインド
   ※ ナビ内リンクは委譲で処理するのでここでは付けない
   =============================== */
// ロゴ → トップ
bindClickToScroll('scrollTohero', 'top');
// 右端のお問い合わせボタン
bindClickToScroll('scrollToform', 'form');


/* ===============================
   フッターのリンク類（個別バインド）
   =============================== */
bindClickToScroll('scrollToworks2',    'works');
bindClickToScroll('scrollToproducts2', 'products');
bindClickToScroll('scrollTomember2',   'member');
bindClickToScroll('scrollTocompany2',  'company');
bindClickToScroll('scrollToform2',     'form');
bindClickToScroll('scrollToform3',     'form'); // モバイル用CTA


/* ===============================
   フォーム送信（ハニーポット/サンキュー表示）
   =============================== */
function handleSubmit(e){
  const f = e.target;
  if (f.querySelector('[name="hp_name"]').value) {
    alert('送信エラー'); return false;
  }
  const btn = f.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = '送信中…';
  setTimeout(()=>{
    btn.disabled = false; btn.textContent = '送信';
    f.reset();
    const t = document.getElementById('thanks');
    if (t) t.style.display = 'block';
  }, 800);
  return true;
}

/* ===============================
   ヘッダーのスクロール連動（角丸→フラット）
   ・ヒーロー（PC/モバイル）の下端を閾値に
   ・ヘッダースペーサーでレイアウトジャンプ抑制
   =============================== */
(function () {
  const header = document.querySelector('header.topbar');
  if (!header) return;

  let spacer = document.getElementById('header-spacer');
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.id = 'header-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    header.insertAdjacentElement('afterend', spacer);
  }

  const getHeroThreshold = () => {
    const candidates = [
      document.querySelector('.hero'),
      document.querySelector('.herom'),
      document.querySelector('.herobg')
    ].filter(Boolean);
    if (!candidates.length) return 0;
    return Math.max(...candidates.map(el => el.offsetTop + el.offsetHeight));
  };

  const setSpacerHeight = () => {
    const rect = header.getBoundingClientRect();
    const cs   = getComputedStyle(header);
    const mt   = parseFloat(cs.marginTop) || 0;
    spacer.style.height = `${rect.height + mt}px`;
    // scroll-margin-top の補助となるCSS変数も更新
    document.documentElement.style.setProperty('--header-h', `${rect.height}px`);
  };

  const applyState = () => {
    const shouldScrolled = window.scrollY > getHeroThreshold() - 10;
    if (shouldScrolled !== header.classList.contains('scrolled')) {
      header.classList.toggle('scrolled', shouldScrolled);
      requestAnimationFrame(setSpacerHeight);
    }
  };

  window.addEventListener('load',   () => { setSpacerHeight(); applyState(); });
  window.addEventListener('resize', () => { setSpacerHeight(); applyState(); });
  window.addEventListener('scroll', applyState, { passive: true });

  if ('ResizeObserver' in window) {
    new ResizeObserver(setSpacerHeight).observe(header);
  }
})();


/* ===============================
   スクロールで .fade-in を表示
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll('.fade-in');
  if (!('IntersectionObserver' in window)) {
    // フォールバック
    targets.forEach(el => el.classList.add('show'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  targets.forEach(target => observer.observe(target));
});


/* ===============================
   モバイルナビ（ハンバーガー）
   ・メニュー開閉時のスクロールロック
   ・ナビ内リンクは委譲で一元処理（←二重スクロール対策）
   =============================== */
(function(){
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primaryNav');
  if(!btn || !nav) return;

  let scrollY = 0;
  const lockScroll = () => {
    scrollY = window.pageYOffset;
    document.body.classList.add('no-scroll');
    document.body.style.position = 'fixed';
    document.body.style.top      = `-${scrollY}px`;
    document.body.style.left     = '0';
    document.body.style.right    = '0';
    document.body.style.width    = '100%';
  };
  const unlockScroll = () => {
    document.body.classList.remove('no-scroll');
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.left     = '';
    document.body.style.right    = '';
    document.body.style.width    = '';
    window.scrollTo(0, scrollY);
  };

  // ハンバーガー開閉
  btn.addEventListener('click', ()=>{
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
    if (!open) lockScroll(); else unlockScroll();
  });

  // ナビ内リンクの委譲（クリック1回で閉じる＋スクロール）
  const idMap = {
    scrollToworks: 'works',
    scrollToproducts: 'products',
    scrollTomember: 'member',
    scrollTocompany: 'company',
    scrollToform: 'form',
    scrollToform_nav: 'form'
  };

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;

    const targetId = idMap[a.id];
    if (!targetId) return;       // 通常のリンクはスルー

    e.preventDefault();

    const isOpen = btn.getAttribute('aria-expanded') === 'true' ||
                   document.body.classList.contains('no-scroll');

    if (isOpen) {
      // ドロワーを閉じてからスクロール
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      unlockScroll();

      requestAnimationFrame(() => {
        setTimeout(() => smoothScrollTo(targetId), 0);
      });
    } else {
      // デスクトップ時はそのままスクロール
      smoothScrollTo(targetId);
    }
  });
})();
