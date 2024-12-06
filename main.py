# main.py
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Tuple

app = FastAPI()

# Serve static files (our HTML, CSS, and JavaScript)
app.mount("/static", StaticFiles(directory="static"), name="static")


class LineSegment(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


def is_point_on_square(x: int, y: int, size: int = 2024) -> bool:
    """Check if a point lies on the square's perimeter"""
    return (x == 0 and 0 <= y <= size) or \
        (x == size and 0 <= y <= size) or \
        (y == 0 and 0 <= x <= size) or \
        (y == size and 0 <= x <= size)


@app.post("/api/calculate")
async def calculate_lines(line: LineSegment):
    # Validate coordinates are within bounds
    if not all(0 <= coord <= 2024 for coord in [line.x1, line.y1, line.x2, line.y2]):
        raise HTTPException(status_code=400, detail="Coordinates must be between 0 and 2024")

    # Validate points are on the square's perimeter
    if not (is_point_on_square(line.x1, line.y1) and is_point_on_square(line.x2, line.y2)):
        raise HTTPException(status_code=400, detail="Points must be on the square's perimeter")

    # Calculate the result (simplified for now)
    # In a real implementation, you'd need more sophisticated geometry logic
    result = 2  # Example result

    return {"additional_lines": result}


@app.get("/")
async def read_root():
    # Serve the main HTML page
    return FileResponse("static/index.html")
