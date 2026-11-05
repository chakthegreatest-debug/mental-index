# Mental Index — финальная версия V4

**Финальная версия: [dashboard-v4.html](dashboard-v4.html).**
[Открыть опубликованную V4](https://chakthegreatest-debug.github.io/mental-index/dashboard-v4.html).
V4 зафиксирована как финальная по указанию пользователя. По сравнению с V3 внесены только согласованные текстовые правки.
Версия 3 сохранена без изменений. Корень проекта пока перенаправляет на dashboard-v3.html.

## Запуск на Mac

Из папки проекта:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Открыть `http://127.0.0.1:4173/dashboard-v4.html`. Сборка, npm и внешние API не требуются.

## Исходники

- `dashboard-v4.html` — финальная версия с согласованными текстовыми правками.
- `dashboard-v3.html` — сохранённая предыдущая версия; разметка, данные, встроенные скрипты и шрифты.
- `assets/css/dashboard.css`, `dashboard-soft.css`, `dashboard-v3.css` — стили.
- `assets/js/dashboard-viz.js`, `dashboard-v3.js` — графики, фильтры и взаимодействия.
- `assets/img/prosebya-logo.svg` — логотип.
- Остальные исходные assets и docs сохранены для дальнейшей работы.
- `legacy-index.html`, `dashboard.html`, `dashboard-v2.html` — исходные старые страницы, не рабочая версия.
- `privacy.html` — исходная заглушка; не утверждённая политика.

## Происхождение

Источник: [leratk22/mental-index](https://github.com/leratk22/mental-index).
Коммит источника: `7321dce668491c1f9143f14c030c4a173b6f6dc5`.
Снимок получен 5 ноября 2026 года. Внешний исходный репозиторий не изменялся.
HTML версии 3 побайтно совпал с выбранной опубликованной страницей.
Контрольные суммы: [SOURCE-MANIFEST.json](docs/SOURCE-MANIFEST.json).
Исходное описание: [UPSTREAM-README.md](docs/UPSTREAM-README.md).

## Права и данные

Euclid Circular A — коммерческий шрифт. Он есть в assets/fonts и встроен в HTML версий 3 и 4.
Исходный README требует проверить веб-лицензию. Документ о лицензии в исходниках не найден.
Удаление только assets/fonts не удаляет шрифт из HTML.
Общая лицензия на исходный проект в репозитории также не обнаружена.
Новые лицензии не назначены.

Версия 3 содержит агрегированные результаты исследования. Форм ввода и отправки данных в ней нет.
Проверка HTML и подключённых скриптов не выявила вызовов fetch, XMLHttpRequest, sendBeacon или WebSocket.
В V4 обновлены согласованные названия и подписи; числовые данные сохранены как в V3.

## Репозиторий

Публичный репозиторий: [chakthegreatest-debug/mental-index](https://github.com/chakthegreatest-debug/mental-index).
Финальная V4 опубликована через GitHub Pages по ссылке в начале README.
Отчёт о первоначальном переносе V3: [HANDOFF.md](HANDOFF.md).
