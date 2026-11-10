# Mental Index — финальная версия V5

**Финальная версия: [dashboard-v5.html](dashboard-v5.html).**
[Открыть опубликованную V5](https://chakthegreatest-debug.github.io/mental-index/dashboard-v5.html).
Корень проекта перенаправляет на V5. Предыдущие версии дашборда удалены из текущей ветки и сохраняются в истории Git.

## Запуск на Mac

Из папки проекта:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Открыть `http://127.0.0.1:4173/dashboard-v5.html`. Сборка, npm и внешние API не требуются.

## Исходники

- `dashboard-v5.html` — финальная версия с согласованными выводами.
- `assets/css/dashboard.css`, `dashboard-soft.css`, `dashboard-v3.css` — стили.
- `assets/js/dashboard-viz.js`, `dashboard-v5.js` — графики, фильтры и взаимодействия.
- `assets/img/prosebya-logo.svg` — логотип.
- Остальные исходные assets и docs сохранены для дальнейшей работы.
- `legacy-index.html` — исходная старая страница, не рабочая версия дашборда.
- `privacy.html` — исходная заглушка; не утверждённая политика.

## Происхождение

Источник: [leratk22/mental-index](https://github.com/leratk22/mental-index).
Коммит источника: `7321dce668491c1f9143f14c030c4a173b6f6dc5`.
Снимок получен 5 ноября 2026 года. Внешний исходный репозиторий не изменялся.
HTML версии 3 побайтно совпал с выбранной опубликованной страницей.
Контрольные суммы исходного снимка: [SOURCE-MANIFEST.json](docs/SOURCE-MANIFEST.json).
Исходное описание: [UPSTREAM-README.md](docs/UPSTREAM-README.md).

## Права и данные

Euclid Circular A — коммерческий шрифт. Он есть в assets/fonts и встроен в HTML.
Исходный README требует проверить веб-лицензию. Документ о лицензии в исходниках не найден.
Удаление только assets/fonts не удаляет шрифт из HTML.
Общая лицензия на исходный проект в репозитории также не обнаружена. Новые лицензии не назначены.

Дашборд содержит агрегированные результаты исследования. Исходная версия не содержала форм ввода и отправки данных. Проверка HTML и подключённых скриптов не выявила вызовов fetch, XMLHttpRequest, sendBeacon или WebSocket.

## Репозиторий

Публичный репозиторий: [chakthegreatest-debug/mental-index](https://github.com/chakthegreatest-debug/mental-index).
Отчёт о первоначальном переносе V3: [HANDOFF.md](HANDOFF.md).
