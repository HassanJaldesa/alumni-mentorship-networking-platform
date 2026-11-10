"""Encodes structured profile attributes as a multi-hot vector (DR-03).

Layout (44 positions): 10 industries, 20 skills, 10 mentorship interests,
4 availability options, in the order defined in app/vocabulary.py.
"""
import numpy as np

from app.vocabulary import AVAILABILITY, INDUSTRIES, MENTORSHIP_INTERESTS, SKILLS


def _multi_hot(values: list[str], vocabulary: list[str], field: str) -> np.ndarray:
    vector = np.zeros(len(vocabulary), dtype=np.float32)
    for value in values:
        if value not in vocabulary:
            raise ValueError(f"Unknown {field}: {value!r}")
        vector[vocabulary.index(value)] = 1.0
    return vector


def encode_structured(features: dict) -> np.ndarray:
    """Return the 44-dimensional multi-hot vector for one profile."""
    industry = features.get("industry")
    availability = features.get("availability")
    if not industry:
        raise ValueError("Industry is required")
    if not availability:
        raise ValueError("Availability is required")

    return np.concatenate(
        [
            _multi_hot([industry], INDUSTRIES, "industry"),
            _multi_hot(features.get("skills", []), SKILLS, "skill"),
            _multi_hot(features.get("mentorship_interests", []), MENTORSHIP_INTERESTS, "mentorship interest"),
            _multi_hot([availability], AVAILABILITY, "availability"),
        ]
    )