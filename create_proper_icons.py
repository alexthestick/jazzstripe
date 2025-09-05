from PIL import Image, ImageDraw
import os

def create_icon(size, filename):
    # Create a new image with the specified size
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))  # Transparent background
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "J" logo
    margin = size // 8
    draw.rectangle([margin, margin, size - margin, size - margin], fill=(0, 0, 0, 255))
    
    # Add a white "J" in the center
    font_size = size // 3
    # Simple J shape using rectangles
    j_width = size // 4
    j_height = size // 2
    j_x = (size - j_width) // 2
    j_y = (size - j_height) // 2
    
    # Draw J shape
    draw.rectangle([j_x, j_y, j_x + j_width, j_y + j_height], fill=(255, 255, 255, 255))
    draw.rectangle([j_x, j_y + j_height - j_width, j_x + j_width * 2, j_y + j_height], fill=(255, 255, 255, 255))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create the icons
create_icon(192, 'public/icon-192.png')
create_icon(512, 'public/icon-512.png')
print("Proper icons created!")
