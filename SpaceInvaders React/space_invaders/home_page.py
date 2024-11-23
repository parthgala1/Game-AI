import pygame
import sys
import math
import random
from database.db import DatabaseManager
from space_invaders.level_selection import main as level_selection_main

pygame.init()

# Screen settings
screen_width = 800
screen_height = 600
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption('Space Invaders - Welcome Commander')

# Colors
white = (255, 255, 255)
black = (0, 0, 0)
neon_blue = (0, 255, 255)
neon_pink = (255, 20, 147)
dark_blue = (0, 0, 100)
semi_transparent_black = (0, 0, 0, 128)

# Fonts
title_font = pygame.font.Font('assets/fonts/slkscr.ttf', 40)
font = pygame.font.Font('assets/fonts/slkscr.ttf', 20)
small_font = pygame.font.Font('assets/fonts/slkscr.ttf', 16)

# Load and scale images
bg = pygame.image.load("assets/img/bg.png")
bg = pygame.transform.scale(bg, (screen_width, screen_height))
logo = pygame.image.load("assets/img/space_invaders_logo.png")
logo = pygame.transform.scale(logo, (300, 150))
spaceship = pygame.image.load("assets/img/spaceship.png")
spaceship = pygame.transform.scale(spaceship, (80, 80))

# Particle system
particles = []

class Particle:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = random.randint(1, 2)
        self.color = random.choice([neon_blue, neon_pink, white])
        self.speed = random.uniform(0.5, 1.5)

    def move(self):
        self.y += self.speed
        if self.y > screen_height:
            self.y = 0
            self.x = random.randint(0, screen_width)

    def draw(self):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.size)

# Create particles
for _ in range(50):
    particles.append(Particle(random.randint(0, screen_width), random.randint(0, screen_height)))

def draw_particles():
    for particle in particles:
        particle.move()
        particle.draw()

def draw_text(text, font, color, x, y, background_color=None):
    img = font.render(text, True, color)
    text_rect = img.get_rect(center=(x, y))
    if background_color:
        bg_rect = text_rect.copy()
        bg_rect.inflate_ip(20, 10)
        pygame.draw.rect(screen, background_color, bg_rect, border_radius=5)
    screen.blit(img, text_rect)

def draw_glowing_text(text, font, base_color, glow_color, x, y, glow_amount=2, background_color=None):
    if background_color:
        text_surface = font.render(text, True, base_color)
        text_rect = text_surface.get_rect(center=(x, y))
        bg_rect = text_rect.copy()
        bg_rect.inflate_ip(20, 10)
        pygame.draw.rect(screen, background_color, bg_rect, border_radius=5)

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

def draw_button(rect, text, font, text_color, button_color, hover_color):
    mouse_pos = pygame.mouse.get_pos()
    if rect.collidepoint(mouse_pos):
        pygame.draw.rect(screen, hover_color, rect, border_radius=10)
        pygame.draw.rect(screen, text_color, rect, 2, border_radius=10)
    else:
        pygame.draw.rect(screen, button_color, rect, border_radius=10)
        pygame.draw.rect(screen, text_color, rect, 1, border_radius=10)
    
    draw_text(text, font, text_color, rect.centerx, rect.centery)

def main():
    db_manager = DatabaseManager(
        host="localhost",
        dbname="postgres",
        user="postgres",
        password="Sameer4224",
        port=5432
    )
    
    db_manager.get_db_connection()
    db_manager.setup_database()

    clock = pygame.time.Clock()
    username_box = pygame.Rect(screen_width // 2 - 150, screen_height // 2 - 10, 300, 40)
    age_box = pygame.Rect(screen_width // 2 - 150, screen_height // 2 + 70, 300, 40)
    username_active = False
    age_active = False
    username = ''
    age = ''
    start_button = pygame.Rect(screen_width // 2 - 100, screen_height // 2 + 140, 200, 40)

    while True:
        current_time = pygame.time.get_ticks()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                if username_box.collidepoint(event.pos):
                    username_active = True
                    age_active = False
                elif age_box.collidepoint(event.pos):
                    age_active = True
                    username_active = False
                elif start_button.collidepoint(event.pos) and username and age:
                    print(f"Starting game with username: {username}, age: {age}")
                    db_manager.insert_user(username, int(age))
                    selected_level = level_selection_main()
                    if selected_level:
                        if selected_level == "andromeda":
                            import space_invaders.universe1.andromeda as andromeda
                            andromeda.main()
                        elif selected_level == "milky_way":
                            import space_invaders.universe1.milky_way as milky_way
                            milky_way.main()
                        elif selected_level == "galactica":
                            import space_invaders.universe2.galactica as galactica
                            galactica.main()
                else:
                    username_active = False
                    age_active = False
            if event.type == pygame.KEYDOWN:
                if username_active:
                    if event.key == pygame.K_BACKSPACE:
                        username = username[:-1]
                    else:
                        username += event.unicode
                elif age_active:
                    if event.key == pygame.K_BACKSPACE:
                        age = age[:-1]
                    elif event.unicode.isdigit():
                        age += event.unicode

        screen.blit(bg, (0, 0))
        draw_particles()

        # Draw animated logo
        logo_y = math.sin(current_time * 0.002) * 5 + 80
        logo_rect = logo.get_rect(center=(screen_width // 2, logo_y))
        screen.blit(logo, logo_rect)

        # Draw animated spaceship
        spaceship_x = math.sin(current_time * 0.001) * 30 + screen_width - 100
        spaceship_y = math.cos(current_time * 0.002) * 20 + screen_height - 100
        screen.blit(spaceship, (spaceship_x, spaceship_y))

        # Draw input boxes with labels
        draw_glowing_text('Enter your callsign, Commander:', font, white, neon_blue, screen_width // 2, screen_height // 2 - 40, background_color=semi_transparent_black)
        pygame.draw.rect(screen, dark_blue, username_box, border_radius=2)
        pygame.draw.rect(screen, neon_blue if username_active else neon_pink, username_box, 2, border_radius=5)
        draw_text(username, font, white, username_box.centerx, username_box.centery)

        draw_glowing_text('Enter your age:', font, white, neon_blue, screen_width // 2, screen_height // 2 + 50, background_color=semi_transparent_black)
        pygame.draw.rect(screen, dark_blue, age_box, border_radius=2)
        pygame.draw.rect(screen, neon_blue if age_active else neon_pink, age_box, 2, border_radius=5)
        draw_text(age, font, white, age_box.centerx, age_box.centery)

        # Draw start button
        draw_button(start_button, 'Start Mission', small_font, black, neon_blue, neon_pink)

        pygame.display.flip()
        clock.tick(60)