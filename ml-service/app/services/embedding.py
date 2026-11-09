"""Loads the SBERT model once and encodes profile text (DR-03)."""
import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings

_model: SentenceTransformer | None = None


def load_model() -> SentenceTransformer:
    """Load the model on first use and reuse it for every later request."""
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.sbert_model)
    return _model


def is_model_loaded() -> bool:
    return _model is not None


def encode_text(text: str) -> np.ndarray:
    """Return a 384-dimensional embedding normalized to unit length."""
    vector = load_model().encode(text, normalize_embeddings=True)
    return np.asarray(vector, dtype=np.float32)