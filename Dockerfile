FROM python:3.14.5-slim-bookworm AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

COPY --from=ghcr.io/astral-sh/uv:0.12.4 /uv /usr/local/bin/uv

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY backend/app ./app

COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini

RUN mkdir -p /app/data

EXPOSE 8000

CMD ["sh", "-c", "uv run --locked --no-sync alembic upgrade head && uv run --locked --no-sync uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000"]