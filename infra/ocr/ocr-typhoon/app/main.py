import os
import tempfile
from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from openai import OpenAI
from typhoon_ocr.ocr_utils import ensure_image_in_path, prepare_ocr_messages

app = FastAPI()

MODE = os.getenv("MODEL_SERVER_MODE", "cloud").lower()
TIMEOUT_S = float(os.getenv("MODEL_SERVER_TIMEOUT_S", "600"))

CLOUD_BASE_URL = os.getenv(
    "CLOUD_BASE_URL",
    os.getenv("TYPHOON_BASE_URL", "https://api.opentyphoon.ai/v1"),
)
CLOUD_API_KEY = os.getenv("CLOUD_API_KEY", os.getenv("TYPHOON_OCR_API_KEY"))
CLOUD_MODEL = os.getenv("CLOUD_MODEL", "typhoon-ocr")

LOCAL_BASE_URL = os.getenv(
    "LOCAL_BASE_URL",
    os.getenv("MODEL_SERVER_BASE_URL", "http://llama-cpp:8080/v1"),
)
LOCAL_API_KEY = os.getenv("LOCAL_API_KEY", os.getenv("MODEL_SERVER_API_KEY", "llama"))
LOCAL_MODEL = os.getenv("LOCAL_MODEL", os.getenv("TYPHOON_OCR_MODEL", "typhoon-ocr1.5-2b.Q4_K_M.gguf"))
TASK_TYPE = os.getenv("TYPHOON_OCR_TASK_TYPE", "v1.5")
FIGURE_LANGUAGE = os.getenv("TYPHOON_OCR_FIGURE_LANGUAGE", "Thai")
def run_ocr(
    *,
    image_path: str,
    page_num: int,
    base_url: str,
    api_key: str | None,
    model: str,
) -> str:
    client = OpenAI(base_url=base_url, api_key=api_key, timeout=TIMEOUT_S)
    messages = prepare_ocr_messages(
        pdf_or_image_path=image_path,
        task_type=TASK_TYPE,
        target_image_dim=1800,
        target_text_length=8000,
        page_num=page_num or 1,
        figure_language=FIGURE_LANGUAGE,
    )
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=16384,
        extra_body={
            "repetition_penalty": 1.1 if TASK_TYPE == "v1.5" else 1.2,
            "temperature": 0.1,
            "top_p": 0.6,
        },
    )
    return response.choices[0].message.content


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    page_num: int | None = Query(default=None),
    mode: str | None = Query(default=None),
) -> JSONResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="missing filename")

    suffix = os.path.splitext(file.filename)[1]
    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
            tmp.write(await file.read())

        image_path = ensure_image_in_path(temp_path)
        mode_value = (mode or MODE).lower()

        if mode_value not in {"cloud", "local", "auto"}:
            raise HTTPException(status_code=400, detail="mode must be cloud, local, or auto")

        errors: list[str] = []
        result = ""

        def try_cloud() -> bool:
            if not CLOUD_API_KEY:
                errors.append("cloud api key missing")
                return False
            try:
                nonlocal result
                result = run_ocr(
                    image_path=image_path,
                    page_num=page_num or 1,
                    base_url=CLOUD_BASE_URL,
                    api_key=CLOUD_API_KEY,
                    model=CLOUD_MODEL,
                )
                return True
            except Exception as exc:
                errors.append(f"cloud error: {exc}")
                return False

        def try_local() -> bool:
            try:
                nonlocal result
                result = run_ocr(
                    image_path=image_path,
                    page_num=page_num or 1,
                    base_url=LOCAL_BASE_URL,
                    api_key=LOCAL_API_KEY,
                    model=LOCAL_MODEL,
                )
                return True
            except Exception as exc:
                errors.append(f"local error: {exc}")
                return False

        success = False
        if mode_value == "cloud":
            success = try_cloud()
        elif mode_value == "local":
            success = try_local()
        else:
            success = try_cloud() or try_local()

        if not success:
            raise HTTPException(status_code=500, detail=" | ".join(errors) or "OCR failed")

        text = str(result or "")
        confidence = None

        return JSONResponse({"text": text, "confidence": confidence})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
