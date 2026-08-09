import './style.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Часы
function updateTime() {
  const timeElement = document.getElementById('live-time');
  if (!timeElement) return;
  const now = new Date();
  const options = {
    timeZone: 'Europe/Warsaw',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  timeElement.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
}
updateTime();
setInterval(updateTime, 1000);

// Видео
const video = document.querySelector('video');
if (video) {
  video.addEventListener('timeupdate', () => {
    if (video.currentTime >= 30) {
      video.currentTime = 4;
      video.play();
    }
  });
}

// ========== LENIS ==========
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

lenis.on('scroll', () => ScrollTrigger.update());

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ========== АНИМАЦИЯ ==========
const zoomSection = document.getElementById('zoom-section');
const imageWrapper = document.getElementById('zoom-image-wrapper');
const firstText = document.getElementById('zoom-text-first');
const secondText = document.getElementById('zoom-text-second');
const overlay = document.getElementById('zoom-overlay');
const cardsStack = document.getElementById('cards-stack');
const cards = gsap.utils.toArray('.card-item');
const currentSlide = document.getElementById('current-slide');

// Начальные размеры
gsap.set(imageWrapper, { width: '24vw', height: '35vh' });

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: zoomSection,
    start: 'top top',
    end: 'bottom bottom',   // скроллим всю высоту 500vh
    scrub: 1,
    // pin: true,           ← УБРАЛИ
  }
});

tl
  .to(firstText, { opacity: 0, y: -50, duration: 1 })
  .to(imageWrapper, {
    width: '100vw',
    height: '100vh',
    borderRadius: 0,
    duration: 2,
    ease: 'none'
  }, '<')
  .to(overlay, { opacity: 1, duration: 1 }, '-=0.8')
  .to(secondText, { opacity: 1, duration: 1 }, '-=0.5')
  .to(cardsStack, { opacity: 1, pointerEvents: 'auto', duration: 0.5 });

// Скрываем все карточки
gsap.set(cards, { opacity: 0, y: 70, scale: 0.94 });

cards.forEach((card, index) => {
  tl.to(card, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 1.2,
    ease: 'power2.out'
  }, `+=0.35`)
  .call(() => {
    if (currentSlide) currentSlide.textContent = index + 1;
  }, null, '<');
});

// ========== ADVANTAGES АНИМАЦИЯ ==========
const advSection = document.getElementById('advantages-section');
const advTexts = gsap.utils.toArray('.adv-text');
const advBrushes = gsap.utils.toArray('.adv-brush');

// Убрали gsap.set. Если скрипт тупанет, всё просто останется видимым.
// перед созданием advTl — верни явный gsap.set (в комментарии видно, что его убрали)
gsap.set(advTexts, { autoAlpha: 0, y: 30 });
const advTl = gsap.timeline({
  scrollTrigger: {
    trigger: advSection,
    start: 'center center',
    end: '+=4000',
    scrub: 1,
    pin: true
  }
});

