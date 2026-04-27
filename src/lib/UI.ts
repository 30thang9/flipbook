import type { FlipbookOptions, PageData } from './types.ts';

export class UI {
  private container: HTMLElement;
  private options: Required<FlipbookOptions>;
  private wrapper!: HTMLElement;
  private pageElements: HTMLElement[] = [];

  constructor(container: HTMLElement, options: Required<FlipbookOptions>) {
    this.container = container;
    this.options = options;
  }

  setup() {
    this.container.classList.add('canva-flipbook-container');
    this.container.classList.add(`mode-${this.options.displayMode}`);
    this.container.style.width = `${this.options.width}px`;
    this.container.style.height = `${this.options.height}px`;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'canva-flipbook-wrapper';

    this.container.appendChild(this.wrapper);
  }

  setSize(width: number, height: number) {
    this.options.width = width;
    this.options.height = height;
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
  }

  clear() {
    // Keep the stack elements, remove only pages
    const sheets = this.wrapper.querySelectorAll('.canva-sheet, .canva-page');
    sheets.forEach(s => s.remove());
    this.pageElements = [];
  }

  setDisplayMode(mode: 'single' | 'double') {
    if (this.options.displayMode === mode) return;
    
    this.container.classList.remove(`mode-${this.options.displayMode}`);
    this.options.displayMode = mode;
    this.container.classList.add(`mode-${mode}`);
    this.clear();
  }

  renderPage(data: PageData, index: number) {
    const isDouble = this.options.displayMode === 'double';
    
    if (isDouble) {
      this.renderDoublePage(data, index);
    } else {
      this.renderSinglePage(data, index);
    }
  }

  private renderSinglePage(data: PageData, index: number) {
    const pageEl = document.createElement('div');
    pageEl.className = `canva-page page-${index} ${data.type || 'soft'} ${data.isCover ? 'is-cover' : ''}`;
    pageEl.style.zIndex = `${1000 - index}`;
    
    const spineShadow = document.createElement('div');
    spineShadow.className = 'page-spine-shadow';
    pageEl.appendChild(spineShadow);

    const content = document.createElement('div');
    content.className = 'page-content';
    content.innerHTML = typeof data.content === 'string' ? data.content : data.content.outerHTML;
    pageEl.appendChild(content);
    
    if (this.options.showShadows) {
      const shadow = document.createElement('div');
      shadow.className = 'page-shadow';
      pageEl.appendChild(shadow);
    }

    if (this.options.pageNumbers.enabled) {
      this.addPageNumber(pageEl, index, data);
    }

    this.wrapper.appendChild(pageEl);
    this.pageElements.push(pageEl);
  }

  private renderDoublePage(data: PageData, index: number) {
    const i0 = index - 1;
    const sheetIndex = Math.floor(i0 / 2);
    const isFront = i0 % 2 === 0;

    let sheetEl = this.wrapper.querySelector(`.canva-sheet.sheet-${sheetIndex}`) as HTMLElement;
    if (!sheetEl) {
      sheetEl = document.createElement('div');
      sheetEl.className = `canva-sheet sheet-${sheetIndex}`;
      this.wrapper.appendChild(sheetEl);
      this.pageElements.push(sheetEl);
    }

    const side = document.createElement('div');
    side.className = `page-side ${isFront ? 'front' : 'back'} ${data.type || 'soft'} ${data.isCover ? 'is-cover' : ''}`;

    const spineShadow = document.createElement('div');
    spineShadow.className = 'page-spine-shadow';
    side.appendChild(spineShadow);

    const content = document.createElement('div');
    content.className = 'page-content';
    content.innerHTML = typeof data.content === 'string' ? data.content : data.content.outerHTML;
    side.appendChild(content);
    
    if (this.options.showShadows) {
      const shadow = document.createElement('div');
      shadow.className = 'page-shadow';
      side.appendChild(shadow);
    }

    if (this.options.pageNumbers.enabled) {
      this.addPageNumber(side, index, data);
    }

    sheetEl.appendChild(side);
  }

