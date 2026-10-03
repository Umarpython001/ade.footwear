from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings


settings = get_settings()

# 1. Define the PostgreSQL connection URL
# Format: postgresql://[user]:[password]@[host]:[port]/[database_name]
SQLALCHEMY_DATABASE_URL = settings.direct_connection_string

# 2. Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Create a thread-local session class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create a Base class for your models to inherit from
Base = declarative_base()

# 5. Dependency injection function to handle database sessions per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
