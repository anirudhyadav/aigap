# Contributing to AIGAP

Thanks for your interest in contributing to AIGAP — AI Guardrails and Policies.

---

## Getting Started

```bash
# Clone
git clone https://github.com/anirudhyadav/aigap.git
cd aigap

# Python CLI + server
pip install -e ".[dev]"

# VS Code extension
cd vscode-extension
npm install
npm run compile
```

---

## Project Structure

```
aigap/                 ← Python CLI, pipeline, plugins, server
vscode-extension/      ← VS Code extension (TypeScript)
prompts/               ← Markdown prompt templates (Option A)
examples/              ← Example policy projects
tests/                 ← Python test suites
```

---

## Writing a Custom Plugin

AIGAP ships 5 built-in guardrail plugins. You can add your own:

### 1. Create the Plugin Class

```python
# aigap/plugins/builtins/my_plugin.py
from aigap.plugins.base import GuardrailPlugin, PluginResult

class MyPlugin(GuardrailPlugin):
    """Detect custom policy violations."""

    name = "my-custom-check"

    def fast_check(self, text: str) -> PluginResult | None:
        """Optional fast-path: return a result without LLM call if confident."""
        if "BLOCKED_PATTERN" in text:
            return PluginResult(triggered=True, reason="Blocked pattern found")
        return None  # Fall through to LLM evaluation

    async def evaluate(self, prompt: str, response: str) -> PluginResult:
        """Full evaluation with access to both prompt and response."""
        # Your detection logic here
        return PluginResult(triggered=False, reason="Clean")
```

### 2. Register the Entry Point

In `pyproject.toml`:

```toml
[project.entry-points."aigap.plugins"]
my_custom_check = "aigap.plugins.builtins.my_plugin:MyPlugin"
```

### 3. Reference in Policy YAML

```yaml
rules:
  - id: my-custom-rule
    name: My Custom Rule
    description: Enforce custom business logic
    category: guardrail
    severity: high
    plugin: "aigap.plugins.builtins.my_plugin:MyPlugin"
```

---

## Running Tests

```bash
# Python tests
pytest tests/

# VS Code extension tests
cd vscode-extension
npm test
```

---

## Code Style

| Language | Tool | Config |
|---|---|---|
| Python | ruff | `pyproject.toml [tool.ruff]` |
| Python | mypy | Type annotations required |
| TypeScript | ESLint + tsc strict | `tsconfig.json` |

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Notion ingestion command
fix: prevent command injection in prDraft
docs: add plugin development guide
```

---

## Pull Requests

1. Branch from `main`
2. Include tests for new functionality
3. Ensure `ruff check .` and `npx tsc --noEmit` pass
4. Update CHANGELOG.md if adding user-facing features
5. Link related issues

---

## ID System

AIGAP uses stable IDs that are **never reused or deleted**:

| Prefix | Type | Example |
|---|---|---|
| `GP-NNN` | Guardrail Policy | `GP-001` |
| `GC-NNN` | Guardrail Category | `GC-001` |
| `EV-NNN` | Enforcement Vector | `EV-001` |
| `FR-NNN` | Framework Mapping | `FR-001` |
| `TASK-NNN` | Sprint Task | `TASK-001` |

The registry in `.aigap/registry.json` tracks the counter for each prefix. Always use `nextId()` to allocate IDs — never hardcode them.

---

## License

MIT — see [LICENSE](LICENSE).
