from sqlalchemy import Column, String, Integer, Boolean, Text, JSON, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.sql import func
from ..core.database import Base
import uuid




class orders(Base):
    __tablename__ = 'orders'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, nullable=False, index=True)
    idempotency_key = Column(String, unique=True, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    city_state = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    status = Column(String, nullable=False, default='submitted')
    subtotal_kobo = Column(Integer, nullable=False)
    delivery_fee_kobo = Column(Integer, nullable=False, default=0)
    total_kobo = Column(Integer, nullable=False)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)



class order_items(Base):
    __tablename__ = 'order_items'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = Column(String, nullable=False)
    product_name = Column(String, nullable=False)  # Snapshot of name at time of order
    size = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price_kobo = Column(Integer, nullable=False)  # Snapshot of price charged
    line_total_kobo = Column(Integer, nullable=False)  # Snapshot of total (unit price * quantity)

