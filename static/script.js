// static/script.js
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('squareCanvas');
    const ctx = canvas.getContext('2d');
    const resultDiv = document.getElementById('result');
    
    let isDrawing = false;
    let startPoint = null;
    let currentPoint = null;
    const SNAP_THRESHOLD = 20;  // Pixels to snap to edge
    
    function findNearestEdgePoint(point) {
        // Convert point to proper coordinates
        const x = point.x;
        const y = point.y;
        
        // Find distances to each edge
        const distToLeft = Math.abs(x);
        const distToRight = Math.abs(x - canvas.width);
        const distToTop = Math.abs(y);
        const distToBottom = Math.abs(y - canvas.height);
        
        // Find the minimum distance
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        // Only snap if we're close enough to an edge
        if (minDist > SNAP_THRESHOLD) {
            return null;
        }
        
        // Return the point on the nearest edge
        if (minDist === distToLeft) return { x: 0, y: y };
        if (minDist === distToRight) return { x: canvas.width, y: y };
        if (minDist === distToTop) return { x: x, y: 0 };
        return { x: x, y: canvas.height };
    }
    
    function isCorner(point) {
        const corners = [
            {x: 0, y: 0},
            {x: canvas.width, y: 0},
            {x: 0, y: canvas.height},
            {x: canvas.width, y: canvas.height}
        ];
        
        return corners.some(corner => 
            Math.abs(point.x - corner.x) < SNAP_THRESHOLD && 
            Math.abs(point.y - corner.y) < SNAP_THRESHOLD
        );
    }

    function drawSquare() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Add visual indicators for edges
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.2)';
        ctx.lineWidth = SNAP_THRESHOLD * 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
    }
    
    function drawLine(start, end, isValid) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = isValid ? 'blue' : 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw points at the ends
        ctx.beginPath();
        ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
        ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = isValid ? 'blue' : 'red';
        ctx.fill();
    }
    
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Only start drawing if we're near an edge
        const snappedPoint = findNearestEdgePoint(point);
        if (snappedPoint) {
            startPoint = snappedPoint;
            isDrawing = true;
        }
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Snap to edge if we're close
        currentPoint = findNearestEdgePoint(point) || point;
        
        drawSquare();
        // Check if both points are on edges
        const isValid = startPoint && (findNearestEdgePoint(currentPoint) !== null);
        drawLine(startPoint, currentPoint, isValid);
    });
    
    canvas.addEventListener('mouseup', async function() {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Ensure end point is on an edge
        if (!currentPoint || !findNearestEdgePoint(currentPoint)) {
            drawSquare();
            resultDiv.textContent = 'Line must connect two points on the square edges!';
            return;
        }
        
        // Convert to problem coordinates (0-2024)
        const data = {
            x1: Math.round((startPoint.x / canvas.width) * 2024),
            y1: Math.round((startPoint.y / canvas.height) * 2024),
            x2: Math.round((currentPoint.x / canvas.width) * 2024),
            y2: Math.round((currentPoint.y / canvas.height) * 2024)
        };
        
        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            // Show both the number of lines and explanation
            resultDiv.innerHTML = `
                <p><strong>${result.message}</strong></p>
                <p>${result.explanation}</p>
            `;
            
            // Draw the final line with proper styling
            drawSquare();
            drawLine(startPoint, currentPoint, true);
        } catch (error) {
            resultDiv.textContent = 'Error calculating result';
        }
    });
    
    // Initial square drawing with snap zones
    drawSquare();
});