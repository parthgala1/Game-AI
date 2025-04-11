import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import cv2
from scipy.ndimage import binary_opening
from torch.nn import LSTM

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_DIR = os.path.join(BASE_DIR, 'level_archive')
MODEL_SAVE_DIR = os.path.join(BASE_DIR, 'models')
TRAINING_DATA_DIR = os.path.join(BASE_DIR, "game_levels")
GENERATED_LEVELS_DIR = os.path.join(BASE_DIR, "generated_levels")

# Game Constraints
IMAGE_WIDTH = 800
IMAGE_HEIGHT = 800
BOX_SIZE = 32
GRID_COLS = IMAGE_WIDTH // BOX_SIZE
GRID_ROWS = IMAGE_HEIGHT // BOX_SIZE
PATTERN_SIZE = GRID_ROWS * GRID_COLS
SAFE_ZONE_HEIGHT_PX = 228
SAFE_ZONE_ROWS = SAFE_ZONE_HEIGHT_PX // BOX_SIZE

# Neural Network Models
class Generator(nn.Module):
    def __init__(self, input_dim=2, output_dim=PATTERN_SIZE):
        super(Generator, self).__init__()
        self.main = nn.Sequential(
            nn.Linear(input_dim, 128), nn.LeakyReLU(0.2, inplace=True),
            nn.Linear(128, 256), nn.BatchNorm1d(256), nn.LeakyReLU(0.2, inplace=True),
            nn.Linear(256, 512), nn.BatchNorm1d(512), nn.LeakyReLU(0.2, inplace=True),
            nn.Linear(512, output_dim), nn.Tanh()
        )
    def forward(self, x): return self.main(x)

class Discriminator(nn.Module):
    def __init__(self, input_dim=PATTERN_SIZE):
        super(Discriminator, self).__init__()
        self.main = nn.Sequential(
            nn.Linear(input_dim, 512), nn.LeakyReLU(0.2, inplace=True), nn.Dropout(0.3),
            nn.Linear(512, 256), nn.LeakyReLU(0.2, inplace=True), nn.Dropout(0.3),
            nn.Linear(256, 128), nn.LeakyReLU(0.2, inplace=True),
            nn.Linear(128, 1), nn.Sigmoid()
        )
    def forward(self, x): return self.main(x)

class LevelLSTM(nn.Module):
    def __init__(self, input_size=2, hidden_size=128, num_layers=2, output_size=PATTERN_SIZE):
        super(LevelLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)
        self.tanh = nn.Tanh()
    def forward(self, x, hidden=None):
        if x.ndim == 2: x = x.unsqueeze(1)
        lstm_out, hidden = self.lstm(x, hidden)
        last_output = lstm_out[:, -1, :]
        output = self.fc(last_output)
        output = self.tanh(output)
        return output, hidden
    def init_hidden(self, batch_size):
        weight = next(self.parameters()).data
        hidden = (weight.new(self.num_layers, batch_size, self.hidden_size).zero_(),
                  weight.new(self.num_layers, batch_size, self.hidden_size).zero_())
        return hidden

