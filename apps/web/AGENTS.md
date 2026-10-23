<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Переиспользование frontend-кода

- Перед созданием нового helper, hook или общего UI-компонента проверь существующие реализации в `apps/web/src/shared` и затрагиваемом модуле. Переиспользуй подходящую реализацию.
- Бизнес-логику оставляй в соответствующем модуле; не переноси код в `shared` только ради устранения внешне похожих фрагментов.

## API и TanStack Query

- Использовать централизованный `shared/api`: функции запросов и ключи кеша группировать по ресурсам, например `shared/api/clients/{clients.ts,keys.ts,index.ts}`.
- Импортировать ресурс через его публичный API (`@/shared/api/clients`). Внутри `shared/api` использовать прямые относительные импорты транспорта и типов, чтобы не создавать циклы через общий barrel.
- Общие query options хранить рядом с запросами; `useQuery`, `useMutation` и обработку результатов размещать в использующем их сценарии или виджете. API не должен импортировать entities, features или widgets.
- В entities хранить модель и переиспользуемое представление сущности, включая общие поля форм. Отправка формы, уведомления и обновление кеша относятся к сценарию действия.
- Основание выбора: [FSD: TanStack Query](https://feature-sliced.design/docs/guides/tech/with-react-query) допускает `shared/api` с группировкой по контроллерам и ключами рядом с запросами. Это договорённость проекта, а не единственный допустимый вариант FSD.
