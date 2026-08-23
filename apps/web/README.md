# Service Cycle Web

Frontend-приложение Service Cycle на Next.js App Router, React, TypeScript и
Ant Design.

## Запуск

Из корня монорепозитория:

```bash
pnpm dev:web
```

Приложение будет доступно на `http://localhost:3000`.

## Архитектура

Используется облегчённый FSD-подход:

```text
app → views → widgets → features → entities → shared
```

- `app` связывает URL с экраном, подключает layouts и providers;
- `views` собирает целый экран;
- `widgets` содержит крупные самостоятельные части интерфейса;
- `features` содержит действия пользователя;
- `entities` содержит представление бизнес-сущностей;
- `shared` содержит общий технический код и конфигурацию.

Зависимости направлены только слева направо. Например, `features` не должна
импортировать код из `views` или `widgets`.

## Эталонный маршрут

Главная страница и workspace-layout показывают полный путь от маршрута до UI:

```text
app/(workspace)/layout.tsx → widgets/WorkspaceLayout
app/(workspace)/page.tsx   → views/OverviewPage
app/layout.tsx             → app/providers → shared/config/antd
```

`page.tsx` остаётся тонким и импортирует конкретный view напрямую:

```tsx
import { OverviewPage } from '@/views/OverviewPage';

export default function OverviewRoute() {
  return <OverviewPage />;
}
```

Не создавайте общий `views/index.ts` со всеми экранами. У каждого view может
быть собственный публичный `index.ts`.

## Добавление нового экрана

Для экрана импорта клиентов нужно добавлять структуру вместе с первой реальной
функциональностью:

```text
src/
├── app/(workspace)/clients/import/page.tsx
├── views/ClientImportPage/
│   ├── ui/ClientImportPage.tsx
│   └── index.ts
└── features/ImportClients/
    ├── ui/ImportClients.tsx
    └── index.ts
```

Распределение ответственности:

1. `page.tsx` импортирует `ClientImportView`.
2. `ClientImportView` собирает экран и подключает `ImportClients`.
3. `ImportClients` хранит состояние выбора и проверки файла.
4. Стили компонента лежат рядом с ним в `*.module.css`.

Не создавайте пустые слои, папки и универсальные компоненты заранее.

## Именование компонентов

Папки с React-компонентами и файлы компонентов называются в PascalCase:

```text
views/CalendarPage/
├── ui/
│   ├── CalendarPage.tsx
│   └── CalendarPage.module.css
└── index.ts
```

Стандартные файлы Next.js сохраняют обязательные имена `page.tsx` и
`layout.tsx`. Обычные конфиги и утилиты называются в camelCase или kebab-case
по назначению.

## Server и Client Components

Страницы, layouts и views по умолчанию остаются Server Components.

`"use client"` добавляется как можно ближе к интерактивности. Например,
`WorkspaceContainer`, `WorkspaceContent` и `WorkspaceFooter` остаются
серверными, а `WorkspaceSidebar` и `WorkspaceHeader` являются клиентскими,
потому что используют состояние и интерактивные компоненты Ant Design.

## Стили

- глобальный reset находится в `app/styles/global.css`;
- тема Ant Design находится в `shared/config/antd`;
- стили view, widget или feature лежат рядом с компонентом в `*.module.css`;
- глобальные переопределения классов Ant Design добавляются только при реальной
  необходимости.

## Проверки

Из корня монорепозитория:

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
```
