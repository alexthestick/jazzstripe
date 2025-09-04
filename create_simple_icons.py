import base64

# Simple 1x1 black PNG (base64 encoded)
black_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

# Create 192x192 icon by repeating the 1x1 pixel
def create_icon(size, filename):
    # Decode the base64 PNG
    png_data = base64.b64decode(black_png)
    
    # For now, just create a simple file
    with open(filename, 'wb') as f:
        f.write(png_data)
    
    print(f"Created {filename}")

create_icon(192, 'public/icon-192.png')
create_icon(512, 'public/icon-512.png')
print("Simple icons created!")
