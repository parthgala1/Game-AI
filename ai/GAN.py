# Level Generation Pipeline
import cv2
import numpy as np
import json
import matplotlib.pyplot as plt
import random
from sklearn.ensemble import RandomForestRegressor
import joblib  # Import joblib for model saving/loading
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import cv2
import random
from level_gan import LevelGAN
from PIL import Image
import os
import sys

# Define paths first
levels_folder = '/Users/parthpsg/Documents/Professional/Coding/IPD/FInal-IPD/ai/game_levels'
assets_folder = '/Users/parthpsg/Documents/Professional/Coding/IPD/FInal-IPD/ai/assets'
template_path = os.path.join(assets_folder, 'box_template.png')
background_path = os.path.join(assets_folder, 'space_background.png')
model_path = '/Users/parthpsg/Documents/Professional/Coding/IPD/FInal-IPD/ai/model.pkl'  # Path for saved model

# Update path definitions to match Final-IPD structure
levels_folder = '/Users/parthpsg/Documents/Professional/Coding/IPD/FInal-IPD/ai/game_levels'
assets_folder = '/Users/parthpsg/Documents/Professional/Coding/IPD/FInal-IPD/ai/assets'
template_path = os.path.join(assets_folder, 'box_template.png')
background_path = os.path.join(assets_folder, 'space_background.png')
model_path = '/Users/parthpsg/Documents/Professional/Coding/IPD/FInal-IPD/ai/model.pkl'
output_folder = '/Users/parthpsg/Documents/Professional/Coding/IPD/FInal-IPD/ai/generated_levels'

# Create necessary directories
for directory in [levels_folder, assets_folder, output_folder]:
    os.makedirs(directory, exist_ok=True)

