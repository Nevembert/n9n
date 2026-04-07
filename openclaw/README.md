# OpenClaw Workspace Factory (n9n)

Этот модуль добавляет каркас проекта автоматизации создания OpenClaw-агентов (Workspace) с фокусом на:

- визуализацию структуры workspace,
- память агентов,
- задачи и зависимости,
- связи между агентами и БД,
- скиллы,
- выделенного `factory agent`, выполняющего основную часть редактирования workspace.

## Что реализовано

1. **JSON Schema**: `schema/openclaw-workspace.schema.json`.
2. **Factory Agent CLI**: `factory-agent.mjs`.
3. **Примеры**: `examples/agentic-research.workspace.json` и edit-план `examples/factory-edit.plan.json`.
4. Автоматический **rebuild graph** (`graph.nodes`, `graph.edges`) после `init/apply/visualize`.
5. Runtime-валидация ссылочной целостности (`validate`) для agents/tasks/memory.

## Команды CLI

- `init <workspace.json> [name] [goal]` — создать workspace + Mermaid.
- `apply <workspace.json> <edits.json>` — применить пакет правок от factory agent.
- `visualize <workspace.json>` — пересобрать Mermaid из JSON (с предварительным rebuild graph).
- `validate <workspace.json>` — проверить целостность workspace.

## Быстрый запуск

```bash
pnpm openclaw:workspace:init
pnpm openclaw:workspace:apply
pnpm openclaw:workspace:validate
pnpm openclaw:workspace:visualize
```

Пример применения плана правок:

```bash
node openclaw/factory-agent.mjs apply \
  ./openclaw/examples/generated.workspace.json \
  ./openclaw/examples/factory-edit.plan.json
```

## Следующий этап

- backend API для CRUD OpenClaw workspace,
- frontend canvas для live-визуализации memory/tasks/connections,
- аудит операций factory agent и откат edit-пакетов,
- интеграция schema-driven валидации на API уровне.
