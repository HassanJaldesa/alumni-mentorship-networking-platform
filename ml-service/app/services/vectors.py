"""Combines the text embedding and the structured vector (DR-03)."""
import numpy as np


def normalize(vector: np.ndarray) -> np.ndarray:
    """Scale a vector to unit length."""
    length = np.linalg.norm(vector)
    if length == 0:
        raise ValueError("Cannot normalize a zero vector")
    return (vector / length).astype(np.float32)


def build_unified_vector(embedding: np.ndarray, structured: np.ndarray) -> np.ndarray:
    """Normalize both parts, join them, and normalize the result.

    Because both halves have the same length before joining, the cosine
    similarity of two unified vectors is the average of their text similarity
    and their structured similarity, so each part counts equally.
    """
    return normalize(np.concatenate([normalize(embedding), normalize(structured)]))


def to_pgvector(vector: np.ndarray) -> str:
    """Format a vector as pgvector text, for example '[0.1,0.2,0.3]'."""
    return "[" + ",".join(f"{value:.7g}" for value in vector) + "]"