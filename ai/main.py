from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
from PIL import Image
import io
import sys
import os
from pydantic import BaseModel

# Set up proper directory paths
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Import from GAN.py
from GAN import LevelGAN, render_layout, generate_layout, model

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

level_gan = LevelGAN()

# Define request model
class LevelRequest(BaseModel):
    difficulty: float = 0.5
    score: float = 0.5

@app.post("/generate-level")
async def generate_level(request: LevelRequest):
    try:
        # Validate inputs
        if not (0 <= request.difficulty <= 1) or not (0 <= request.score <= 1):
            raise HTTPException(status_code=400, detail="Difficulty and score must be between 0 and 1")
        
        # Generate pattern using LevelGAN
        pattern = level_gan.generate_level(request.difficulty, request.score, use_model='gan')
        
        # Convert pattern to layout format
        layout = []
        grid_rows = 25
        grid_cols = 25
        box_size = 32
        
        # Convert 1D pattern to 2D grid
        pattern_2d = pattern.reshape(grid_rows, grid_cols)
        
        # Create layout from pattern
        for y in range(grid_rows):
            for x in range(grid_cols):
                if pattern_2d[y, x] > 0.5:  # Threshold for platform placement
                    pos_x = x * box_size
                    pos_y = y * box_size
                    if pos_y < (800 - 228):  # Respect safe zone
                        layout.append({
                            'x': int(pos_x),
                            'y': int(pos_y),
                            'type': 'solid'
                        })
        
        # Create a BytesIO object to store the image
        img_byte_arr = io.BytesIO()
        
        # Render the layout
        bg = Image.open(os.path.join(current_dir, 'assets/space_background.png')).convert('RGBA')
        bg = bg.resize((800, 800))
        
        box = Image.open(os.path.join(current_dir, 'assets/box_template.png')).convert("RGBA")
        box = box.resize((32, 32))
        
        # Place boxes according to layout with pattern consideration
        for block in layout:
            pos_x = block['x']
            pos_y = block['y']
            # Create platform groups based on pattern
            if pos_x < 768 and pos_y < (800 - 228):
                bg.paste(box, (pos_x, pos_y), box)
                
                # Add connecting platforms based on difficulty
                if request.difficulty > 0.5:
                    # Add vertical connections
                    if any(b['x'] == pos_x and abs(b['y'] - pos_y) == box_size for b in layout):
                        bg.paste(box, (pos_x, pos_y + box_size), box)
                    
                    # Add horizontal connections
                    if any(b['y'] == pos_y and abs(b['x'] - pos_x) == box_size for b in layout):
                        bg.paste(box, (pos_x + box_size, pos_y), box)
        
        # Save the final image to BytesIO
        bg.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return StreamingResponse(img_byte_arr, media_type="image/png")
    
    except Exception as e:
        print(f"Error generating level: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate level: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)