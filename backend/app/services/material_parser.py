from __future__ import annotations

import logging
import re

import httpx

from app.models.entities import Material

logger = logging.getLogger(__name__)


def _strip_html_tags(content: str) -> str:
    return re.sub(r"<[^>]+>", " ", content)


class MaterialParserService:
    def parse(self, material: Material) -> tuple[str, str | None]:
        logger.info("material_parse_started material_id=%s source_type=%s", material.id, material.source_type)

        raw_text = material.raw_text or ""
        if material.source_type == "url" and not raw_text and material.source_uri:
            raw_text = self._fetch_url(material.source_uri)

        normalized_text = self._normalize_text(raw_text)
        language = self._detect_language(normalized_text)
        logger.info(
            "material_parse_completed material_id=%s text_length=%s language=%s",
            material.id,
            len(normalized_text),
            language,
        )
        return normalized_text, language

    def _fetch_url(self, source_uri: str) -> str:
        try:
            response = httpx.get(source_uri, timeout=10.0, follow_redirects=True)
            response.raise_for_status()
            return _strip_html_tags(response.text)
        except Exception as exc:
            logger.warning("material_url_fetch_failed source_uri=%s error=%s", source_uri, exc)
            return source_uri

    def _normalize_text(self, content: str) -> str:
        content = content.replace("\r\n", "\n").replace("\r", "\n")
        lines = [line.strip() for line in content.split("\n")]
        normalized_lines: list[str] = []
        previous_blank = False

        for line in lines:
            if not line:
                if not previous_blank:
                    normalized_lines.append("")
                previous_blank = True
                continue

            normalized_lines.append(line)
            previous_blank = False

        return "\n".join(normalized_lines).strip()

    def _detect_language(self, content: str) -> str | None:
        if not content:
            return None
        if re.search(r"[\u4e00-\u9fff]", content):
            return "zh"
        return "en"
