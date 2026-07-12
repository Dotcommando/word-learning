const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function createUploadIcon(): SVGSVGElement {
  const svg = createIconSvg();

  appendPath(svg, 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
  appendPolyline(svg, '17 8 12 3 7 8');
  appendLine(svg, '12', '3', '12', '15');

  return svg;
}

export function createEyeIcon(): SVGSVGElement {
  const svg = createIconSvg();

  appendPath(svg, 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0');
  appendCircle(svg, '12', '12', '3');

  return svg;
}

export function createEyeOffIcon(): SVGSVGElement {
  const svg = createIconSvg();

  appendPath(svg, 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49');
  appendPath(svg, 'M14.084 14.158a3 3 0 0 1-4.242-4.242');
  appendPath(svg, 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143');
  appendPath(svg, 'm2 2 20 20');

  return svg;
}

export function createMoonIcon(): SVGSVGElement {
  const svg = createIconSvg();

  appendPath(svg, 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z');

  return svg;
}

export function createSunIcon(): SVGSVGElement {
  const svg = createIconSvg();

  appendCircle(svg, '12', '12', '4');
  appendPath(svg, 'M12 2v2');
  appendPath(svg, 'M12 20v2');
  appendPath(svg, 'm4.93 4.93 1.41 1.41');
  appendPath(svg, 'm17.66 17.66 1.41 1.41');
  appendPath(svg, 'M2 12h2');
  appendPath(svg, 'M20 12h2');
  appendPath(svg, 'm6.34 17.66-1.41 1.41');
  appendPath(svg, 'm19.07 4.93-1.41 1.41');

  return svg;
}

export function createBookIcon(): SVGSVGElement {
  const svg = createIconSvg();

  svg.classList.add('_icon__state');
  appendPath(svg, 'M12 7v14');
  appendPath(svg, 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z');

  return svg;
}

export function createChevronIcon(): SVGSVGElement {
  const svg = createIconSvg();

  appendPath(svg, 'm6 9 6 6 6-6');

  return svg;
}

function createIconSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');

  svg.classList.add('_icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  return svg;
}

function appendPath(svg: SVGSVGElement, d: string): void {
  const path = document.createElementNS(SVG_NAMESPACE, 'path');

  path.setAttribute('d', d);
  svg.append(path);
}

function appendPolyline(svg: SVGSVGElement, points: string): void {
  const polyline = document.createElementNS(SVG_NAMESPACE, 'polyline');

  polyline.setAttribute('points', points);
  svg.append(polyline);
}

function appendLine(svg: SVGSVGElement, x1: string, y1: string, x2: string, y2: string): void {
  const line = document.createElementNS(SVG_NAMESPACE, 'line');

  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  svg.append(line);
}

function appendCircle(svg: SVGSVGElement, cx: string, cy: string, r: string): void {
  const circle = document.createElementNS(SVG_NAMESPACE, 'circle');

  circle.setAttribute('cx', cx);
  circle.setAttribute('cy', cy);
  circle.setAttribute('r', r);
  svg.append(circle);
}