# Main LevelGAN Class
class LevelGAN:
    def __init__(self, lr_g=0.0002, lr_d=0.0002, lr_lstm=0.001, betas=(0.5, 0.999)):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.generator = Generator(output_dim=PATTERN_SIZE).to(self.device)
        self.discriminator = Discriminator(input_dim=PATTERN_SIZE).to(self.device)
        self.lstm = LevelLSTM(output_size=PATTERN_SIZE).to(self.device)
        self.g_optimizer = optim.Adam(self.generator.parameters(), lr=lr_g, betas=betas)
        self.d_optimizer = optim.Adam(self.discriminator.parameters(), lr=lr_d, betas=betas)
        self.lstm_optimizer = optim.Adam(self.lstm.parameters(), lr=lr_lstm)
        self.adversarial_loss = nn.BCELoss().to(self.device)
        self.pattern_loss = nn.MSELoss().to(self.device)
        os.makedirs(ARCHIVE_DIR, exist_ok=True)
        os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
        os.makedirs(GENERATED_LEVELS_DIR, exist_ok=True)
        self.pattern_history = self._load_pattern_history(TRAINING_DATA_DIR)
        print(f"Loaded {len(self.pattern_history)} patterns from {TRAINING_DATA_DIR}")

    def _load_pattern_history(self, data_folder):
        patterns = []
        if not os.path.exists(data_folder): return patterns
        for filename in os.listdir(data_folder):
            if filename.lower().endswith('.png') and filename.lower().startswith('level_'):
                img_path = os.path.join(data_folder, filename)
                try:
                    difficulty, score = self.parse_level_params(filename)
                    pattern = self.image_to_pattern(img_path)
                    if pattern.size != PATTERN_SIZE: continue
                    if np.sum(pattern) > 0:
                        patterns.append({'pattern': pattern, 'difficulty': difficulty, 'score': score, 'filename': filename})
                except Exception as e: print(f"Error processing file {filename}: {e}")
        return patterns

    def parse_level_params(self, filename):
        parts = filename.split('_')
        try:
            difficulty = float(parts[1][1:])
            score = float(parts[2][1:-4])
        except (IndexError, ValueError):
            print(f"Warning: Could not parse params from '{filename}'. Defaulting to 0.5, 0.5.")
            difficulty, score = 0.5, 0.5
        return difficulty, score

    def image_to_pattern(self, img_path, grid_rows=GRID_ROWS, grid_cols=GRID_COLS, box_size=BOX_SIZE):
        img = cv2.imread(img_path)
        if img is None:
            print(f"Warning: Could not read image {img_path}. Returning empty pattern.")
            return np.zeros(grid_rows * grid_cols)
        if img.shape[0] != IMAGE_HEIGHT or img.shape[1] != IMAGE_WIDTH:
            img = cv2.resize(img, (IMAGE_WIDTH, IMAGE_HEIGHT), interpolation=cv2.INTER_NEAREST)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        pattern = np.zeros(grid_rows * grid_cols)
        img_height, img_width = binary.shape[:2]
        for y in range(grid_rows):
            for x in range(grid_cols):
                y_start, y_end = y * box_size, (y + 1) * box_size
                x_start, x_end = x * box_size, (x + 1) * box_size
                if y_end <= img_height and x_end <= img_width:
                    block = binary[y_start:y_end, x_start:x_end]
                    if block.size > 0 and np.mean(block) > 60:
                        pattern[y * grid_cols + x] = 1
        if np.sum(pattern) == 0:
             print(f"Warning: No platforms detected in {img_path} after processing.")
        return pattern

    def train(self, epochs=100, batch_size=16, use_gan=True, use_lstm=True):
        if not self.pattern_history: print("Error: Cannot train without loaded pattern history."); return
        if not use_gan and not use_lstm: print("Warning: Neither GAN nor LSTM training selected."); return
        print(f"Starting training for {epochs} epochs...")
        patterns_np = np.array([d['pattern'] for d in self.pattern_history], dtype=np.float32)
        conditions = torch.FloatTensor([[d['difficulty'], d['score']] for d in self.pattern_history]).to(self.device)
        real_patterns = torch.from_numpy(patterns_np).to(self.device)
        real_patterns = (real_patterns * 2) - 1
        data_loader = torch.utils.data.DataLoader(torch.utils.data.TensorDataset(conditions, real_patterns), batch_size=batch_size, shuffle=True, drop_last=True)

        for epoch in range(epochs):
            g_epoch_loss, d_epoch_loss, lstm_epoch_loss, num_batches = 0.0, 0.0, 0.0, 0
            for i, (cond_batch, real_batch) in enumerate(data_loader):
                current_batch_size = real_batch.size(0); num_batches += 1
                if use_gan:
                    self.generator.train(); self.discriminator.train()
                    label_real = torch.full((current_batch_size, 1), 0.9, device=self.device)
                    label_fake = torch.full((current_batch_size, 1), 0.1, device=self.device)
                    # Train D
                    self.d_optimizer.zero_grad()
                    d_real_output = self.discriminator(real_batch)
                    d_real_loss = self.adversarial_loss(d_real_output, label_real)
                    fake_patterns = self.generator(cond_batch)
                    d_fake_output = self.discriminator(fake_patterns.detach())
                    d_fake_loss = self.adversarial_loss(d_fake_output, label_fake)
                    d_loss = (d_real_loss + d_fake_loss) / 2
                    d_loss.backward(); self.d_optimizer.step(); d_epoch_loss += d_loss.item()
                    # Train G
                    self.g_optimizer.zero_grad()
                    fake_patterns_g = self.generator(cond_batch)
                    g_output = self.discriminator(fake_patterns_g)
                    g_loss = self.adversarial_loss(g_output, torch.ones_like(g_output))
                    total_g_loss = g_loss
                    total_g_loss.backward(); self.g_optimizer.step(); g_epoch_loss += total_g_loss.item()
                if use_lstm:
                    self.lstm.train(); self.lstm_optimizer.zero_grad()
                    lstm_input = cond_batch.unsqueeze(1)
                    hidden = self.lstm.init_hidden(current_batch_size); hidden = (hidden[0].to(self.device), hidden[1].to(self.device))
                    lstm_output, _ = self.lstm(lstm_input, hidden)
                    loss = self.pattern_loss(lstm_output, real_batch)
                    loss.backward(); torch.nn.utils.clip_grad_norm_(self.lstm.parameters(), max_norm=1.0); self.lstm_optimizer.step(); lstm_epoch_loss += loss.item()

            avg_g = g_epoch_loss / num_batches if use_gan and num_batches > 0 else 0
            avg_d = d_epoch_loss / num_batches if use_gan and num_batches > 0 else 0
            avg_lstm = lstm_epoch_loss / num_batches if use_lstm and num_batches > 0 else 0
            print(f"Epoch [{epoch+1}/{epochs}] - "+ (f"G:{avg_g:.4f} D:{avg_d:.4f} " if use_gan else "") + (f"LSTM:{avg_lstm:.4f}" if use_lstm else ""))
        print("Training finished."); self.save_models()

    def save_models(self):
        try:
            torch.save(self.generator.state_dict(), os.path.join(MODEL_SAVE_DIR, 'generator.pth'))
            torch.save(self.discriminator.state_dict(), os.path.join(MODEL_SAVE_DIR, 'discriminator.pth'))
            torch.save(self.lstm.state_dict(), os.path.join(MODEL_SAVE_DIR, 'lstm.pth'))
            print(f"Models saved to {MODEL_SAVE_DIR}")
        except Exception as e: print(f"Error saving models: {e}")

    def load_models(self):
        loaded_any = False
        try:
            if os.path.exists(os.path.join(MODEL_SAVE_DIR, 'generator.pth')):
                self.generator.load_state_dict(torch.load(os.path.join(MODEL_SAVE_DIR, 'generator.pth')))
                self.generator.to(self.device)
                print("Loaded Generator")
                loaded_any = True
            if os.path.exists(os.path.join(MODEL_SAVE_DIR, 'discriminator.pth')):
                self.discriminator.load_state_dict(torch.load(os.path.join(MODEL_SAVE_DIR, 'discriminator.pth')))
                self.discriminator.to(self.device)
                print("Loaded Discriminator")
                loaded_any = True
            if os.path.exists(os.path.join(MODEL_SAVE_DIR, 'lstm.pth')):
                self.lstm.load_state_dict(torch.load(os.path.join(MODEL_SAVE_DIR, 'lstm.pth')))
                self.lstm.to(self.device)
                print("Loaded LSTM")
                loaded_any = True
            if not loaded_any:
                print("No existing model files found. Training from scratch.")
            return loaded_any
        except Exception as e:
            print(f"Error loading models: {e}. Starting fresh.")
            return False

    def generate_level(self, difficulty, score, use_model='gan'):
        if not (0 <= difficulty <= 1 and 0 <= score <= 1): raise ValueError("Difficulty/score must be 0-1.")
        input_tensor = torch.FloatTensor([[difficulty, score]]).to(self.device)
        raw_output = None
        if use_model == 'gan':
            self.generator.eval()
            with torch.no_grad():
                raw_output = self.generator(input_tensor)
        elif use_model == 'lstm':
            self.lstm.eval()
            with torch.no_grad():
                hidden = self.lstm.init_hidden(1)
                hidden = (hidden[0].to(self.device), hidden[1].to(self.device))
                raw_output, _ = self.lstm(input_tensor.unsqueeze(1), hidden)
        else:
            raise ValueError("Choose 'gan' or 'lstm'.")
        raw_pattern_scaled = (raw_output.cpu().numpy().flatten() + 1) / 2.0
        print("Applying enhanced post-processing...")
        processed_pattern = self._post_process_pattern_enhanced(raw_pattern_scaled, difficulty, score)
        return processed_pattern

    def _post_process_pattern_enhanced(self, pattern_1d, difficulty, score):
        if pattern_1d.size != PATTERN_SIZE:
            print(f"Error: Incorrect pattern size in post-processing: {pattern_1d.size}")
            return np.zeros(PATTERN_SIZE)
    
        # Initialize the pattern_2d array
        pattern_2d = np.zeros((GRID_ROWS, GRID_COLS))
        
        # Easy Level Generation (Simple horizontal patterns)
        if difficulty < 0.3:
            platform_length = 6
            gap_size = 2
            height_levels = [GRID_ROWS - SAFE_ZONE_ROWS - 5, 
                            GRID_ROWS - SAFE_ZONE_ROWS - 8,
                            GRID_ROWS - SAFE_ZONE_ROWS - 11]
            
            current_x = 2
            while current_x < GRID_COLS - platform_length:
                platform_y = np.random.choice(height_levels)
                for x in range(current_x, min(current_x + platform_length, GRID_COLS)):
                    pattern_2d[platform_y, x] = 1.0
                current_x += platform_length + gap_size
    
        # Medium Level Generation (Zigzag patterns)
        elif difficulty < 0.7:
            current_x = 2
            current_y = GRID_ROWS - SAFE_ZONE_ROWS - 5
            direction = 1  # 1 for up, -1 for down
            
            while current_x < GRID_COLS - 4:
                # Main platform
                platform_length = np.random.randint(4, 6)
                for x in range(current_x, min(current_x + platform_length, GRID_COLS)):
                    pattern_2d[current_y, x] = 1.0
                    
                # Branch platform (based on score)
                if score > 0.4 and np.random.random() < 0.6:
                    branch_y = current_y + np.random.choice([-2, 2])
                    if 1 < branch_y < GRID_ROWS - SAFE_ZONE_ROWS:
                        for x in range(current_x + 2, min(current_x + 4, GRID_COLS)):
                            pattern_2d[branch_y, x] = 1.0
                    
                # Move to next position
                current_x += platform_length + 2
                current_y += direction * np.random.randint(2, 4)
                
                # Change direction if reaching bounds
                if current_y <= 2 or current_y >= GRID_ROWS - SAFE_ZONE_ROWS - 2:
                    direction *= -1
                    current_y += direction * 2
    
        # Hard Level Generation (Spiral patterns)
        else:
            center_x, center_y = GRID_COLS // 2, (GRID_ROWS - SAFE_ZONE_ROWS) // 2
            radius = 8
            angle_step = 0.3
            platform_length = 3
            
            for angle in np.arange(0, 6 * np.pi, angle_step):
                current_radius = radius + angle
                x = int(center_x + current_radius * np.cos(angle))
                y = int(center_y + current_radius * np.sin(angle))
                
                if 1 < y < GRID_ROWS - SAFE_ZONE_ROWS and 1 < x < GRID_COLS - platform_length:
                    for dx in range(platform_length):
                        pattern_2d[y, x + dx] = 1.0
                    
                # Add connecting platforms based on score
                if score > 0.6 and np.random.random() < 0.3:
                    connect_y = y + np.random.choice([-2, 2])
                    if 1 < connect_y < GRID_ROWS - SAFE_ZONE_ROWS:
                        for dx in range(-2, 3):
                            if 1 < x + dx < GRID_COLS:
                                pattern_2d[connect_y, x + dx] = 1.0
    
        # Ensure minimum number of platforms
        min_platforms = int(15 + difficulty * 10 + score * 15)
        current_platforms = np.sum(pattern_2d)
        if current_platforms < min_platforms:
            needed = int(min_platforms - current_platforms)
            for _ in range(needed):
                x = np.random.randint(2, GRID_COLS - 4)
                y = np.random.randint(2, GRID_ROWS - SAFE_ZONE_ROWS - 1)
                for dx in range(3):
                    if x + dx < GRID_COLS:
                        pattern_2d[y, x + dx] = 1.0
    
        # Clear safe zone and top row
        pattern_2d[GRID_ROWS - SAFE_ZONE_ROWS:, :] = 0.0
        pattern_2d[0:1, :] = 0.0
        
        print(f"Generated {pattern_2d.sum()} platforms with difficulty {difficulty:.2f}")
        return pattern_2d.flatten()