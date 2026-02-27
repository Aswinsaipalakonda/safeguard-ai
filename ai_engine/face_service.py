"""
Face Recognition Service using OpenCV FaceDetectorYN + FaceRecognizerSF.
Uses YuNet (detection) + SFace (128-dim embedding) — both ONNX, CPU-only.

Workflow:
  1. enroll(worker_id, image_bytes)  → extract face embedding → store in DB
  2. verify(worker_id, image_bytes)  → extract embedding → cosine compare with stored
  3. identify(image_bytes)           → compare against ALL enrolled workers

Cosine similarity threshold: 0.363 (OpenCV SFace recommended)
"""

import os
import base64
import logging
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Model paths ──────────────────────────────────────────────────────────────
_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
_DET_MODEL = os.path.join(_MODEL_DIR, "face_detection_yunet_2023mar.onnx")
_REC_MODEL = os.path.join(_MODEL_DIR, "face_recognition_sface_2021dec.onnx")

# Cosine similarity threshold (OpenCV SFace default recommendation)
COSINE_THRESHOLD = 0.363

# Singleton holders
_detector: Optional[cv2.FaceDetectorYN] = None
_recognizer: Optional[cv2.FaceRecognizerSF] = None


def _get_detector(width: int = 640, height: int = 480) -> cv2.FaceDetectorYN:
    """Lazy-load YuNet face detector, sized to the input image."""
    global _detector
    _detector = cv2.FaceDetectorYN.create(_DET_MODEL, "", (width, height), 0.6, 0.3)
    return _detector


def _get_recognizer() -> cv2.FaceRecognizerSF:
    """Lazy-load SFace recognizer (128-dim embeddings)."""
    global _recognizer
    if _recognizer is None:
        _recognizer = cv2.FaceRecognizerSF.create(_REC_MODEL, "")
    return _recognizer


def _decode_image(image_data: str) -> np.ndarray:
    """
    Accept base64-encoded image (with or without data URI prefix)
    and return an OpenCV BGR numpy array.
    """
    # Strip data URI prefix if present
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    img_bytes = base64.b64decode(image_data)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image data")
    return img


def _detect_face(img: np.ndarray) -> Optional[np.ndarray]:
    """
    Detect the largest face in the image.
    Returns the face detection result (1×15 array) or None.
    """
    h, w = img.shape[:2]
    detector = _get_detector(w, h)
    _, faces = detector.detect(img)

    if faces is None or len(faces) == 0:
        return None

    # Return the face with the highest confidence (last column)
    best_idx = int(np.argmax(faces[:, -1]))
    return faces[best_idx]


def _extract_embedding(img: np.ndarray, face: np.ndarray) -> list[float]:
    """
    Given an image and a detected face, extract the 128-dim embedding.
    Returns a Python list of floats (JSON-serializable for DB storage).
    """
    recognizer = _get_recognizer()
    aligned = recognizer.alignCrop(img, face)
    embedding = recognizer.feature(aligned)
    # Flatten to 1D list
    return embedding.flatten().tolist()


def _cosine_similarity(emb1: list[float], emb2: list[float]) -> float:
    """Compute cosine similarity between two embedding vectors."""
    a = np.array(emb1, dtype=np.float64)
    b = np.array(emb2, dtype=np.float64)
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(dot / norm)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_face_embedding(image_base64: str) -> Optional[list[float]]:
    """
    Detect the primary face in a base64 image and return its 128-dim embedding.
    Returns None if no face is detected.
    """
    try:
        img = _decode_image(image_base64)
        face = _detect_face(img)
        if face is None:
            return None
        return _extract_embedding(img, face)
    except Exception as e:
        logger.error(f"Face embedding extraction failed: {e}")
        return None


def compare_embeddings(emb1: list[float], emb2: list[float]) -> tuple[bool, float]:
    """
    Compare two face embeddings.
    Returns (is_match, similarity_score).
    """
    score = _cosine_similarity(emb1, emb2)
    return score >= COSINE_THRESHOLD, score


def find_best_match(
    probe_embedding: list[float],
    enrolled: list[tuple[int, str, list[float]]],  # [(worker_id, name, embedding), ...]
) -> Optional[tuple[int, str, float]]:
    """
    Compare a probe embedding against all enrolled workers.
    Returns (worker_id, name, similarity) for the best match above threshold,
    or None if no match.
    """
    best_id = None
    best_name = ""
    best_score = -1.0

    for worker_id, name, stored_emb in enrolled:
        score = _cosine_similarity(probe_embedding, stored_emb)
        if score > best_score:
            best_score = score
            best_id = worker_id
            best_name = name

    if best_score >= COSINE_THRESHOLD and best_id is not None:
        return best_id, best_name, best_score

    return None
