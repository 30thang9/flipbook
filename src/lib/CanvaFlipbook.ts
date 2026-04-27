import { EventEmitter } from './EventEmitter.ts';
import type { FlipbookOptions, PageData } from './types.ts';
import { UI } from './UI.ts';
import { DEFAULT_OPTIONS } from './Constants.ts';

export class CanvaFlipbook extends EventEmitter {
  private container: HTMLElement;
  private options: Required<FlipbookOptions>;
  private pages: PageData[] = [];
  private currentPage: number = 1;
  private ui: UI;
  private isInitializing: boolean = false;

  constructor(element: HTMLElement, options: FlipbookOptions = {}) {
    super();
    this.container = element;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.ui = new UI(this.container, this.options);
    this.boot();
  }

  private initialJumpDone = false;

  private boot() {
    this.isInitializing = true;
    this.ui.setup();
    this.emit('init');
    this.options.onInit();

    if (this.options.totalPages) {
      for (let i = 1; i <= this.options.totalPages; i++) {
        const isCover = this.options.hasCover && (i === 1 || i === this.options.totalPages);
        this.addPage('', isCover ? 'hard' : 'soft', isCover);
      }
    }

    // Defer activation
    setTimeout(() => {
      this.isInitializing = false;
      this.updateUI();
      if (this.options.startPage > 1) {
        this.jumpTo(this.options.startPage);
      }
    }, 0);
  }

  addPage(content: string | HTMLElement, type: 'hard' | 'soft' = 'soft', isCover: boolean = false) {
    const page: PageData = { content, type, isCover };
    this.pages.push(page);
    this.options.totalPages = this.pages.length;
    this.ui.renderPage(page, this.pages.length);
    
    if (!this.isInitializing) {
      this.updateUI();

      // Trigger startPage jump once enough pages are added
      if (!this.initialJumpDone && this.pages.length >= this.options.startPage) {
        this.jumpTo(this.options.startPage);
        this.initialJumpDone = true;
      }
    }

    this.emit('pageAdded', page);
  }

  private updateUI() {
    this.ui.update(this.currentPage);
    const reportedPage = this.getCurrentPage();
    this.emit('flip', reportedPage);
    this.options.onFlip(reportedPage);
  }

  next() {
    const isDouble = this.options.displayMode === 'double';
    const step = isDouble ? 2 : 1;
    const total = this.pages.length;
    
    // Allow flipping to the very last state where the back cover is on the left
    if (this.currentPage + step <= total + (isDouble ? 1 : 0)) {
      this.flipTo(this.currentPage + step);
    }
  }

  prev() {
    const isDouble = this.options.displayMode === 'double';
    const step = isDouble ? 2 : 1;
    if (this.currentPage - step >= 1) {
      this.flipTo(this.currentPage - step);
    }
  }

  jumpTo(pageNumber: number) {
    const isDouble = this.options.displayMode === 'double';
    const total = this.pages.length;
    const target = Math.max(1, Math.min(pageNumber, total + (isDouble ? 1 : 0)));
    this.currentPage = target;
    this.ui.update(this.currentPage);
    
    const reportedPage = this.getCurrentPage();
    this.emit('flip', reportedPage);
    this.options.onFlip(reportedPage);
  }

  gotoPage(pageNumber: number | string) {
    if (typeof pageNumber === 'string') {
      if (pageNumber === 'first') return this.goToFirstPage();
      if (pageNumber === 'last') return this.goToLastPage();
      if (pageNumber === 'first-labeled') return this.goToFirstLabeledPage();
      if (pageNumber === 'last-labeled') return this.goToLastLabeledPage();
      
      // Attempt to parse string as a label target
      this.goToPageLabel(pageNumber);
      return;
    }
    
    const isDouble = this.options.displayMode === 'double';
    const total = this.pages.length;
    const limit = total + (isDouble ? 1 : 0);
    const target = Math.max(1, Math.min(pageNumber, limit));
    this.flipTo(target);
  }

  goToFirstPage() {
    this.gotoPage(1);
  }

