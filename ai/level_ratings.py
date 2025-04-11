import os
import cv2
import numpy as np

levels_folder = '/Users/parthpsg/Documents/Professional/Coding/IPD/GameAI/game_levels'

def analyze_level_pattern(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None, None
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None, None
    
    # Extract block positions and sizes
    blocks = []
    total_area = 0
    unique_colors = set()
    
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        # Get color of the block
        mask = np.zeros(img.shape[:2], np.uint8)
        cv2.drawContours(mask, [contour], -1, 255, -1)
        mean_color = cv2.mean(img, mask=mask)[:3]  # BGR values
        color_key = tuple(int(c) for c in mean_color)
        unique_colors.add(color_key)
        total_area += area
        blocks.append((x, y, w, h, area))
    
    blocks = np.array(blocks)
    num_blocks = len(blocks)
    color_variety = len(unique_colors)
    if num_blocks < 5:
        return 0.101, 0.101
    
    # Advanced metrics
    y_positions = blocks[:, 1]
    x_positions = blocks[:, 0]
    
    # Vertical analysis
    y_spread = np.std(y_positions) / img.shape[0]
    y_clusters = len(np.unique(y_positions // 32))  # Number of distinct rows
    
    # Horizontal analysis
    x_spread = np.std(x_positions) / img.shape[1]
    x_clusters = len(np.unique(x_positions // 32))  # Number of distinct columns
    
    # Pattern complexity
    y_diffs = np.diff(np.sort(y_positions))
    x_diffs = np.diff(np.sort(x_positions))
    pattern_regularity = (np.std(y_diffs) + np.std(x_diffs)) / 2
    
    # Spatial distribution
    coverage = total_area / (img.shape[0] * img.shape[1])
    density = num_blocks / (x_clusters * y_clusters) if x_clusters and y_clusters else 0
    
    # Pattern type detection first
    is_spiral = detect_spiral_pattern(blocks)
    has_symmetry = check_symmetry(blocks, img.shape)
    
    # Calculate advanced difficulty
    difficulty = (
        0.25 * min(1.0, y_spread * 2.5) +           # Higher vertical spread scaling
        0.20 * min(1.0, 1 - pattern_regularity/25) + # Increased pattern sensitivity
        0.20 * min(1.0, density * 2.0) +            # Higher density scaling
        0.15 * min(1.0, y_clusters / 10) +          # Adjusted cluster scaling
        0.10 * min(1.0, num_blocks / 50) +          # Block count factor
        0.10 * min(1.0, color_variety / 5)          # Color variety factor
    )
    
    # Pattern type adjustments with higher impact
    if is_spiral:
        difficulty = min(0.999, difficulty + 0.2)    # Increased spiral bonus
    if has_symmetry:
        difficulty = min(0.999, difficulty + 0.1)    # Added symmetry impact on difficulty
    
    # Final normalization for full range
    difficulty = min(0.999, max(0.001, difficulty))  # Allow near-zero values
    
    # Calculate detailed score
    score = (
        0.25 * min(1.0, num_blocks / 45) +          # Block count for score
        0.15 * min(1.0, x_spread) +                 # Base horizontal spread
        0.15 * min(1.0, y_spread) +                 # Base vertical spread
        0.15 * min(1.0, coverage * 2) +             # Adjusted coverage
        0.15 * min(1.0, x_clusters / 25) +          # Scale for actual clusters
        0.15 * min(1.0, color_variety / 4)          # Color variety impact
    ) * 0.7 + 0.2
    
    # Pattern type adjustments (reduced bonuses)
    if is_spiral:
        difficulty = min(0.999, difficulty + 0.08)
        score = min(0.999, score + 0.04)
    if has_symmetry:
        score = min(0.999, score + 0.02)
    
    # Final normalization with wider range
    difficulty = min(0.999, max(0.101, difficulty))
    score = min(0.999, max(0.101, score))
    
    return round(difficulty, 3), round(score, 3)

def detect_spiral_pattern(blocks):
    if len(blocks) < 10:
        return False
    
    center_x = np.mean(blocks[:, 0])
    center_y = np.mean(blocks[:, 1])
    
    # Calculate distances and angles from center
    distances = np.sqrt((blocks[:, 0] - center_x)**2 + (blocks[:, 1] - center_y)**2)
    angles = np.arctan2(blocks[:, 1] - center_y, blocks[:, 0] - center_x)
    
    # Check if distances increase with angle
    sorted_idx = np.argsort(angles)
    sorted_distances = distances[sorted_idx]
    return np.corrcoef(np.arange(len(sorted_distances)), sorted_distances)[0, 1] > 0.6

def check_symmetry(blocks, shape):
    x_positions = blocks[:, 0]
    center_x = shape[1] / 2
    
    left_blocks = len(x_positions[x_positions < center_x])
    right_blocks = len(x_positions[x_positions > center_x])
    
    return abs(left_blocks - right_blocks) / len(blocks) < 0.3

def process_all_levels():
    level_ratings = {}
    all_difficulties = []
    all_scores = []
    
    # First pass: collect all values
    for filename in os.listdir(levels_folder):
        if filename.endswith('.png'):
            image_path = os.path.join(levels_folder, filename)
            difficulty, score = analyze_level_pattern(image_path)
            
            if difficulty is not None and score is not None:
                all_difficulties.append(difficulty)
                all_scores.append(score)
    
    # Calculate actual min and max from the data
    min_difficulty = min(all_difficulties)
    max_difficulty = max(all_difficulties)
    min_score = min(all_scores)
    max_score = max(all_scores)
    
    # Second pass: normalize using actual min/max
    for filename in os.listdir(levels_folder):
        if filename.endswith('.png'):
            image_path = os.path.join(levels_folder, filename)
            difficulty, score = analyze_level_pattern(image_path)
            
            if difficulty is not None and score is not None:
                # Normalize using actual min/max values
                normalized_difficulty = (difficulty - min_difficulty) / (max_difficulty - min_difficulty)
                normalized_score = (score - min_score) / (max_score - min_score)
                
                new_name = f"level_d{normalized_difficulty}_s{normalized_score}.png"
                level_ratings[filename] = {
                    'difficulty': normalized_difficulty,
                    'score': normalized_score,
                    'new_name': new_name
                }
                print(f"Analyzed {filename}: Difficulty={normalized_difficulty}, Score={normalized_score}")
    
    return level_ratings

def rename_levels(ratings):
    for old_name, info in ratings.items():
        old_path = os.path.join(levels_folder, old_name)
        new_path = os.path.join(levels_folder, info['new_name'])
        
        try:
            os.rename(old_path, new_path)
            print(f"Renamed {old_name} to {info['new_name']}")
        except Exception as e:
            print(f"Error renaming {old_name}: {e}")

if __name__ == "__main__":
    print("Analyzing level patterns...")
    ratings = process_all_levels()
    
    if ratings:
        print("\nReady to rename files. Continue? (y/n)")
        if input().lower() == 'y':
            rename_levels(ratings)
            print("Level renaming completed!")
    else:
        print("No valid levels found for analysis.")