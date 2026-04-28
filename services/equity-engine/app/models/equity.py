"""Pydantic models for the equity engine API."""

from pydantic import BaseModel, Field
from enum import Enum


class TransportMode(str, Enum):
    walk = "walk"
    bike = "bike"
    transit = "transit"
    car = "car"
    train = "train"


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class EquityParticipant(BaseModel):
    id: str
    origin: GeoPoint
    mode: TransportMode = TransportMode.transit
    time_weight: float = Field(0.5, ge=0, le=1)
    money_weight: float = Field(0.5, ge=0, le=1)
    max_time: int = Field(60, ge=5, le=480, description="Max travel time in minutes")
    max_money: float | None = Field(None, ge=0, description="Max transport cost in EUR")


class EquityRequest(BaseModel):
    trip_id: str
    participants: list[EquityParticipant] = Field(..., min_length=2, max_length=20)
    search_radius_km: float = Field(15.0, ge=1, le=100)
    grid_resolution: int = Field(20, ge=5, le=50, description="Grid points per axis")


class BurdenBreakdown(BaseModel):
    user_id: str
    burden: float
    duration_min: float
    distance_km: float
    cost_eur: float


class EquityZoneResult(BaseModel):
    center: GeoPoint
    label: str | None = None
    equity_score: float
    composite_score: float
    max_burden: float
    mean_burden: float
    std_dev_burden: float
    burdens: dict[str, float]
    breakdowns: list[BurdenBreakdown]
    rank: int
    venues_nearby: int = 0


class EquityResponse(BaseModel):
    trip_id: str
    zones: list[EquityZoneResult]
    calculation_time_ms: int
    grid_points_evaluated: int
    valid_points: int
