from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a new image with black background
    img = Image.new('RGB', (size, size), color='black')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", size//3)
    except:
        font = ImageFont.load_default()
    
    # Draw a white "J" in the center
    text = "J"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create both icon sizes
create_icon(192, 'icon-192.png')
create_icon(512, 'icon-512.png')
print("Icons created successfully!")
