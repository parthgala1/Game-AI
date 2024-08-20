import pygame
import sys
import random
import math

# Initialize Pygame
pygame.init()

# Screen settings
screen_width = 800
screen_height = 600
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption('Select Your Level')

# Define colors
white = (255, 255, 255)
black = (0, 0, 0)
neon_blue = (0, 255, 255)

# Define fonts
font = pygame.font.Font('assets/fonts/slkscr.ttf', 24)
large_font = pygame.font.Font('assets/fonts/slkscr.ttf', 36)

# Define levels
levels = [
    ("Andromeda - Universe1", "andromeda"),
    ("Milky Way - Universe1", "milky_way"),
    ("Galactica - Universe2", "galactica")
]

# Star field
stars = []
for _ in range(200):
    x = random.randint(0, screen_width)
    y = random.randint(0, screen_height)
    speed = random.uniform(0.1, 0.5)
    stars.append([x, y, speed])

def draw_text(text, font, color, x, y):
    img = font.render(text, True, color)
    text_rect = img.get_rect(center=(x, y))
    screen.blit(img, text_rect)

def draw_glowing_text(text, font, base_color, glow_color, x, y, glow_amount=3):
    for offset in range(glow_amount, 0, -1):
        alpha = 255 // (offset + 1)
        glow_surface = font.render(text, True, (*glow_color, alpha))
        glow_rect = glow_surface.get_rect(center=(x, y))
        screen.blit(glow_surface, (glow_rect.x - offset, glow_rect.y - offset))
        screen.blit(glow_surface, (glow_rect.x + offset, glow_rect.y - offset))
        screen.blit(glow_surface, (glow_rect.x - offset, glow_rect.y + offset))
        screen.blit(glow_surface, (glow_rect.x + offset, glow_rect.y + offset))
    
    text_surface = font.render(text, True, base_color)
    text_rect = text_surface.get_rect(center=(x, y))
    screen.blit(text_surface, text_rect)

def draw_stars():
    for star in stars:
        pygame.draw.circle(screen, white, (int(star[0]), int(star[1])), 1)
        star[0] -= star[2]
        if star[0] < 0:
            star[0] = screen_width
            star[1] = random.randint(0, screen_height)

def draw_glowing_button(surface, color, rect, glow_color=(255, 255, 255), glow_amount=5):
    for offset in range(glow_amount, 0, -1):
        alpha = 255 // (offset + 1)
        glow_rect = rect.inflate(offset * 2, offset * 2)
        pygame.draw.rect(surface, (*glow_color, alpha), glow_rect, border_radius=10)
    pygame.draw.rect(surface, color, rect, border_radius=10)

def main():
    clock = pygame.time.Clock()
    selected_level = None
    level_buttons = []
    
    # Create level buttons
    button_width = 400
    button_height = 50
    spacing = 60
    start_y = 150
    
    for i, (label, level) in enumerate(levels):
        x = screen_width // 2
        y = start_y + i * (button_height + spacing)
        button = pygame.Rect(x - button_width // 2, y, button_width, button_height)
        level_buttons.append((button, level, label))
    
    hover_button = None
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                for button, level, _ in level_buttons:
                    if button.collidepoint(event.pos):
                        selected_level = level
                        return selected_level

        screen.fill(black)
        draw_stars()
        
        # Update star positions
        for star in stars:
            star[0] -= star[2]
            if star[0] < 0:
                star[0] = screen_width
                star[1] = random.randint(0, screen_height)
        
        draw_glowing_text("Select Your Level", large_font, white, neon_blue, screen_width // 2, 100)
        
        mouse_pos = pygame.mouse.get_pos()
        hover_button = None
        
        for button, _, label in level_buttons:
            if button.collidepoint(mouse_pos):
                hover_button = button
                draw_glowing_button(screen, neon_blue, button, white, 10)
            else:
                draw_glowing_button(screen, neon_blue, button)
            draw_text(label, font, black, button.centerx, button.centery)
        
        if hover_button:
            pygame.mouse.set_system_cursor(pygame.SYSTEM_CURSOR_HAND)
        else:
            pygame.mouse.set_system_cursor(pygame.SYSTEM_CURSOR_ARROW)
        
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()