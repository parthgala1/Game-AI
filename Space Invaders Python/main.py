import pygame
import sys
from space_invaders.home_page import main as home_page_main

# Initialize Pygame
pygame.init()

# Screen settings
screen_width = 800
screen_height = 600
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption('Game Launcher')

def main():
    # Run the home page
    home_page_main()

    # Run the level selection page
    # This will be done in the home_page.py after handling user input
    pygame.quit()
    sys.exit()

if __name__ == '__main__':
    main()
