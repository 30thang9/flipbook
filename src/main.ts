import './style.css';
import './style/flipbook.css';
import { CanvaFlipbook } from './lib/CanvaFlipbook.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="demo-container">
    <h1>CanvaFlipbook Demo</h1>
    <div id="my-flipbook"></div>
    <div class="controls">
      <button id="prevBtn">Previous</button>
      <button id="nextBtn">Next</button>
      <span id="pageInfo">Page: 1 / 0</span>
      <span id="modeInfo" style="margin-left: 20px; font-weight: bold; color: #646cff;">Mode: --</span>
    </div>
    
    <div class="extensibility-demo">
      <h3>Extension Log</h3>
      <div id="log"></div>
    </div>
  </div>
`;

// Initialize the library
const flipbook = new CanvaFlipbook(document.querySelector('#my-flipbook')!, {
  width: 800,
  height: 600,
  duration: 800,
  displayMode: 'double',
  startPage: 3,
  staggerStep: 2,
  pageNumbers: {
    enabled: true,
    position: 'bottom',
    alignment: 'center',
    startAt: 3, // Start numbering from physical page 3
    firstNumber: 1, // Page 3 will be labeled '1'
    hideOnPages: ['covers'] // Automatically hides numbers on first and last pages
  },
  totalPages: 20,
  onFlip: (page) => {
    updateUI(page);
  }
});

// Add pages
const pages = [
  { content: '<h1>Cover</h1><p>The Journey Begins.</p>', type: 'hard' as const },
  { content: '<h1>Page 2</h1><p>Left side of the first spread.</p>' },
  { content: '<h1>Page 3</h1><p>Right side of the first spread.</p>' },
  { content: '<h1>Page 4</h1><p>Next left page.</p>' },
  { content: '<h1>Page 5</h1><p>Next right page.</p>' },
  { content: '<h1>Page 6</h1><p>Conclusion.</p>', type: 'hard' as const },
];

pages.forEach(p => flipbook.addPage(p.content, p.type));

// Extensibility Example: Extending via Event Listeners
flipbook.on('flip', (page) => {
  const log = document.querySelector('#log')!;
  log.innerHTML += `<div>User flipped to page ${page} at ${new Date().toLocaleTimeString()}</div>`;
});

flipbook.on('init', () => {
  console.log('Flipbook initialized!');
  updateUI(3);
});

// Controls
document.querySelector('#nextBtn')?.addEventListener('click', () => flipbook.next());
document.querySelector('#prevBtn')?.addEventListener('click', () => flipbook.prev());

// Responsive Handling
const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    const containerWidth = entry.contentRect.width;
    const isMobile = containerWidth < 1000;
    
    const newWidth = isMobile ? Math.min(containerWidth - 40, 500) : Math.min(containerWidth, 800);
    const newHeight = newWidth * (600 / 800); 
    
    flipbook.setSize(newWidth, newHeight);
    flipbook.setDisplayMode(isMobile ? 'single' : 'double');
    
    const modeInfo = document.querySelector('#modeInfo')!;
    if (modeInfo) modeInfo.textContent = `Mode: ${isMobile ? 'MOBILE (SINGLE)' : 'DESKTOP (DOUBLE)'}`;
    
    console.log(`Resize: ${newWidth}px, Mode: ${isMobile ? 'single' : 'double'}`);
  }
});

resizeObserver.observe(app);

function updateUI(page: number) {
  const info = document.querySelector('#pageInfo')!;
  info.textContent = `Page: ${page} / ${flipbook.getTotalPages()}`;
}