  updatePageContent(index: number, data: PageData) {
    const isDouble = this.options.displayMode === 'double';
    
    if (isDouble) {
      const i0 = index - 1;
      const sheetIndex = Math.floor(i0 / 2);
      const isFront = i0 % 2 === 0;
      const sheetEl = this.pageElements[sheetIndex];
      if (!sheetEl) return;
      
      const side = sheetEl.querySelector(`.page-side.${isFront ? 'front' : 'back'}`);
      if (side) {
        const content = side.querySelector('.page-content');
        if (content) {
          content.innerHTML = typeof data.content === 'string' ? data.content : data.content.outerHTML;
        }
      }
    } else {
      const el = this.pageElements[index - 1];
      if (!el) return;
      
      const content = el.querySelector('.page-content');
      if (content) {
        content.innerHTML = typeof data.content === 'string' ? data.content : data.content.outerHTML;
      }
    }
  }

  updatePageCoverStatus(index: number, isCover: boolean) {
    const isDouble = this.options.displayMode === 'double';
    const i0 = index - 1;
    
    if (isDouble) {
      const sheetIndex = Math.floor(i0 / 2);
      const isFront = i0 % 2 === 0;
      const sheetEl = this.pageElements[sheetIndex];
      if (!sheetEl) return;
      const side = sheetEl.querySelector(`.page-side.${isFront ? 'front' : 'back'}`);
      if (side) side.classList.toggle('is-cover', isCover);
    } else {
      const el = this.pageElements[index - 1];
      if (el) el.classList.toggle('is-cover', isCover);
    }
  }

  private addPageNumber(container: HTMLElement, index: number, _data: PageData) {
    const config = this.options.pageNumbers;
    
    // Check if we should display on this page
    const startAt = config.startAt ?? 1;
    if (index < startAt) return;
    const hideOn = config.hideOnPages || [];
    
    // In-page specific exclusion (numeric) - Note: 'covers' and 'last' now handled by CSS or dynamic status
    const shouldHide = hideOn.some(val => typeof val === 'number' && val === index);
    if (shouldHide) return;

    // Calculate the label: (current index - start index) + first number
    const label = index - startAt + (config.firstNumber ?? 1);
    
    const positions = config.position === 'both' ? ['top', 'bottom'] : [config.position];
    
    positions.forEach(pos => {
      const el = document.createElement('div');
      el.className = `page-number pos-${pos} align-${config.alignment}`;
      el.textContent = label.toString();
      container.appendChild(el);
    });
  }

  animateTo(pageNumber: number) {
    this.update(pageNumber, true);
  }

  update(pageNumber: number, animate = false) {
    const isDouble = this.options.displayMode === 'double';
    
    if (isDouble) {
      this.updateDouble(pageNumber, animate);
    } else {
      this.updateSingle(pageNumber, animate);
    }
  }

  private updateSingle(pageNumber: number, animate: boolean) {
    this.pageElements.forEach((el, i) => {
      const step = i + 1;
      const isFlipped = step < pageNumber;
      
      el.classList.toggle('flipped', isFlipped);
      
      const stagger = this.options.staggerStep || 0;
      let xOffset = 0;

      if (isFlipped) {
        // Anchor left stack to current spread (top sheet at 0)
        xOffset = ((pageNumber - 2) - i) * stagger;
      } else {
        // Anchor right stack to current spread (top sheet at 0)
        xOffset = (i - (pageNumber - 1)) * stagger;
      }

      el.style.zIndex = isFlipped ? `${10 + i}` : `${50 - i}`;
      if (step === pageNumber) el.style.zIndex = '100';

      const rotate = isFlipped ? -180 : 0;
      const rotateAbs = Math.abs(rotate);

      // Dynamic Stack Volume on individual sheets is removed
      // el.style.setProperty('--stack-width', `${stackWidth}px`);

      // Dynamic Page Shadow (Curl)
      const shadow = el.querySelector('.page-shadow') as HTMLElement;
      if (shadow) {
        const shadowOpacity = Math.sin((rotateAbs / 180) * Math.PI) * 0.4;
        shadow.style.opacity = `${shadowOpacity}`;
      }

      const zOffset = isFlipped ? -i : (this.pageElements.length - i);
      el.style.transform = `rotateY(${rotate}deg) translateX(${xOffset}px) translateZ(${zOffset * 0.2}px)`;
      el.style.transition = animate ? `transform ${this.options.duration}ms cubic-bezier(0.645, 0.045, 0.355, 1)` : 'none';

      // Native 3D Sheet Stacking (Single Mode)
      // All sheets are visible to form the physical stack
      const isTop = step === pageNumber;
      
      el.classList.toggle('is-top-page', isTop);
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.pointerEvents = isTop ? 'auto' : 'none';
    });
  }

