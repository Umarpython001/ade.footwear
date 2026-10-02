from sqlalchemy import Column, String, Integer, Boolean, Text, JSON, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.sql import func
from ..core.database import Base
import uuid



class products(Base):
    __tablename__ = 'products'

    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, index=True)
    price_kobo = Column(Integer, nullable=False)
    images = Column(JSON, nullable=True)  # Stores list of { src, alt, focus }
    sizes = Column(JSON, nullable=True)   # Stores list of { size, available }
    active = Column(Boolean, default=False, nullable=False)
    featured = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Enforce that price must be greater than 0 at the database level
    __table_args__ = (
        CheckConstraint('price_kobo > 0', name='check_price_positive'),
    )