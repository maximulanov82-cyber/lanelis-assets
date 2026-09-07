/* Lanelis — сайт. Работает ТОЛЬКО навигация: прокрутка к разделам
   и переходы по ссылкам. Ничего не изображаем работающим, если оно не работает. */
(function () {
  'use strict';

  /* ---------- Разделы = якоря одной страницы ----------
     Сайт листается сплошняком, от «Обзора» до подвала. Рейл не
     переключает разделы, а ведёт к ним прокруткой и подсвечивает тот,
     который человек сейчас читает. Адрес при этом НЕ меняется: сайт
     листается одной страницей, и #раздел в адресной строке только мешает.
     Прямая ссылка на раздел по-прежнему работает — придя по ней, мы
     прокручиваем куда надо и убираем #раздел из адреса. */
  var spaces = [].slice.call(document.querySelectorAll('.space'));
  var tabs = [].slice.call(document.querySelectorAll('.sp-tab'));
  var panel = document.querySelector('.top');

  function panelH() { return panel ? panel.getBoundingClientRect().height : 0; }

  function mark(id) {
    tabs.forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-sp') === id); });
  }

  /* Читаемый раздел — последний, чья верхняя грань уже ушла под панель.
     У самого низа страницы это всегда последний раздел: иначе короткая
     «Поддержка» никогда бы не подсветилась, не докручиваясь до линии. */
  function current() {
    if (!spaces.length) return '';
    var line = panelH() + 28, id = spaces[0].id;
    spaces.forEach(function (s) {
      if (s.getBoundingClientRect().top <= line) id = s.id;
    });
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) {
      id = spaces[spaces.length - 1].id;
    }
    return id;
  }

  function jump(id) {
    var el = document.getElementById(id);
    if (!el) return false;
    var y = el.getBoundingClientRect().top + window.pageYOffset - panelH() - 10;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    mark(id);
    return true;
  }

  /* Убрать #раздел из адресной строки, не трогая прокрутку и не заводя
     новую запись в истории: «назад» должен уводить со страницы, а не
     гулять по разделам. */
  function стеретьЯкорь() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  if (spaces.length && tabs.length) {
    tabs.forEach(function (t) {
      t.addEventListener('click', function (e) {
        var id = t.getAttribute('data-sp');
        if (id && jump(id)) e.preventDefault();
        /* клик мышью гасит фокус — как вкладки пространств в расширении
           (там это e.detail > 0 → blur()); с клавиатуры кольцо остаётся */
        if (e.detail > 0) t.blur();
      });
    });

    /* Ссылки вида /#id из текста и подвала ведут туда же — прокруткой,
       а не прыжком, чтобы человек видел, куда его перенесло. Старая запись
       index.html#id тоже принимается: она может прийти по внешней ссылке. */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || a.classList.contains('sp-tab')) return;
      var m = (a.getAttribute('href') || '').match(/^(?:\/|index\.html)?#(.+)$/);
      if (m && jump(m[1])) e.preventDefault();
    });

    var sync = function () { mark(current()); };
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);

    /* При обновлении страницы браузер сам возвращает человека туда, где
       он читал. Раньше мы это ломали: в адресе оставался #id от последнего
       нажатия на вкладку, и обновление уводило к тому разделу — если это
       была последняя вкладка, выглядело как прыжок в самый низ. Теперь
       к разделу уводим только при обычном переходе (открыли ссылку),
       а при обновлении и при «назад/вперёд» не трогаем прокрутку. */
    var entry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    var restored = entry.type === 'reload' || entry.type === 'back_forward';
    var start = (location.hash || '').slice(1);
    if (!restored && start && document.getElementById(start)) jump(start);
    стеретьЯкорь();
    sync();
  }

  /* ---------- Стекло под липкой панелью ----------
     Пока страница не тронута, панель прозрачная и знак лежит прямо
     на обоях. Стоит начать листать — под панель встаёт стекло, иначе
     содержимое проезжает сквозь неё и всё сливается. Живёт отдельно
     от навигации по разделам: на странице поддержки разделов нет,
     а стекло нужно так же. */
  if (panel) {
    /* Порог намеренно не в пару пикселей: после обновления браузер
       возвращает человека почти на прежнее место, но иногда на несколько
       пикселей ниже — при пороге 6 от этого у самой верхушки зря
       появлялось стекло, хотя страницу никто не листал. */
    var TOP_EDGE = 28;
    var glass = function () { panel.classList.toggle('stuck', window.pageYOffset > TOP_EDGE); };

    /* Стоял у верхушки — там и остаёмся: сдвиг в несколько пикселей
       возвращаем на ноль. Повтор по load — восстановление прокрутки
       у браузера случается и после разбора страницы. */
    var pinTop = function () {
      if (window.pageYOffset > 0 && window.pageYOffset < TOP_EDGE) window.scrollTo({ top: 0 });
      glass();
    };
    window.addEventListener('scroll', glass, { passive: true });
    window.addEventListener('load', pinTop);
    pinTop();
  }

  /* ---------- Дата по-русски ----------
     Одна на обе страницы оплаты. Без неё человеку в лицо смотрит
     «2026-09-28T22:25:26.146418+00:00». */
  var МЕСЯЦЫ = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var датой = function (когда) {
    var d = когда instanceof Date ? когда : new Date(когда);
    if (isNaN(d)) return '';
    var год = d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '';
    return d.getDate() + ' ' + МЕСЯЦЫ[d.getMonth()] + год;
  };

  /* Прибавляет месяц или год так же, как это делает база: 31 января плюс
     месяц — это 28 февраля, а не 3 марта. Иначе обещанная на странице дата
     разошлась бы с настоящей. */
  var прибавить = function (дата, тариф) {
    var d = new Date(дата.getTime());
    if (тариф === 'forever') return null;
    var день = d.getDate();
    d.setDate(1);
    if (тариф === 'year') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    var вМесяце = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(день, вМесяце));
    return d;
  };

  /* ---------- Оформление подписки ----------
     Ключ входа расширение передаёт в хвосте адреса, после решётки. Хвост
     не уходит на сервер вместе с запросом страницы и не попадает в записи
     веб-сервера, поэтому ключу место именно там. Со страницы он стирается
     сразу — чтобы не остался в адресной строке и в истории браузера. */
  var тарифы = [].slice.call(document.querySelectorAll('.coplan'));
  if (тарифы.length) {
    var ключ = '';
    var найден = (location.hash || '').match(/[#&]t=([^&]+)/);
    if (найден) {
      ключ = decodeURIComponent(найден[1]);
      history.replaceState(null, '', location.pathname + location.search);
    }

    var где = function (имя) { return document.querySelector('[' + имя + ']'); };
    var кнопка = где('data-go');
    var ошибка = где('data-err');
    var аккаунт = null;          // ответ сервера про подписку, пока не пришёл — null

    /* Почта не введена или введена не так: поле дёргается и подсвечивается —
       и всё. Ровно так же сделано в окне удаления аккаунта в расширении.
       Слов не добавляем: надпись под полем сдвигала счёт с кнопкой вниз
       и на шаге оплаты читалась как второй сбой. Дёргается САМО поле,
       а не обёртка: в обёртке лежит ещё и надпись над полем, и вместе
       с ней ходил весь блок. Снимается, как только человек начал печатать. */
    var плохоПоле = function () {
      var обёртка = где('data-who-ask');
      var поле = обёртка && обёртка.querySelector('input');
      if (!поле) return;
      поле.setAttribute('aria-invalid', 'true');
      поле.classList.remove('shake');
      void поле.offsetWidth;               // перезапуск анимации на повторном нажатии
      поле.classList.add('shake');
      поле.focus();
    };

    var снятьЖалобу = function () {
      var обёртка = где('data-who-ask');
      var поле = обёртка && обёртка.querySelector('input');
      if (!поле) return;
      поле.removeAttribute('aria-invalid');
      поле.classList.remove('shake');
    };

    (function () {
      var обёртка = где('data-who-ask');
      var поле = обёртка && обёртка.querySelector('input');
      if (поле) поле.addEventListener('input', снятьЖалобу);
    })();

    var сказать = function (текст) {
      if (!ошибка) return;
      ошибка.textContent = текст || '';
      ошибка.hidden = !текст;
    };

    /* Отсчёт нового срока идёт от самой поздней из дат: сегодня, конец
       пробного, конец оплаченного. Ровно так же считает сервер — страница
       обязана обещать ту же дату, которую человек потом увидит. */
    var отсчёт = function () {
      var d = new Date();
      ['trialEnd', 'periodEnd'].forEach(function (поле) {
        var v = аккаунт && аккаунт[поле] ? new Date(аккаунт[поле]) : null;
        if (v && !isNaN(v) && v > d) d = v;
      });
      return d;
    };

    var выбранный = function () {
      return тарифы.filter(function (t) { return t.classList.contains('on'); })[0] || тарифы[0];
    };

    var вСчёт = function (поле, значение) {
      var el = document.querySelector('[data-sum-' + поле + ']');
      if (el) el.textContent = значение;
    };

    var обновить = function (кн) {
      var id = кн.getAttribute('data-id');
      вСчёт('name', кн.dataset.name);
      вСчёт('renew', кн.dataset.renew);
      вСчёт('price', кн.dataset.sum);
      вСчёт('per', кн.dataset.per);
      вСчёт('total', кн.dataset.sum);

      /* подпись и перечень — свои у каждого тарифа: показываем то,
         что относится к выбранному, остальное прячем */
      [].forEach.call(document.querySelectorAll('[data-for]'), function (el) {
        el.hidden = el.getAttribute('data-for') !== кн.dataset.plan;
      });

      var конец = прибавить(отсчёт(), id);
      var когда = где('data-sum-when');
      if (когда) {
        /* Одна строка и ничего лишнего. Про то, как часто списывают, уже
           сказано дважды — на карточке тарифа и под названием в счёте;
           третий повтор здесь только ломал строку надвое. */
        когда.innerHTML = id === 'forever'
          ? 'Разовый платёж — продлений не будет.'
          : 'Доступ до <b>' + датой(конец) + '</b>.';
      }

      if (кнопка && !кнопка.disabled) {
        var продление = аккаунт && аккаунт.status === 'active';
        кнопка.innerHTML = (продление ? 'Продлить за ' : 'Оплатить ') + кн.dataset.sum;
      }
    };

    var выбрать = function (кн) {
      тарифы.forEach(function (t) {
        var свой = t === кн;
        t.classList.toggle('on', свой);
        t.setAttribute('aria-checked', свой ? 'true' : 'false');
      });
      обновить(кн);
    };

    тарифы.forEach(function (t) {
      t.addEventListener('click', function () { выбрать(t); });
      /* стрелками — как ожидается от группы переключателей */
      t.addEventListener('keydown', function (e) {
        var шаг = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
                : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!шаг) return;
        e.preventDefault();
        var i = (тарифы.indexOf(t) + шаг + тарифы.length) % тарифы.length;
        тарифы[i].focus();
        выбрать(тарифы[i]);
      });
    });

    /* Кому продавать нечего: у человека уже бессрочный доступ. Гасим выбор
       и кнопку, но не прячем — исчезнувшая кнопка читается как поломка. */
    var запретить = function (почему) {
      тарифы.forEach(function (t) { t.disabled = true; });
      if (кнопка) {
        кнопка.disabled = true;
        кнопка.textContent = 'Покупать больше нечего';
      }
      var строка = где('data-who-state');
      if (строка) { строка.textContent = почему; строка.hidden = false; }
    };

    var показать = function (д) {
      аккаунт = д;
      var ждём = где('data-who-wait');
      var счёт = где('data-who-acct');
      var поле = где('data-who-ask');
      if (ждём) ждём.hidden = true;

      if (!д.signedIn) {
        /* Пришли по прямой ссылке, не из расширения: спрашиваем почту —
           без неё выдавать доступ будет некому. */
        if (поле) поле.hidden = false;
        обновить(выбранный());
        return;
      }

      if (счёт) счёт.hidden = false;
      var почта = где('data-who-email');
      if (почта) почта.textContent = д.email || '';

      if (д.plan === 'forever') { запретить('У вас бессрочный доступ — покупать больше нечего.'); return; }

      var строка = где('data-who-state');
      var текст = '';
      if (д.status === 'active' && д.periodEnd) {
        текст = 'Подписка активна до <b>' + датой(д.periodEnd)
              + '</b>. Оплата не обнулит остаток — новый срок прибавится к нему.';
      } else if (д.status === 'trialing' && д.trialEnd) {
        var осталось = Math.ceil((new Date(д.trialEnd) - new Date()) / 86400000);
        текст = осталось > 0
          ? 'Пробный период до <b>' + датой(д.trialEnd) + '</b>. Остаток дней не сгорит — он прибавится к оплаченному сроку.'
          : 'Пробный период закончился.';
      }
      if (строка && текст) { строка.innerHTML = текст; строка.hidden = false; }

      обновить(выбранный());
    };

    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: ключ })
    })
      .then(function (r) { return r.json(); })
      .then(показать)
      .catch(function () {
        /* Сервер не ответил — не запираем дверь: запасной путь с почтой
           работает и без него. */
        показать({ signedIn: false });
      });

    if (кнопка) кнопка.addEventListener('click', function () {
      if (кнопка.disabled) return;
      сказать('');

      var кн = выбранный();
      var тело = { plan: кн.getAttribute('data-id'), token: ключ };
      if (!ключ) {
        var поле = document.querySelector('[data-who-ask] input');
        var почта = поле ? поле.value.trim() : '';
        if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(почта)) {
          плохоПоле();
          return;
        }
        тело.email = почта;
      }

      var было = кнопка.innerHTML;
      кнопка.disabled = true;
      кнопка.textContent = 'Готовим оплату…';

      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(тело)
      })
        .then(function (r) { return r.json().then(function (д) { return { ok: r.ok, д: д }; }); })
        .then(function (о) {
          if (о.ok && о.д.url) { location.href = о.д.url; return; }
          кнопка.disabled = false;
          кнопка.innerHTML = было;
          сказать(
            о.д.error === 'already-forever' ? 'У вас уже бессрочный доступ — платить не за что.' :
            о.д.error === 'bad-email' ? 'Проверьте почту: кажется, в адресе опечатка.' :
            'Не удалось начать оплату. Попробуйте ещё раз или напишите на support@lanelisapp.com.'
          );
        })
        .catch(function () {
          кнопка.disabled = false;
          кнопка.innerHTML = было;
          сказать('Нет связи с сервером. Проверьте интернет и попробуйте снова.');
        });
    });
  }

  /* ---------- Возврат в расширение ----------
     Закрыть собственную вкладку страница вправе только если её открыл скрипт.
     Расширение открывает оплату именно так, поэтому обычно закрытие проходит.
     Если браузер отказал — не молчим и не притворяемся, а говорим, что делать. */
  var назад = document.querySelector('[data-back]');
  if (назад) {
    назад.addEventListener('click', function () {
      window.close();
      setTimeout(function () {
        if (document.hidden) return;               // вкладка всё-таки закрылась
        назад.disabled = true;
        назад.textContent = 'Закройте вкладку — Lanelis откроется в новой';
      }, 120);
    });
  }

  /* ---------- Оплата прошла ----------
     Платёжная система вернула человека сюда, но сообщение об оплате идёт
     к нам своим путём и может отстать на несколько секунд. Поэтому страница
     не утверждает вслепую, что доступ открыт, а спрашивает — и говорит,
     как есть. Спрашиваем ограниченное время: вечный опрос ничего не чинит. */
  var экран = document.querySelector('[data-done]');
  if (экран) {
    var номер = new URLSearchParams(location.search).get('n') || '';
    var поле = function (имя) { return document.querySelector('[data-done-' + имя + ']'); };
    var вПоле = function (имя, значение) { var el = поле(имя); if (el) el.textContent = значение; };

    вПоле('num', номер || '—');

    /* Копирование номера заказа. Кнопка появляется только когда номер есть:
       предлагать скопировать прочерк — обман. Подтверждение — сменой значка
       на полторы секунды; строки с текстом не заводим, она сдвинула бы чек.
       Буфер обмена доступен не везде (старые браузеры, страница не по https),
       поэтому рядом лежит запасной путь через временное поле — иначе кнопка
       молча ничего не делала бы, а это худший вид поломки. */
    var кнК = document.querySelector('[data-copy]');
    var сказано = document.querySelector('[data-copy-said]');
    if (кнК && номер) {
      кнК.hidden = false;
      var ждёт = null;
      var подтвердить = function () {
        кнК.classList.add('ok');
        кнК.setAttribute('aria-label', 'Номер заказа скопирован');
        кнК.setAttribute('title', 'Номер заказа скопирован');
        if (сказано) сказано.textContent = 'Номер заказа скопирован';
        clearTimeout(ждёт);
        ждёт = setTimeout(function () {
          кнК.classList.remove('ok');
          кнК.setAttribute('aria-label', 'Скопировать номер заказа');
          кнК.setAttribute('title', 'Скопировать номер заказа');
          if (сказано) сказано.textContent = '';
        }, 1600);
      };
      var запасной = function () {
        var t = document.createElement('textarea');
        t.value = номер;
        t.setAttribute('readonly', '');
        t.style.cssText = 'position:fixed;top:0;left:-9999px';
        document.body.appendChild(t);
        t.select();
        try { if (document.execCommand('copy')) подтвердить(); } catch (e) { /* нечем — молчим */ }
        document.body.removeChild(t);
      };
      кнК.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(номер).then(подтвердить, запасной);
        } else {
          запасной();
        }
      });
    }

    var попыток = 0;
    var спросить = function () {
      if (!номер) {
        вПоле('h', 'Оплата принята');
        вПоле('sub', 'Номер заказа не передан. Если доступ не появится, напишите нам — найдём платёж по почте.');
        return;
      }
      fetch('/api/order?n=' + encodeURIComponent(номер))
        .then(function (r) { return r.json(); })
        .then(function (д) {
          if (д.planName) вПоле('plan', д.planName);
          if (д.amount) вПоле('sum', д.amount.toLocaleString('ru-RU') + ' ₽');

          if (д.status === 'paid') {
            вПоле('h', д.periodEnd ? 'Доступ открыт до ' + датой(д.periodEnd) : 'Бессрочный доступ открыт');
            вПоле('sub', 'Всё готово. Расширение подхватит подписку при следующем открытии вкладки.');
            вПоле('till', д.periodEnd ? 'до ' + датой(д.periodEnd) : 'без ограничения срока');
            return;
          }
          if (++попыток < 15) { setTimeout(спросить, 2000); return; }
          вПоле('h', 'Оплата принята');
          вПоле('sub', 'Доступ откроется в течение нескольких минут. Если этого не случится — '
                     + 'напишите нам и назовите номер заказа.');
        })
        .catch(function () {
          if (++попыток < 15) setTimeout(спросить, 2000);
        });
    };
    спросить();
  }

  /* ---------- Появление при прокрутке ----------
     Карточки, плитки и заголовки поднимаются, когда доходят до экрана.
     Скрыты они стилями, поэтому здесь главное — не оставить ничего
     невидимым: то, что уже на экране, показываем сразу, остальное
     отдаём наблюдателю, а если наблюдателя в браузере нет — показываем
     всё разом. Задержка внутри группы даёт карточкам приходить по очереди. */
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if (rv.length) {
    var place = function (el) {
      return el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
    };
    var reveal = function (el) {
      el.style.transitionDelay = Math.min(place(el), 6) * 55 + 'ms';
      el.classList.add('in');
    };
    if (!window.IntersectionObserver) {
      rv.forEach(function (el) { el.classList.add('in'); });
    } else {
      var eye = new IntersectionObserver(function (list) {
        list.forEach(function (en) {
          if (!en.isIntersecting) return;
          reveal(en.target);
          eye.unobserve(en.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
      rv.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
        else eye.observe(el);
      });
    }
  }

  /* ---------- Язык: квадратная кнопка + меню вниз ----------
     Доступен только русский; остальные помечены «Позже» и
     отключены — кнопка, которая ничего не делает, честнее пустого
     переключения. Когда появятся переводы, снимаем disabled. */
  var langBtn = document.getElementById('langBtn');
  var langMenu = document.getElementById('langMenu');
  if (langBtn && langMenu) {
    var closeLang = function () {
      langMenu.hidden = true;
      langBtn.setAttribute('aria-expanded', 'false');
    };
    langBtn.addEventListener('click', function (e) {
      var open = langMenu.hidden;
      langMenu.hidden = !open;
      langBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var sel = langMenu.querySelector('.langrow.sel');
        if (sel) sel.focus();
      }
      if (e.detail > 0) langBtn.blur();
    });
    document.addEventListener('click', function (e) {
      if (!langMenu.hidden && !e.target.closest('.langwrap')) closeLang();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !langMenu.hidden) { closeLang(); langBtn.focus(); }
    });
    langMenu.addEventListener('click', function (e) {
      if (e.target.closest('.langrow.sel')) closeLang();
    });
  }

  /* клик мышью по пунктам правой плашки — тот же жест */
  document.querySelectorAll('.navtabs').forEach(function (plate) {
    plate.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && e.detail > 0) a.blur();
    });
  });

  /* ---------- Частые вопросы под тарифами ---------- */
  document.querySelectorAll('.qa').forEach(function (qa) {
    var b = qa.querySelector('button'), a = qa.querySelector('.ans');
    if (!b || !a) return;
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () {
      var open = !qa.classList.contains('open');
      qa.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  });

  /* ---------- Период оплаты: месяц ↔ год ---------- */
  var seg = document.querySelector('[data-seg]');
  if (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-period]');
      if (!b) return;
      var p = b.getAttribute('data-period');
      seg.querySelectorAll('button[data-period]').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      document.querySelectorAll('[data-m][data-y]').forEach(function (el) {
        el.textContent = el.getAttribute(p === 'y' ? 'data-y' : 'data-m');
      });
      document.querySelectorAll('[data-only]').forEach(function (el) {
        el.hidden = el.getAttribute('data-only') !== p;
      });
    });
    /* checkout.html?period=y — годовые кнопки приводят с уже выбранным годом */
    if (/[?&]period=y\b/.test(location.search)) {
      var yb = seg.querySelector('button[data-period="y"]');
      if (yb) yb.click();
    }
  }

  /* ---------- Отдельный экран с формой ----------
     Открывается элементом с data-sheet. Отдельной страницы контактов
     больше нет, поэтому у него нет адреса — открываем и мышью, и
     с клавиатуры (Enter/пробел), иначе форма была бы недоступна. */
  var sheetBack = null;
  function openSheet(el) {
    /* Один экран за раз: форма письма открывается ВМЕСТО поддержки.
       Два наложенных экрана путают — Escape закрывал бы оба сразу,
       и непонятно, куда возвращаешься. */
    [].forEach.call(document.querySelectorAll('.sheet:not([hidden])'), function (other) {
      if (other !== el) other.hidden = true;
    });
    if (!sheetBack) sheetBack = document.activeElement;
    el.hidden = false;
    /* прокрутку фона запираем, но компенсируем ширину полосы,
       иначе страница дёрнется вбок */
    var pad = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (pad > 0) document.documentElement.style.paddingRight = pad + 'px';
    var first = el.querySelector('input,select,textarea');
    if (first) first.focus();
  }
  function closeSheet(el) {
    el.hidden = true;
    /* Введённое стираем. Черновика у окна нет и быть не может: адреса у него тоже нет,
       вернуться к нему по ссылке нельзя. А увидеть при следующем открытии свой
       позавчерашний текст — неприятная неожиданность, особенно на чужом компьютере. */
    [].forEach.call(el.querySelectorAll('form'), function (f) {
      f.reset();
      [].forEach.call(f.querySelectorAll('[data-pick]'), function (pick) {
        var val = pick.querySelector('[data-val]');
        var btn = pick.querySelector('.fpick__btn');
        var hid = pick.querySelector('input[type="hidden"]');
        var ph  = pick.querySelector('.fpick__lbl');
        if (val) val.textContent = (ph && ph.getAttribute('data-ph')) || 'Выберите тему';
        if (btn) btn.classList.remove('has');
        if (hid) hid.value = '';
        [].forEach.call(pick.querySelectorAll('button[role="option"]'), function (o) {
          o.setAttribute('aria-selected', 'false');
        });
      });
    });
    document.documentElement.style.overflow = '';
    document.documentElement.style.paddingRight = '';
    if (sheetBack && sheetBack.focus) sheetBack.focus();
    sheetBack = null;
  }

  document.querySelectorAll('[data-sheet]').forEach(function (a) {
    var open = function (e) {
      var el = document.getElementById(a.getAttribute('data-sheet'));
      if (!el) return;                 /* окна нет — ничего не делаем */
      e.preventDefault();
      openSheet(el);
    };
    a.addEventListener('click', open);
    a.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') open(e);
    });
  });

  document.querySelectorAll('.sheet').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closeSheet(el);
    });
    /* Tab не должен уводить фокус за пределы окна */
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = el.querySelectorAll('button,input,select,textarea,a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.sheet:not([hidden])').forEach(closeSheet);
  });

  /* ---------- Выбор темы обращения ----------
     Своё окно вместо системного списка: так оно выглядит как выбор
     поисковика в расширении и подчиняется нашим стилям. */
  document.querySelectorAll('[data-pick]').forEach(function (pick) {
    var btn = pick.querySelector('.fpick__btn');
    var menu = pick.querySelector('.fpick__menu');
    var val = pick.querySelector('[data-val]');
    var hidden = pick.querySelector('input[type="hidden"]');

    var close = function () { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };

    btn.addEventListener('click', function (e) {
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (e.detail > 0) btn.blur();
    });

    menu.addEventListener('click', function (e) {
      var opt = e.target.closest('button[role="option"]');
      if (!opt) return;
      menu.querySelectorAll('button[role="option"]').forEach(function (o) {
        o.setAttribute('aria-selected', o === opt ? 'true' : 'false');
      });
      val.textContent = opt.childNodes[0].textContent.trim();
      btn.classList.add('has');
      if (hidden) hidden.value = val.textContent;
      close();
    });

    document.addEventListener('click', function (e) {
      if (!menu.hidden && !e.target.closest('[data-pick]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { e.stopPropagation(); close(); btn.focus(); }
    });
  });

  /* ---------- Письмо собирается и открывается в почтовой программе ----------
     Своей отправки у нас нет и пока не нужно: сервер под форму — это отдельная
     служба, спам-защита и хранение чужих обращений. Пока адрес известен, письмо
     проще собрать и отдать почтовой программе — тогда копия остаётся у человека
     в «Отправленных», и он видит, что и куда ушло. Адрес приходит из разметки. */
  document.querySelectorAll('form[data-stub]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = f.getAttribute('data-mail');
      if (!to) return;                                  // адрес не подключён — молчим, как раньше
      var val = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var picked = f.querySelector('[data-att-input]');
      var names = picked && picked.files ? [].map.call(picked.files, function (x) { return x.name; }) : [];
      var topic = val('topic') || 'Обращение';
      var body = 'Имя: ' + (val('name') || '—')
               + '\nПочта для ответа: ' + (val('email') || '—')
               + '\n\n' + (val('message') || '')
               + (names.length ? '\n\nПрилагаю: ' + names.join(', ') : '');
      window.location.href = 'mailto:' + to
        + '?subject=' + encodeURIComponent('Lanelis · ' + topic)
        + '&body=' + encodeURIComponent(body);
    });
  });

  /* ---------- Вложения ----------
     Скрепка открывает выбор файла, выбранное показывается списком с возможностью убрать.
     ⚠️ Через mailto: файл физически не переносится — это ограничение самой схемы. Поэтому
     список уходит в текст письма, а человеку прямо сказано приложить их в почтовой программе.
     Когда появится обработчик на сервере, здесь меняется только отправка — разметка и список
     остаются как есть. */
  document.querySelectorAll('[data-att]').forEach(function (btn) {
    var form = btn.closest('form');
    if (!form) return;
    var input = form.querySelector('[data-att-input]');
    var list = form.querySelector('[data-att-list]');
    if (!input || !list) return;

    var size = function (b) {
      return b < 1024 ? b + ' Б'
           : b < 1024 * 1024 ? Math.round(b / 1024) + ' КБ'
           : (b / 1048576).toFixed(1).replace('.', ',') + ' МБ';
    };
    var draw = function () {
      list.innerHTML = '';
      [].forEach.call(input.files, function (file, i) {
        var li = document.createElement('li');
        var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = file.name;
        var sz = document.createElement('span'); sz.className = 'sz'; sz.textContent = size(file.size);
        var x = document.createElement('button');
        x.type = 'button'; x.className = 'x'; x.textContent = '✕';
        x.setAttribute('aria-label', 'Убрать ' + file.name);
        x.addEventListener('click', function () {
          /* FileList менять нельзя — пересобираем через DataTransfer */
          var dt = new DataTransfer();
          [].forEach.call(input.files, function (o, j) { if (j !== i) dt.items.add(o); });
          input.files = dt.files; draw();
        });
        li.appendChild(nm); li.appendChild(sz); li.appendChild(x);
        list.appendChild(li);
      });
    };
    btn.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', draw);
    form.addEventListener('reset', function () { setTimeout(function () { input.value = ''; draw(); }, 0); });
  });

  /* ---------- Витрина снимков: лента + точки ----------
     Точки строятся по числу карточек, так что добавить шестой
     снимок можно правкой одной только разметки. */
  var shots = document.getElementById('shots');
  var shotDots = document.getElementById('shotDots');
  if (shots && shotDots) {
    var cards = [].slice.call(shots.querySelectorAll('.shot'));

    var stepW = function () {
      if (!cards[0]) return 0;
      var gap = parseFloat(getComputedStyle(shots).columnGap || getComputedStyle(shots).gap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    };
    var maxScroll = function () { return shots.scrollWidth - shots.clientWidth; };

    /* Точка = ПОЛОЖЕНИЕ ЛЕНТЫ, а не карточка. При пяти снимках и трёх
       видимых лента останавливается ровно в трёх местах, поэтому точек
       три. Лишние точки, ведущие в ту же позицию, — обман. На узком
       экране видно меньше карточек, значит и остановок больше. */
    var visible = function () {
      var s = stepW();
      return s ? Math.max(1, Math.round(shots.clientWidth / s)) : 1;
    };
    var stops = function () { return Math.max(1, cards.length - visible() + 1); };
    var stopLeft = function (i) { return Math.min(i * stepW(), maxScroll()); };

    var setActive = function (n) {
      [].forEach.call(shotDots.children, function (d, i) {
        var on = i === n;
        d.classList.toggle('on', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    };

    var builtFor = -1;
    var buildDots = function () {
      var n = stops();
      if (n === builtFor) return;
      builtFor = n;
      shotDots.textContent = '';
      for (var i = 0; i < n; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', 'Положение ' + (idx + 1) + ' из ' + n);
          b.addEventListener('click', function () {
            shots.scrollTo({ left: stopLeft(idx), behavior: 'smooth' });
            setActive(idx);
          });
          shotDots.appendChild(b);
        })(i);
      }
      shotDots.hidden = n < 2;   // всё влезло — листать нечего
    };

    /* Туман по краям живёт только во время движения и нарастает плавно.
       Класс держим ещё треть секунды после последнего события прокрутки,
       чтобы он не начал гаснуть, пока лента доезжает по инерции. */
    var idleTimer;
    var onScroll = function () {
      buildDots();
      var s = stepW();
      if (s) setActive(Math.min(Math.round(shots.scrollLeft / s), stops() - 1));

      var max = maxScroll();
      shots.classList.add('moving');
      shots.classList.toggle('fade-l', shots.scrollLeft > 2);
      shots.classList.toggle('fade-r', shots.scrollLeft < max - 2);

      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        shots.classList.remove('moving');   /* ширина уезжает в ноль за 0.52 с */
      }, 320);
    };

    shots.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    buildDots();
    setActive(0);
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