  goToLastPage() {
    const isDouble = this.options.displayMode === 'double';
    const total = this.pages.length;
    this.gotoPage(total + (isDouble ? 1 : 0));
  }

  goToFirstLabeledPage() {
    const config = this.options.pageNumbers;
    if (!config?.enabled) return;
    const startAt = config.startAt ?? 1;
    this.gotoPage(startAt);
  }

  goToLastLabeledPage() {
    const config = this.options.pageNumbers;
    if (!config?.enabled) return;
    
    // Find the last physical page with a valid label
    for (let i = this.pages.length; i >= 1; i--) {
      if (this.getPageLabel(i) !== null) {
        this.gotoPage(i);
        break;
      }
    }
  }

  goToPageLabel(labelValue: number | string) {
    const target = Number(labelValue);
    if (isNaN(target)) return;
    for (let i = 1; i <= this.pages.length; i++) {
       if (this.getPageLabel(i) === target) {
         this.gotoPage(i);
         return;
       }
    }
  }

  private flipTo(pageNumber: number) {
    // Logic for animation trigger handled by UI
    this.currentPage = pageNumber;
    this.ui.animateTo(this.currentPage);
    
    const reportedPage = this.getCurrentPage();
    this.emit('flip', reportedPage);
    this.options.onFlip(reportedPage);
  }

  getCurrentPage() {
    return Math.min(this.currentPage, this.pages.length);
  }

  getCurrentPageLabel() {
    return this.getPageLabel(this.getCurrentPage());
  }

  /**
   * Returns the numeric label for a specific physical page index based on numbering config.
   * Returns null if numbering is disabled for that page or if the index is out of range.
   */
  getPageLabel(physicalIndex: number) {
    const config = this.options.pageNumbers;
    const startAt = config.startAt ?? 1;
    if (physicalIndex < startAt) return null;
    
    const total = this.pages.length;
    const hideOn = config.hideOnPages || [];
    const shouldHide = hideOn.some(val => {
      if (typeof val === 'number') return val === physicalIndex;
      if (val === 'first') return physicalIndex === 1;
      if (val === 'last') return physicalIndex > 0 && physicalIndex === total;
      if (val === 'covers') return physicalIndex === 1 || (physicalIndex > 0 && physicalIndex === total);
      return false;
    });
    if (shouldHide) return null;

    return physicalIndex - startAt + (config.firstNumber ?? 1);
  }

  getTotalPages() {
    return this.pages.length;
  }

  getPageData(index: number) {
    return this.pages[index - 1] || null;
  }

  isFirstPage() {
    return this.currentPage === 1;
  }

  isLastPage() {
    const isDouble = this.options.displayMode === 'double';
    const total = this.pages.length;
    const limit = total + (isDouble ? 1 : 0);
    return this.currentPage >= limit;
  }

  updatePage(index: number, content: string | HTMLElement, type?: 'hard' | 'soft') {
    if (index < 1 || index > this.pages.length) return;
    const page = this.pages[index - 1];
    page.content = content;
    if (type) page.type = type;
    
    this.ui.updatePageContent(index, page);
  }

  updateOptions(newOptions: Partial<FlipbookOptions>) {
    this.options = { ...this.options, ...newOptions };
    this.ui.update(this.currentPage);
  }

  /**
   * Updates the dimensions of the flipbook without re-rendering the entire UI.
   * Useful for responsive layouts.
   */
  setSize(width: number, height: number) {
    this.options.width = width;
    this.options.height = height;
    this.ui.setSize(width, height);
  }

  setDisplayMode(mode: 'single' | 'double') {
    if (this.options.displayMode === mode) return;
    
    // Delegate to UI to handle the shared options change and DOM cleanup
    this.ui.setDisplayMode(mode);
    
    // Re-render all existing pages in the new mode
    this.pages.forEach((page, i) => {
      this.ui.renderPage(page, i + 1);
    });
    
    this.ui.update(this.currentPage);
    this.emit('modeChanged', mode);
  }
}
