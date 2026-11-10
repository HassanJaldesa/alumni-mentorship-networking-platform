import re
from pathlib import Path

from app import vocabulary

FRONTEND_FILE = Path(__file__).resolve().parents[2] / "frontend" / "lib" / "vocabulary.ts"


def read_typescript_list(name: str) -> list[str]:
    """Return the strings inside `export const NAME = [ ... ] as const;`."""
    text = FRONTEND_FILE.read_text(encoding="utf-8")
    match = re.search(rf"export const {name} = \[(.*?)\] as const;", text, re.S)
    assert match, f"{name} not found in {FRONTEND_FILE}"
    return re.findall(r'"([^"]*)"', match.group(1))


def test_structured_dimension_is_44():
    assert vocabulary.STRUCTURED_DIMENSION == 44


def test_lists_have_no_duplicates():
    for values in (
        vocabulary.INDUSTRIES,
        vocabulary.SKILLS,
        vocabulary.MENTORSHIP_INTERESTS,
        vocabulary.AVAILABILITY,
    ):
        assert len(values) == len(set(values))


def test_python_and_typescript_lists_match():
    for name in ("INDUSTRIES", "SKILLS", "MENTORSHIP_INTERESTS", "AVAILABILITY"):
        assert read_typescript_list(name) == getattr(vocabulary, name), name