"""
PluginRegistry — discovers and instantiates PolicyPlugin subclasses.

Discovery order:
  1. Built-ins registered via pyproject.toml [project.entry-points."aigap.plugins"].
  2. Third-party packages that declare the same entry-point group.

Plugins are matched to PolicyRules by the PolicyRule.plugin field, which
must be a fully-qualified class path:

    plugin: "aigap.plugins.builtins.pii_leakage:PiiLeakagePlugin"

The registry resolves the class, instantiates it with the rule's params,
and returns a PolicySuite with plugins mapped to their rule ids.
"""
from __future__ import annotations

import importlib
from importlib.metadata import entry_points
from typing import Any

from aigap.models.policy import PolicyConfig, PolicyRule, PolicySuite
from aigap.plugins.base import PolicyPlugin


class PluginLoadError(Exception):
    pass


class PluginRegistry:
    ENTRY_POINT_GROUP = "aigap.plugins"

    def __init__(self) -> None:
        # name → plugin class (populated lazily)
        self._classes: dict[str, type[PolicyPlugin]] = {}

    # ── Public API ────────────────────────────────────────────────────────

    def load_all(self) -> None:
        """Discover all registered plugins via entry points."""
        try:
            eps = entry_points(group=self.ENTRY_POINT_GROUP)
        except Exception:
            eps = []

        for ep in eps:
            try:
                cls = ep.load()
                if isinstance(cls, type) and issubclass(cls, PolicyPlugin):
                    self._classes[ep.name] = cls
            except Exception as exc:
                # Non-fatal: log and skip the broken plugin
                import warnings
                warnings.warn(f"Failed to load plugin '{ep.name}': {exc}", stacklevel=2)

    def build_suite(self, config: PolicyConfig) -> PolicySuite:
        """
        Resolve and instantiate plugins for every rule that declares one.
        Returns a PolicySuite ready for pipeline use.
        """
        plugins: dict[str, PolicyPlugin] = {}

        for rule in config.rules:
            if not rule.plugin:
                continue
            try:
                instance = self._instantiate(rule)
                plugins[rule.id] = instance
            except PluginLoadError as exc:
                import warnings
                warnings.warn(str(exc), stacklevel=2)

        return PolicySuite(config=config, plugins=plugins)

    def register(self, cls: type[PolicyPlugin]) -> None:
        """Manually register a plugin class (useful in tests)."""
        self._classes[cls.rule_id] = cls

    # ── Internals ─────────────────────────────────────────────────────────

    def _instantiate(self, rule: PolicyRule) -> PolicyPlugin:
        cls = self._resolve_class(rule.plugin)  # type: ignore[arg-type]
        try:
            return cls(params=rule.params)
        except Exception as exc:
            raise PluginLoadError(
                f"Cannot instantiate plugin '{rule.plugin}' for rule '{rule.id}': {exc}"
            ) from exc

    def _resolve_class(self, plugin_path: str) -> type[PolicyPlugin]:
        """
        Resolve 'module.path:ClassName' or a plain entry-point name.
        """
        if ":" in plugin_path:
            module_path, class_name = plugin_path.rsplit(":", 1)
            try:
                module = importlib.import_module(module_path)
            except ImportError as exc:
                raise PluginLoadError(f"Cannot import module '{module_path}': {exc}") from exc

            cls = getattr(module, class_name, None)
            if cls is None:
                raise PluginLoadError(
                    f"Class '{class_name}' not found in module '{module_path}'"
                )
            if not (isinstance(cls, type) and issubclass(cls, PolicyPlugin)):
                raise PluginLoadError(
                    f"'{plugin_path}' is not a PolicyPlugin subclass"
                )
            return cls

        # Try by entry-point name
        if plugin_path in self._classes:
            return self._classes[plugin_path]

        raise PluginLoadError(
            f"Cannot resolve plugin '{plugin_path}'. "
            "Use 'module.path:ClassName' format or register it via entry points."
        )


# Module-level singleton used by the CLI and pipeline
_registry = PluginRegistry()


def get_registry() -> PluginRegistry:
    return _registry


def build_suite(config: PolicyConfig) -> PolicySuite:
    """Convenience wrapper: load all entry-point plugins then build the suite."""
    _registry.load_all()
    return _registry.build_suite(config)
