export interface FlipbookOptions {
  width?: number;
  height?: number;
  duration?: number;
  startPage?: number;
  showShadows?: boolean;
  displayMode?: 'single' | 'double';
  staggerStep?: number;
  totalPages?: number;
  hasCover?: boolean; // Determines if the first and last generated pages are covers
  onInit?: () => void;
  onFlip?: (page: number) => void;
  pageNumbers?: {
    enabled?: boolean;
    position?: 'top' | 'bottom' | 'both';
    alignment?: 'left' | 'center' | 'right' | 'outer' | 'inner';
    startAt?: number; // Physical page index to start displaying numbers
    firstNumber?: number; // Numeric value for the first displayed page
    hideOnPages?: (number | 'first' | 'last' | 'covers')[]; // Physical physical page indices or semantic aliases ('first', 'last', 'covers')
  };
}

export interface PageData {
  content: string | HTMLElement;
  type?: 'hard' | 'soft';
  isCover?: boolean; // If true, applies cover aesthetics (no spine, hard edge)
}