// Собираем секвенцию: Текст -> Мазок -> Текст -> Мазок
advTexts.forEach((text, i) => {
  // Меняем opacity на autoAlpha для железобетонной отрисовки текста
  advTl.fromTo(text, 
    { autoAlpha: 0, y: 30 }, 
    { autoAlpha: 1, y: 0, ease: 'none', duration: 1 }
  );

  // Мазки остаются как были
  if (advBrushes[i]) {
    advTl.fromTo(advBrushes[i], 
      { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }, 
      { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none', duration: 1 }
    );
  }
});

// ========== SHOWREEL ПЛЕЕР (СИМУЛЯЦИЯ) ==========
const playPauseBtn = document.getElementById('play-pause-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const showreelTime = document.getElementById('showreel-time');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const showreelOverlay = document.getElementById('showreel-overlay');

let isPlaying = true;
let currentTime = 0;
const duration = 60; // Длина заглушки в секундах
let playerInterval;

// Форматирование времени (MM:SS)
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Обновление интерфейса
function updatePlayer() {
  if (currentTime >= duration) {
    currentTime = 0;
    togglePlay(false); // Останавливаем в конце
  }
  
  showreelTime.textContent = formatTime(currentTime);
  const percent = (currentTime / duration) * 100;
  progressBar.style.width = `${percent}%`;
}

// Переключение Play/Pause
function togglePlay(forceState) {
  isPlaying = forceState !== undefined ? forceState : !isPlaying;
  
  if (isPlaying) {
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    // Обновляем таймер каждые 100мс для плавного хода полосы
    playerInterval = setInterval(() => {
      currentTime += 0.1;
      updatePlayer();
    }, 100);
  } else {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    clearInterval(playerInterval);
  }
}

// Слушатели событий клика (кнопка и весь экран)
playPauseBtn?.addEventListener('click', () => togglePlay());
showreelOverlay?.addEventListener('click', () => togglePlay());

// Перемотка кликом по прогресс-бару
progressContainer?.addEventListener('click', (e) => {
  const rect = progressContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;
  currentTime = percent * duration;
  updatePlayer();
});

// Автозапуск при загрузке страницы
if (showreelTime) {
  togglePlay(true);
}

// ========== STEP-BY-STEP PROCESS ==========
const processData = {
  1: {
    title: "BOOKING YOUR SESSION",
    items: [
      "Submit your idea through our online form, including reference images and preferred placement.",
      "Provide details about the estimated size and any specific stylistic requests.",
      "Our management team will review your request and reply within 24–48 hours."
    ]
  },
  2: {
    title: "REVIEW & CONSULTATION",
    items: [
      "We match you with the perfect artist suited to your specific design style.",
      "Discuss sizing, intricate details, and placement options directly with the artist.",
      "Receive a preliminary price estimate and time requirement for the sessions."
    ]
  },
  3: {
    title: "CONFIRMING YOUR APPOINTMENT",
    items: [
      "Choose an available date that fits both your schedule and the artist's availability.",
      "Place a secure deposit to officially lock in your session.",
      "Receive a confirmation email with all necessary preparation details and studio policies."
    ]
  },
  4: {
    title: "TATTOO DESIGN PROCESS",
    items: [
      "Your artist begins drafting the custom design based on your consultation.",
      "We ensure the flow of the design perfectly matches your body's natural anatomy.",
      "Minor adjustments can be made to the concept before the actual session begins."
    ]
  },
  5: {
    title: "PREPARING FOR YOUR SESSION",
    items: [
      "Get plenty of rest the night before and ensure you stay properly hydrated.",
      "Eat a solid, nutritious meal prior to coming to the studio.",
      "Avoid alcohol, excessive caffeine, and blood-thinning medications for 24 hours."
    ]
  },
  6: {
    title: "MEETING AT THE STUDIO",
    items: [
      "Arrive on time, check in at the front desk, and fill out any necessary consent forms.",
      "Review the final stencil design with your artist and confirm the exact size.",
      "The stencil is carefully applied to your skin to ensure perfect placement."
    ]
  },
  7: {
    title: "TATTOOING PROCESS",
    items: [
      "Once all is ready, we'll take care of preparing your skin and the workstation for the session.",
      "A full tattoo session takes around 6 to 9 hours, including time for breaks.",
      "Each session is divided into 1–3 hour intervals with short breaks, helping us maintain top quality and your comfort. Snacks, water, and a meal are included to make the day easier."
    ]
  },
  8: {
    title: "FINAL REVEAL & DOCUMENTATION",
    items: [
      "Check out your healed-looking new tattoo in the mirror.",
      "We take high-quality, professionally lit photos for our studio portfolio.",
      "Receive detailed aftercare instructions and professional wrapping for a safe healing process."
    ]
  }
};

const stepBtns = document.querySelectorAll('.step-btn');
const processTitle = document.getElementById('process-title');
const processList = document.getElementById('process-list');

stepBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // 1. Убираем активный класс у всех кнопок
    stepBtns.forEach(b => {
      b.classList.remove('bg-white', 'text-black', 'active');
      b.classList.add('text-white', 'hover:bg-neutral-900');
    });

    // 2. Добавляем активный класс нажатой кнопке
    btn.classList.add('bg-white', 'text-black', 'active');
    btn.classList.remove('text-white', 'hover:bg-neutral-900');

    // 3. Обновляем контент справа
    const stepId = btn.getAttribute('data-step');
    const data = processData[stepId];

    processTitle.textContent = data.title;
    
    // Перестраиваем список
    processList.innerHTML = '';
    data.items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      processList.appendChild(li);
    });
  });
});

// ========== ОБНОВЛЕНИЕ СКРОЛЛА ==========
// Обязательно: пересчитываем позиции только ПОСЛЕ загрузки всех картинок и шрифтов
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
});

ScrollTrigger.refresh();