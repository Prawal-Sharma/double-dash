#!/usr/bin/env python3
"""
Generate a custom favicon for DoubleDash
Creates a running-themed icon with "DD" text
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_favicon():
    # Create different sizes for various uses
    sizes = [16, 32, 192, 512]
    
    for size in sizes:
        # Create a new image with a gradient background
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw a circular background with gradient effect (Strava orange)
        # Main circle
        circle_margin = size * 0.1
        draw.ellipse(
            [circle_margin, circle_margin, size - circle_margin, size - circle_margin],
            fill=(252, 76, 2, 255)  # Strava orange
        )
        
        # Inner circle for depth effect
        inner_margin = size * 0.15
        draw.ellipse(
            [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
            fill=(255, 106, 53, 255)  # Lighter orange
        )
        
        # Draw "DD" text
        font_size = int(size * 0.35)
        try:
            # Try to use a system font
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
        
        text = "DD"
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center the text
        text_x = (size - text_width) / 2
        text_y = (size - text_height) / 2 - (size * 0.05)  # Slight upward adjustment
        
        # Draw text with shadow for depth
        shadow_offset = max(1, int(size * 0.02))
        draw.text(
            (text_x + shadow_offset, text_y + shadow_offset),
            text,
            font=font,
            fill=(200, 60, 0, 200)  # Dark shadow
        )
        draw.text(
            (text_x, text_y),
            text,
            font=font,
            fill=(255, 255, 255, 255)  # White text
        )
        
        # Add a subtle running shoe accent at the bottom
        if size >= 192:
            # Draw a small stylized running shoe silhouette
            shoe_y = size * 0.7
            shoe_size = size * 0.15
            shoe_points = [
                (size * 0.35, shoe_y),
                (size * 0.65, shoe_y),
                (size * 0.60, shoe_y + shoe_size * 0.5),
                (size * 0.40, shoe_y + shoe_size * 0.5),
            ]
            draw.polygon(shoe_points, fill=(255, 255, 255, 150))
        
        # Save the image
        if size == 16 or size == 32:
            # Save as ICO for favicon
            if size == 32:
                img.save('client/public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])
        
        # Save as PNG for other uses
        if size == 192:
            img.save('client/public/logo192.png', format='PNG')
        elif size == 512:
            img.save('client/public/logo512.png', format='PNG')
    
    print("✅ Favicon and logos generated successfully!")
    print("Files created:")
    print("  - client/public/favicon.ico (16x16, 32x32)")
    print("  - client/public/logo192.png")
    print("  - client/public/logo512.png")

if __name__ == "__main__":
    # Check if PIL/Pillow is installed
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("Installing required package: Pillow")
        os.system("pip3 install Pillow")
        from PIL import Image, ImageDraw, ImageFont
    
    create_favicon()