  private updateDouble(pageNumber: number, animate: boolean) {
    const currentSheet = Math.floor(pageNumber / 2);
    const isFrontCover = pageNumber === 1;
    const isBackCover = pageNumber >= this.pageElements.length * 2;
    
    this.wrapper.style.transition = animate ? `transform ${this.options.duration}ms ease-in-out` : 'none';
    if (isFrontCover) {
      this.wrapper.style.transform = 'translateX(-25%)';
    } else if (isBackCover) {
      this.wrapper.style.transform = 'translateX(25%)';
    } else {
      this.wrapper.style.transform = 'translateX(0)';
    }

    this.pageElements.forEach((el, i) => {
      const isFlipped = i < currentSheet;
      el.classList.toggle('flipped', isFlipped);

      const stagger = this.options.staggerStep || 0;
      let xOffset = 0;

      if (isFlipped) {
        // Anchor left stack to center (top flipped sheet at 0)
        // Reversed subtract ((currentSheet - 1) - i) because rotateY(-180) flips the X axis
        xOffset = ((currentSheet - 1) - i) * stagger;
      } else {
        // Anchor right stack to center (top active sheet at 0)
        xOffset = (i - currentSheet) * stagger;
      }

      // Z-index management for sheets: Right top sheet gets priority 101, Left top gets 100
      if (i === currentSheet) {
        el.style.zIndex = '101';
      } else if (i === currentSheet - 1) {
        el.style.zIndex = '100';
      } else if (isFlipped) {
        el.style.zIndex = `${10 + i}`;
      } else {
        el.style.zIndex = `${50 - i}`;
      }

      const rotate = isFlipped ? -180 : 0;
      const rotateAbs = Math.abs(rotate);

      // Dynamic Stack Volume on individual sheets is removed
      
      // Dynamic Page Shadow (Curl)
      const shadow = el.querySelector('.page-shadow') as HTMLElement;
      if (shadow) {
        const shadowOpacity = Math.sin((rotateAbs / 180) * Math.PI) * 0.4;
        shadow.style.opacity = `${shadowOpacity}`;
      }

      const isTop = (i === currentSheet) || (i === currentSheet - 1);
      const zOffset = isFlipped ? -i : (this.pageElements.length - i);
      
      el.style.transform = `rotateY(${rotate}deg) translateX(${xOffset}px) translateZ(${zOffset * 0.2}px)`;
      el.style.transition = animate ? `transform ${this.options.duration}ms cubic-bezier(0.645, 0.045, 0.355, 1)` : 'none';
      
      // Aesthetic Depth: Subtle stack shadow based on depth
      if (!isTop) {
        const depthShadow = Math.max(0, 5 - Math.abs(zOffset)) * 2;
        el.style.boxShadow = `${isFlipped ? 1 : -1}px 0 ${depthShadow}px rgba(0,0,0,0.1)`;
      } else {
        el.style.boxShadow = 'none'; // Spread lift handled by CSS
      }

      // Dynamic Spine Depth: Respond to flip angle
      const spineShadows = el.querySelectorAll('.page-spine-shadow');
      spineShadows.forEach((ss: any) => {
        if (isTop) {
          ss.style.opacity = ''; // Use CSS default (0.6)
        } else {
          // As page flips, gutter shadow pulses
          const angleRad = (rotateAbs / 180) * Math.PI;
          const dynamicOpacity = Math.sin(angleRad) * 0.3;
          ss.style.opacity = `${dynamicOpacity}`;
        }
      });

      // Native 3D Sheet Stacking (Double Mode)
      // All sheets are visible to form the physical stack
      el.classList.toggle('is-top-page', isTop);
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.pointerEvents = isTop ? 'auto' : 'none';
    });
  }

  getTotalSheets() {
    return this.pageElements.length;
  }
}
