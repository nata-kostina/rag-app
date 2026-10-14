import typing

import inngest
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.services.rag_service import RagService


def create_di_middleware(rag_service: RagService, session_factory: async_sessionmaker):
    class DependencyInjectionMiddleware(inngest.Middleware):
        async def transform_input(
            self,
            ctx: inngest.Context | inngest.ContextSync,
            function: inngest.Function[typing.Any],
            steps: inngest.StepMemos,
        ) -> None:
            setattr(ctx, "rag_service", rag_service)  # noqa: B010
            setattr(ctx, "session_factory", session_factory)  # noqa: B010

    return DependencyInjectionMiddleware


def get_rag_service(ctx: inngest.Context | inngest.ContextSync) -> RagService:
    return typing.cast(RagService, getattr(ctx, "rag_service"))  # noqa: B009

def get_session_maker(ctx: inngest.Context | inngest.ContextSync) -> async_sessionmaker:
    return typing.cast(async_sessionmaker, getattr(ctx, "session_factory"))  # noqa: B009
