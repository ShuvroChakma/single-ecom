from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db as get_db_session

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session
