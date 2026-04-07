# Rebranding workflow: n8n -> n9n

Для безопасной массовой миграции добавлен скрипт:

```bash
node scripts/rebrand-legacy-to-n9n.mjs --report=rebrand-report.json
```

## Режимы

- Dry-run (по умолчанию): только отчет изменений.
- Apply:

```bash
node scripts/rebrand-legacy-to-n9n.mjs --write --report=rebrand-report.json
```

`rebrand-report.json` генерируется локально и добавлен в `.gitignore`, чтобы не засорять PR служебными dry-run артефактами.
Для обратной совместимости сохранён алиас `scripts/rebrand-n8n-to-n9n.mjs`.

## Что защищено от автозамены

Скрипт специально **не трогает** технические маркеры, которые обычно требуют отдельной миграции и координации:

- `@n8n/*` package scope,
- `n8n-io`, `n8n.io`,
- сегменты путей `/n8n/`,
- `filter=n8n-playwright`.

Это позволяет двигаться поэтапно: сначала текстовые/документационные упоминания, потом package scopes и runtime-идентификаторы.
