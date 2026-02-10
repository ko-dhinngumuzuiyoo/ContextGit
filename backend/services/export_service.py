from __future__ import annotations

import os

from jinja2 import Environment, FileSystemLoader

from models.schemas import ContextData

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")


class ExportService:
    """Generate LLM-specific Export Packs using Jinja2 templates."""

    def __init__(self):
        self.env = Environment(
            loader=FileSystemLoader(TEMPLATES_DIR),
            autoescape=False,
        )

    def export(self, context: ContextData, target: str) -> str:
        template_name = f"{target}.md.j2"
        template = self.env.get_template(template_name)
        return template.render(ctx=context)

    def list_targets(self) -> list[str]:
        targets = []
        for f in os.listdir(TEMPLATES_DIR):
            if f.endswith(".md.j2"):
                targets.append(f.replace(".md.j2", ""))
        return sorted(targets)
