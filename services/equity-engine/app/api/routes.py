"""Equity Engine API routes."""

from fastapi import APIRouter, HTTPException

from app.models.equity import EquityRequest, EquityResponse
from app.algorithms.equity_optimizer import compute_equity

router = APIRouter()


@router.post("/calculate", response_model=EquityResponse)
async def calculate_equity(request: EquityRequest):
    """Calculate equitable meeting zones for a group of participants."""
    try:
        result = await compute_equity(request)
        if not result.zones:
            raise HTTPException(
                status_code=422,
                detail="No valid meeting zones found. Constraints may be too restrictive.",
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.post("/quick", response_model=EquityResponse)
async def quick_equity(request: EquityRequest):
    """Quick calculation with reduced grid resolution for real-time previews."""
    request.grid_resolution = min(request.grid_resolution, 10)
    request.search_radius_km = min(request.search_radius_km, 10)
    return await calculate_equity(request)