# Now define the functions that use these paths
def get_reference_box_size(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load reference image: {image_path}")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Get average size of platforms
    total_width = 0
    total_height = 0
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        total_width += w
        total_height += h
    
    return (total_width // len(contours), total_height // len(contours))

# Update the reference level path to point to a specific file
reference_level = os.path.join(levels_folder, 'level_d0.5_s0.5.png')  # Use a middle-difficulty level as reference

def process_level_image(image_path, debug=True):
    print(f"Processing image: {image_path}")
    
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not read image {image_path}")
        return []
        
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    print("Applying threshold to isolate boxes...")
    _, binary = cv2.threshold(gray_img, 127, 255, cv2.THRESH_BINARY)
    
    print("Finding contours...")
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    filtered_points = []
    box_size = 32  # Fixed box size
    min_box_area = (box_size - 5) * (box_size - 5)
    max_box_area = (box_size + 5) * (box_size + 5)
    
    print(f"Filtering {len(contours)} detected contours...")
    for contour in contours:
        area = cv2.contourArea(contour)
        x, y, w, h = cv2.boundingRect(contour)
        # Add more precise filtering conditions
        if min_box_area < area < max_box_area and abs(w - box_size) < 5 and abs(h - box_size) < 5:
            filtered_points.append((x, y))
    
    # Ensure at least some points are detected
    if not filtered_points:
        print("Warning: No valid boxes detected, using default layout")
        # Add some default points for training
        filtered_points = [(32*i, 400) for i in range(5)]
    
    if debug:
        print("Generating debug image...")
        debug_img = img.copy()
        for pt in filtered_points:
            cv2.rectangle(debug_img, 
                        pt, 
                        (pt[0] + box_size, pt[1] + box_size), 
                        (0, 255, 0), 
                        1)
        debug_path = os.path.join(os.path.dirname(image_path), 'debug_detection.png')
        cv2.imwrite(debug_path, debug_img)
        print(f"Number of boxes detected: {len(filtered_points)}")
    
    return filtered_points

def normalize_block_size(template, target_size=(32, 32)):
    return cv2.resize(template, target_size)

# Update generate_layout function to use 32px spacing
def generate_layout(desired_difficulty, desired_score, model):
    layout = []
    box_size = 32
    max_x = 768  # Adjusted to be multiple of box_size
    max_y = 672  # Adjusted to leave space for player
    
    if desired_difficulty >= 0.7:  # Hard mode with spirals
        num_platforms = int(12 + desired_score * 10)
        center_x, center_y = 400, 350
        radius = 100  # Increased initial radius
        spiral_spacing = 20  # Controls spiral density
        
        for i in range(num_platforms):
            # Calculate spiral coordinates
            angle = (i * 0.5)  # Slower angle progression
            radius_increment = i * spiral_spacing
            current_radius = radius + radius_increment
            
            # Calculate positions and ensure they're integers
            x_pos = int(center_x + (current_radius * np.cos(angle)))
            y_pos = int(center_y + (current_radius * np.sin(angle)))
            
            # Ensure positions are within bounds and snap to grid
            x_pos = min(max(box_size, x_pos - (x_pos % box_size)), max_x)
            y_pos = min(max(100, y_pos - (y_pos % box_size)), max_y)
            
            layout.append({"x": int(x_pos), "y": int(y_pos), "type": "solid"})
            
    elif desired_difficulty >= 0.3:  # Medium difficulty
        # Zigzag patterns with branching paths
        num_platforms = int(10 + desired_score * 8)
        y_base = 300
        direction = 1
        
        for i in range(num_platforms):
            x_pos = int(box_size + i * (box_size * 1.3))
            if x_pos > max_x: break
            
            y_pos = int(y_base + (i * 32 * direction))
            if y_pos > max_y or y_pos < 100:
                direction *= -1
                y_pos = y_base
                
            layout.append({"x": x_pos, "y": y_pos, "type": "solid"})
            
            # Add branching platforms
            if random.random() < 0.4:
                branch_y = int(y_pos + random.choice([-64, 64]))
                if 100 < branch_y < max_y:
                    layout.append({"x": int(x_pos + box_size), "y": branch_y, "type": "solid"})
                    
    else:  # Easy difficulty
        # Simple horizontal patterns with variations
        num_platforms = int(8 + desired_score * 7)
        y_levels = [200, 300, 400]
        
        for i in range(num_platforms):
            x_pos = int(box_size + i * (box_size * 1.5))
            if x_pos > max_x: break
            
            y_pos = random.choice(y_levels)
            if random.random() < 0.3:
                y_pos += random.choice([-32, 32])
                
            layout.append({"x": int(x_pos), "y": int(y_pos), "type": "solid"})
    
    # Add random variations based on score
    if desired_score > 0.5:
        num_extras = int((desired_score - 0.5) * 10)
        for _ in range(num_extras):
            x_pos = int(random.randint(box_size, max_x))
            y_pos = int(random.randint(100, max_y))
            layout.append({"x": x_pos, "y": y_pos, "type": "solid"})
    
    # Ensure minimum challenge
    if len(layout) < 8:
        base_y = 300
        for i in range(8):
            layout.append({
                "x": int(box_size + i * (box_size * 2)),
                "y": int(base_y + (random.random() - 0.5) * 64),
                "type": "solid"
            })
    
    return layout

# Add at the top with other path definitions
output_folder = '/Users/parthpsg/Documents/Professional/Coding/IPD/Final-IPD/ai/generated_levels'

# Create output directory if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

def render_layout(layout_data, output_path='generated_level.png', difficulty=None, score=None):
    # Load background
    bg = Image.open(background_path).convert('RGBA')
    bg = bg.resize((800, 800))
    
    # Load box template
    box = Image.open(template_path).convert("RGBA")
    box = box.resize((32, 32))
    
    # Define safe zone for player ship (bottom 96 pixels)
    safe_zone_height = 228
    max_y_position = 800 - safe_zone_height
    
    # Handle different layout data formats
    if isinstance(layout_data, list) and isinstance(layout_data[0], dict):
        # Handle dictionary-based layout
        for block in layout_data:
            pos_x = block['x']
            pos_y = block['y']
            if pos_x < 768 and pos_y < max_y_position:
                bg.paste(box, (pos_x, pos_y), box)
    else:
        # Handle array-based layout
        grid = np.array(layout_data).reshape(25, 25)
        for y in range(grid.shape[0]):
            for x in range(grid.shape[1]):
                if grid[y, x] > 0.5:
                    pos_x = x * 32
                    pos_y = y * 32
                    if pos_x < 768 and pos_y < max_y_position:
                        bg.paste(box, (pos_x, pos_y), box)
    
    # Ensure output path has .png extension
    # Update output path handling
    if difficulty is not None and score is not None:
        output_path = f'level_d{difficulty:.3f}_s{score:.3f}.png'
    elif not output_path.endswith('.png'):
        output_path += '.png'
    
    # Ensure the path is in the output folder
    full_output_path = os.path.join(output_folder, output_path)
    
    # Save the image to the new location
    bg.save(full_output_path)
    
    return full_output_path

def extract_features_from_layout(layout):
    num_boxes = len(layout)
    avg_y = np.mean([b['y'] for b in layout])
    spacing = np.std([b['x'] for b in layout])
    return [num_boxes, avg_y, spacing]

# Function to parse difficulty and score from filename
def parse_level_info(filename):
    # Expected format: level_d{difficulty}_s{score}.png
    parts = filename.split('_')
    difficulty = float(parts[1][1:])  # Remove 'd' and convert to float
    score = float(parts[2][1:-4])  # Remove 's' and '.png', convert to float
    return difficulty, score

# Load game levels dynamically from folder
game_levels = []
for filename in os.listdir(levels_folder):
    if filename.startswith('level_') and filename.endswith('.png'):
        difficulty, score = parse_level_info(filename)
        game_levels.append({
            'file': os.path.join(levels_folder, filename),
            'difficulty': difficulty,
            'score': score
        })

def extract_features(layout):
    if not layout:
        return [0, 400, 0]  # Default features for empty layouts
    
    num_boxes = len(layout)
    y_positions = [b['y'] for b in layout]
    x_positions = [b['x'] for b in layout]
    
    avg_y = np.mean(y_positions) if y_positions else 400
    spacing = np.std(x_positions) if len(x_positions) > 1 else 0
    
    return [num_boxes, avg_y, spacing]

# Check if model.pkl exists and load or train model
if os.path.exists(model_path):
    model = joblib.load(model_path)
    print("Loaded model from model.pkl")
else:
    X = []
    y = []
    for level in game_levels:
        try:
            points = process_level_image(level['file'])
            if points:  # Only add if points were detected
                temp_layout = [{"x": int(pt[0]), "y": int(pt[1]), "type": "solid"} 
                             for pt in points]
                features = extract_features(temp_layout)
                X.append(features)
                y.append(level['difficulty'])
        except Exception as e:
            print(f"Error processing {level['file']}: {e}")
            continue
    
    if X and y:  # Only train if we have data
        model = RandomForestRegressor()
        model.fit(X, y)
        joblib.dump(model, model_path)
        print("Trained and saved model to model.pkl")
    else:
        print("Error: No valid training data found")
        exit(1)

# Example usage:
# desired_difficulty = float(input("Enter Difficulty: "))
# desired_score = float(input("Enter Score: "))
# layout_gen = generate_layout(desired_difficulty, desired_score, model)
# render_layout(layout_gen)
# predicted_diff = model.predict([extract_features_from_layout(layout_gen)])[0]
# print(f"New level image saved as 'level_d{desired_difficulty}_s{desired_score}.png'")
# print(f"Predicted difficulty of the generated image: {predicted_diff:.2f}")


class LevelGenerator(nn.Module):
    def __init__(self):
        super(LevelGenerator, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(2, 128),
            nn.LeakyReLU(0.2),
            nn.Linear(128, 256),
            nn.LeakyReLU(0.2),
            nn.Linear(256, 512),
            nn.LeakyReLU(0.2),
            nn.Linear(512, 800),
            nn.Tanh()
        )
        
    def forward(self, x):
        return self.model(x)

def create_target_pattern(difficulty, score):
    pattern = np.zeros(800)
    base_blocks = int(10 + score * 15)  # 10-25 blocks based on score
    
    # Define level structure based on difficulty
    if difficulty < 0.3:  # Easy
        # Simple platform-like pattern
        rows = 2
        blocks_per_row = base_blocks // rows
        for row in range(rows):
            y_pos = 10 + row * 8  # Vertical position (row * 8 for spacing)
            for i in range(blocks_per_row):
                x_pos = 3 + i * 3  # Horizontal position with spacing
                if y_pos * 25 + x_pos < 800:  # Ensure within bounds
                    pattern[y_pos * 25 + x_pos] = 1
    
    elif difficulty < 0.7:  # Medium
        # Staggered platforms with gaps
        rows = 3
        blocks_per_row = base_blocks // rows
        for row in range(rows):
            y_pos = 8 + row * 6
            offset = row % 2 * 2  # Alternate row offset
            for i in range(blocks_per_row):
                x_pos = offset + i * 4
                if y_pos * 25 + x_pos < 800:
                    pattern[y_pos * 25 + x_pos] = 1
    
    else:  # Hard
        # Complex pattern with varied heights
        rows = 4
        blocks_per_row = base_blocks // rows
        for row in range(rows):
            y_base = 6 + row * 5
            for i in range(blocks_per_row):
                y_pos = y_base + int(2 * np.sin(i * 0.5))  # Sinusoidal variation
                x_pos = 2 + i * 3
                if y_pos * 25 + x_pos < 800:
                    pattern[y_pos * 25 + x_pos] = 1
    
    return pattern

def generate_and_train(difficulty, score, num_epochs=100):
    generator = LevelGenerator()
    optimizer = optim.Adam(generator.parameters(), lr=0.001)
    criterion = nn.MSELoss()
    
    # Create target pattern
    target = create_target_pattern(difficulty, score)
    target_tensor = torch.FloatTensor(target)
    
    # Training loop with pattern constraints
    for epoch in range(num_epochs):
        optimizer.zero_grad()
        
        input_params = torch.FloatTensor([[difficulty, score]])
        output = generator(input_params)
        
        # Add structural loss to maintain level-like patterns
        pattern_loss = criterion(output, target_tensor)
        
        # Add spacing constraint
        spacing_loss = torch.mean(torch.abs(output[1:] - output[:-1]))
        
        total_loss = pattern_loss + 0.1 * spacing_loss
        total_loss.backward()
        optimizer.step()
    
    # Generate final layout
    with torch.no_grad():
        generated = generator(torch.FloatTensor([[difficulty, score]]))
        # Apply threshold to ensure clean placement
        generated = (generated > 0.5).float().numpy()[0]
        return generated

def render_enhanced_layout(layout_data, difficulty, score, output_path='generated_level.png'):
    # Load background
    bg = Image.open(background_path).convert('RGBA')
    bg = bg.resize((800, 800))
    
    # Load box template
    box = Image.open(template_path).convert("RGBA")
    box = box.resize((32, 32))
    
    # Convert layout data to 2D grid for better placement
    grid = layout_data.reshape(32, 25)
    
    # Place boxes with proper spacing
    for y in range(grid.shape[0]):
        for x in range(grid.shape[1]):
            if grid[y, x] > 0:
                pos_x = x * 32
                pos_y = y * 32
                if pos_x < 768 and pos_y < 768:  # Ensure within bounds
                    bg.paste(box, (pos_x, pos_y), box)
    
    # Ensure output path has .png extension
    if not output_path.endswith('.png'):
        output_path += '.png'
    
    bg.save(output_path)

def main():
    level_gan = LevelGAN()
    
    while True:
        try:
            difficulty_input = input("Enter Difficulty (0-1): ")
            score_input = input("Enter Score (0-1): ")
            
            # Validate difficulty
            try:
                difficulty = float(difficulty_input)
                if not (0 <= difficulty <= 1):
                    print("Difficulty must be between 0 and 1.")
                    continue
            except ValueError:
                print("Difficulty must be a valid number between 0 and 1.")
                continue
            
            # Validate score
            try:
                score = float(score_input)
                if not (0 <= score <= 1):
                    print("Score must be between 0 and 1.")
                    continue
            except ValueError:
                print("Score must be a valid number between 0 and 1.")
                continue
            
            # Generate and render the level
            layout_data = level_gan.generate_level(difficulty, score)
            
            # Convert NumPy array to list before saving
            layout_list = layout_data.tolist()
            layout_txt_path = os.path.join(output_folder, f'level_d{difficulty:.3f}_s{score:.3f}.txt')
            with open(layout_txt_path, 'w') as f:
                json.dump(layout_list, f, indent=2)
            print(f"Layout data saved to: {layout_txt_path}")
            
            saved_path = render_layout(layout_data=layout_data, 
                                    difficulty=difficulty, 
                                    score=score)
            
            print(f"Generated level saved as '{saved_path}'")
            
        except Exception as e:
            print(f"An error occurred: {e}")
            continue
            
        if input("Generate another level? (y/n): ").lower() != 'y':
            break

if __name__ == "__main__":
    main()