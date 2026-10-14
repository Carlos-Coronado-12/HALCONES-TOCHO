import { Play } from '../types/playbook';

/**
 * Exports current play diagram as high-resolution PNG image with Tecmilenio Tactical Card header
 */
export async function exportPlayAsTacticalImage(svgElement: SVGSVGElement, play: Play): Promise<void> {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Solid Background (Clean Dark Tecmilenio Turf)
    ctx.fillStyle = '#0c120e';
    ctx.fillRect(0, 0, width, height);

    // Header Card Panel
    ctx.fillStyle = '#131c16';
    ctx.roundRect(40, 40, width - 80, 130, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#26382c';
    ctx.stroke();

    // Category Badge (Solid Color)
    const isOffense = play.category === 'Ofensiva';
    ctx.fillStyle = isOffense ? '#008744' : '#be123c';
    ctx.roundRect(70, 65, 140, 36, 6);
    ctx.fill();

    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(play.category.toUpperCase(), 140, 90);

    // Title
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(play.name, 235, 95);

    // Subtitle / Formation
    ctx.font = '600 20px "Outfit", sans-serif';
    ctx.fillStyle = '#86efac';
    ctx.fillText(`Formación: ${play.formationName || 'Personalizada'}  •  Halcones Tecmilenio Tocho`, 70, 140);

    // Center Field Frame
    const fieldTop = 190;
    const fieldWidth = width - 80;
    const fieldHeight = 1000;
    
    ctx.save();
    ctx.strokeStyle = '#26382c';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, fieldTop, fieldWidth, fieldHeight);
    ctx.drawImage(image, 40, fieldTop, fieldWidth, fieldHeight);
    ctx.restore();

    // Footer / Assignments / Description Card
    ctx.fillStyle = '#131c16';
    ctx.roundRect(40, 1210, width - 80, 240, 12);
    ctx.fill();
    ctx.strokeStyle = '#26382c';
    ctx.stroke();

    // Notes Title
    ctx.font = 'bold 20px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#00a859';
    ctx.fillText('ASIGNACIONES TÁCTICAS (COACH / QB):', 70, 1250);

    // Description text wrapped
    ctx.font = '400 18px "Outfit", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    
    const desc = play.description || 'Sin asignaciones adicionales.';
    const words = desc.split(' ');
    let line = '';
    let yPos = 1285;
    const maxWidth = width - 140;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, 70, yPos);
        line = words[i] + ' ';
        yPos += 26;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 70, yPos);

    // Footer signature
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText('🦅 HALCONES TECMILENIO • PLAYBOOK PRO', width - 70, 1420);

    // Download file
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${play.name.replace(/\s+/g, '_')}_Tecmilenio.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(blobURL);
  };

  image.src = blobURL;
}
