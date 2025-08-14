const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateFavicon() {
    const sizes = [16, 32, 192, 512];
    
    sizes.forEach(size => {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Draw circular background with gradient effect
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, '#ff6a35');  // Lighter orange in center
        gradient.addColorStop(1, '#fc4c02');  // Strava orange at edge
        
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - size*0.05, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw "DD" text
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(size * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow for text
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = size * 0.02;
        ctx.shadowOffsetX = size * 0.01;
        ctx.shadowOffsetY = size * 0.01;
        
        ctx.fillText('DD', size/2, size/2 - size*0.02);
        
        // Add running shoe icon for larger sizes
        if (size >= 192) {
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(size * 0.35, size * 0.72);
            ctx.lineTo(size * 0.65, size * 0.72);
            ctx.lineTo(size * 0.62, size * 0.78);
            ctx.lineTo(size * 0.38, size * 0.78);
            ctx.closePath();
            ctx.fill();
        }
        
        // Save the image
        const buffer = canvas.toBuffer('image/png');
        let filename;
        
        if (size === 16 || size === 32) {
            filename = `client/public/favicon-${size}.png`;
        } else {
            filename = `client/public/logo${size}.png`;
        }
        
        fs.writeFileSync(path.join(__dirname, filename), buffer);
        console.log(`✅ Generated ${filename}`);
    });
    
    // Also save the 32x32 as favicon.ico
    const canvas32 = createCanvas(32, 32);
    const ctx32 = canvas32.getContext('2d');
    
    const gradient = ctx32.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, '#ff6a35');
    gradient.addColorStop(1, '#fc4c02');
    
    ctx32.beginPath();
    ctx32.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx32.fillStyle = gradient;
    ctx32.fill();
    
    ctx32.fillStyle = 'white';
    ctx32.font = 'bold 13px Arial';
    ctx32.textAlign = 'center';
    ctx32.textBaseline = 'middle';
    ctx32.fillText('DD', 16, 15);
    
    const buffer32 = canvas32.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'client/public/favicon.ico'), buffer32);
    console.log('✅ Generated favicon.ico');
}

// Check if canvas module is installed
try {
    require('canvas');
    generateFavicon();
} catch (e) {
    console.log('Canvas module not found. Installing...');
    const { execSync } = require('child_process');
    execSync('cd client && npm install canvas', { stdio: 'inherit' });
    generateFavicon();
}