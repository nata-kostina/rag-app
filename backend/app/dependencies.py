import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


async def get_session(request: Request):
    async with request.app.state.session_factory() as session:
        yield session


security = HTTPBearer()


async def get_user_id_from_header(credentials: HTTPAuthorizationCredentials = Depends(security)) -> uuid.UUID:  # noqa: B008
    try:
        return uuid.UUID(credentials.credentials)
    except ValueError:
        raise HTTPException(  # noqa: B904
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid UUID format in Authorization header"
        )
