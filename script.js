/* ЧОП «Рыцарь» — интерактив на ванильном JS */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobile-menu');
  if (burger && menu) {
    var toggle = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      toggle(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggle(false); });
    });
  }

  /* ---------- Reveal по скроллу + счётчики ---------- */
  var revealTargets = [
    ['.section-head', 'reveal'],
    ['.service-grid', 'reveal-stagger'],
    ['.guarantee-grid', 'reveal-stagger'],
    ['.process-list', 'reveal-stagger'],
    ['.contact-info', 'reveal'],
    ['.contact-form', 'reveal'],
    ['.stats', 'reveal']
  ];
  revealTargets.forEach(function (pair) {
    document.querySelectorAll(pair[0]).forEach(function (el) {
      el.classList.add(pair[1]);
    });
  });

  var countersStarted = false;

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target.toLocaleString('ru-RU'); return; }
    var start = null, dur = 1400;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('ru-RU');
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        if (entry.target.classList.contains('stats') && !countersStarted) {
          countersStarted = true;
          entry.target.querySelectorAll('[data-count]').forEach(runCounter);
        }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
      el.classList.add('in-view');
    });
    document.querySelectorAll('[data-count]').forEach(runCounter);
  }

  /* ---------- Разворачиваемая сцена направлений ---------- */
  var panel = document.getElementById('services-panel');
  var grid = panel ? panel.querySelector('.service-grid') : null;
  var stage = document.getElementById('service-stage');
  var rail = document.getElementById('service-rail');
  var detail = document.getElementById('service-detail');
  var stageBack = document.getElementById('stage-back');
  var servicesSection = document.getElementById('services');
  var currentService = null;
  var railBuilt = false;

  var serviceKeys = ['objekty', 'gruzy', 'lichnaya', 'vooruzhennaya', 'video', 'konsultacii'];
  var serviceToOption = {
    objekty: 'Охрана объектов',
    gruzy: 'Сопровождение грузов',
    lichnaya: 'Личная охрана',
    vooruzhennaya: 'Вооружённая охрана',
    video: 'Видеонаблюдение и ОПС',
    konsultacii: 'Консультация'
  };

  function buildRail() {
    if (railBuilt || !rail || !grid) return;
    grid.querySelectorAll('.card[data-service]').forEach(function (card) {
      var key = card.getAttribute('data-service');
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'rail-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.dataset.service = key;
      var icon = card.querySelector('.card-icon');
      if (icon) tab.appendChild(icon.cloneNode(true));
      var label = document.createElement('span');
      var h3 = card.querySelector('h3');
      label.textContent = h3 ? h3.textContent : key;
      tab.appendChild(label);
      tab.addEventListener('click', function () { selectService(key, true); });
      tab.addEventListener('keydown', railKeyNav);
      rail.appendChild(tab);
    });
    railBuilt = true;
  }

  function railKeyNav(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    var i = serviceKeys.indexOf(currentService);
    i = e.key === 'ArrowRight'
      ? (i + 1) % serviceKeys.length
      : (i - 1 + serviceKeys.length) % serviceKeys.length;
    selectService(serviceKeys[i], true);
    var tabs = rail.querySelectorAll('.rail-tab');
    if (tabs[i]) tabs[i].focus();
  }

  function renderDetail(key) {
    var tpl = document.getElementById('tpl-' + key);
    if (!tpl || !detail) return;
    detail.innerHTML = '';
    detail.appendChild(tpl.content.cloneNode(true));
    var cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'btn btn-gold stage-cta';
    cta.textContent = 'Оставить заявку на эту услугу';
    cta.addEventListener('click', function () { requestService(key); });
    detail.appendChild(cta);
  }

  function setActiveTab(key) {
    if (!rail) return;
    rail.querySelectorAll('.rail-tab').forEach(function (t) {
      t.setAttribute('aria-selected', String(t.dataset.service === key));
    });
  }

  function selectService(key, swap) {
    currentService = key;
    setActiveTab(key);
    if (swap && !reduceMotion && detail) {
      detail.classList.add('swapping');
      setTimeout(function () {
        renderDetail(key);
        detail.scrollTop = 0;
        detail.classList.remove('swapping');
      }, 160);
    } else {
      renderDetail(key);
    }
  }

  function scrollToServices() {
    if (servicesSection) servicesSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function openStage(key) {
    if (!panel || !stage || !grid) return;
    buildRail();
    selectService(key, false);
    var reveal = function () {
      grid.style.display = 'none';
      stage.hidden = false;
      void stage.offsetWidth;
      stage.classList.add('is-in');
      panel.classList.remove('is-anim');
      var active = rail.querySelector('.rail-tab[aria-selected="true"]');
      if (active) active.focus({ preventScroll: true });
    };
    if (reduceMotion) { reveal(); }
    else { panel.classList.add('is-anim'); setTimeout(reveal, 280); }
    scrollToServices();
  }

  function closeStage() {
    if (!panel || !stage || !grid) return;
    stage.classList.remove('is-in');
    var finish = function () {
      stage.hidden = true;
      grid.style.display = '';
      if (!reduceMotion) {
        panel.classList.add('is-anim');
        void grid.offsetWidth;
        panel.classList.remove('is-anim');
      }
      scrollToServices();
    };
    if (reduceMotion) finish();
    else setTimeout(finish, 320);
  }

  function requestService(key) {
    var sel = document.getElementById('task');
    if (sel && serviceToOption[key]) sel.value = serviceToOption[key];
    var contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    var nameField = document.getElementById('name');
    if (nameField) setTimeout(function () { nameField.focus(); }, reduceMotion ? 0 : 500);
  }

  if (grid) {
    grid.querySelectorAll('.card[data-service]').forEach(function (card) {
      card.addEventListener('click', function () { openStage(card.getAttribute('data-service')); });
    });
  }
  if (stageBack) stageBack.addEventListener('click', closeStage);

  /* ---------- Аккордеон гарантий ---------- */
  var gacc = document.getElementById('gacc');
  if (gacc) {
    var heads = gacc.querySelectorAll('.gacc-head');
    heads.forEach(function (head) {
      head.addEventListener('click', function () {
        var item = head.closest('.gacc-item');
        var willOpen = !item.classList.contains('open');
        gacc.querySelectorAll('.gacc-item').forEach(function (it) {
          it.classList.remove('open');
          it.querySelector('.gacc-head').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('open');
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- Маска телефона ---------- */
  var phone = document.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' ' + d.slice(1, 4);
      if (d.length >= 5) out += ' ' + d.slice(4, 7);
      if (d.length >= 8) out += '-' + d.slice(7, 9);
      if (d.length >= 10) out += '-' + d.slice(9, 11);
      phone.value = out;
    });
  }

  /* ---------- Валидация и отправка формы ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#name');
      var ph = form.querySelector('#phone');
      var ok = true;

      if (!name.value.trim()) { name.classList.add('invalid'); ok = false; }
      else name.classList.remove('invalid');

      var digits = ph.value.replace(/\D/g, '');
      if (digits.length < 11) { ph.classList.add('invalid'); ok = false; }
      else ph.classList.remove('invalid');

      if (!ok) return;

      // Здесь подключается реальная отправка (почта/CRM/Telegram-бот).
      var success = document.getElementById('form-success');
      form.querySelector('button[type="submit"]').textContent = 'Заявка отправлена';
      if (success) success.hidden = false;
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.setAttribute('disabled', '');
      });
    });

    ['#name', '#phone'].forEach(function (sel) {
      var f = form.querySelector(sel);
      if (f) f.addEventListener('input', function () { f.classList.remove('invalid'); });
    });
  }
})();
