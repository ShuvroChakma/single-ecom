from typing import AsyncGenerator, Optional
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db as get_db_session
from app.core.config import settings


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


# OAuth2 scheme (auto_error=False for optional auth)
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)
http_bearer = HTTPBearer(auto_error=False)


async def get_current_customer_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current customer if authenticated, otherwise return None.
    Used for endpoints that work for both guests and logged-in customers.
    """
    from app.core.security import decode_token
    from app.modules.users.repository import UserRepository, CustomerRepository
    from app.constants.enums import UserType

    # Get token from either source
    actual_token = None
    if token:
        actual_token = token
    elif credentials:
        actual_token = credentials.credentials

    if not actual_token:
        return None

    try:
        payload = decode_token(actual_token)
        user_id = payload.get("sub")
        if not user_id:
            return None

        # Get user
        user_repo = UserRepository(db)
        user = await user_repo.get(user_id)

        if not user or user.user_type != UserType.CUSTOMER:
            return None

        # Get customer profile
        customer_repo = CustomerRepository(db)
        customer = await customer_repo.get_by_user_id(user.id)

        return customer
    except Exception:
        return None
