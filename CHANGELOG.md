# Changelog

All notable changes to AIGAP are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.2.0] — Unreleased

### Added
- **VS Code extension**: 20 commands, `@aigap` chat participant, RTM tree view, `PolicyAnalysisPanel` webview
- **Three-stage LLM pipeline in VS Code**: Deep Evaluate command with classify → analyze → synthesize stages
- **YAML policy support in VS Code**: Extension now reads `.aigap-policy.yaml` when `POLICIES.md` is absent
- **Notion ingestion**: `aigap: Ingest from Notion` command
- **SharePoint ingestion**: `aigap: Ingest from SharePoint` command via Microsoft Graph
- **Google Docs ingestion**: `aigap: Ingest from Google Docs` command
- **Dashboard API enhancements**: `/drift`, `/trends`, `/plugins` endpoints for drift visualization, historical trends, and plugin breakdown
- **Pre-commit hooks**: `aigap-validate` (pre-commit) and `aigap-check` (pre-push) hooks via `.pre-commit-config.yaml`
- **Extension packaging**: `vsce package` support with marketplace metadata
- **Config schema validation**: JSON Schema for `.aigap-policy.yaml` with VS Code IntelliSense
- **32 unit tests** for VS Code extension (registry, chunker, parsers, generators, writer)
- **CONTRIBUTING.md**: Plugin development guide, code style, commit conventions
- **Example .aigap outputs**: Populated examples for `coding_assistant` and `customer_support_bot`

### Fixed
- Policies now matched to categories/vectors by name similarity instead of always first entry
- `execSync` replaced with `execFileSync` to prevent shell injection
- Registry updated after Confluence ingestion to prevent ID conflicts
- `CancellationTokenSource` properly disposed in LLM client
- Version strings sanitized to prevent path traversal in release writer
- Info messages now show sanitized filenames matching actual paths

---

## [0.1.0] — 2025-04-01

### Added
- Python CLI: `aigap check`, `aigap init`, `aigap baseline`, `aigap rules`, `aigap serve`
- Three-stage pipeline: Haiku classify → Sonnet analyze → Opus synthesize
- Five built-in guardrail plugins: PII, prompt injection, jailbreak, harmful content, competitor mention
- Plugin API with `fast_check()` + async `evaluate()`
- Prompt caching (`cache_control: ephemeral`)
- Result cache (disk + memory) for classifier results
- Web dashboard with SSE streaming, grade ring, rule detail
- 12 markdown prompt templates (Option A)
- Golden dataset loaders (JSONL, YAML, JSON)
- Scoring engine: efficacy, coverage, drift tracking
- CI reusable workflow (`aigap-reusable.yml`)
