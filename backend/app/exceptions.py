from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from openai import RateLimitError

from app.documents.exceptions import InvalidDocumentTypeError, MissingFilenameError


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(MissingFilenameError)
    async def missing_filename_handler(request: Request, exc: MissingFilenameError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error_code": "MISSING_FILENAME",
                "message": str(exc),
            },
        )

    @app.exception_handler(InvalidDocumentTypeError)
    async def invalid_document_type_handler(
        request: Request, exc: InvalidDocumentTypeError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error_code": "INVALID_TYPE",
                "detail": str(exc)},
        )
        
    @app.exception_handler(RateLimitError)
    async def rate_limit_handler(request: Request, exc: RateLimitError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error_code": "RATE_LIMIT_EXCEEDED",
                "detail": "Embedding API quota or rate limit exceeded. Please try again later.",
            },
        )