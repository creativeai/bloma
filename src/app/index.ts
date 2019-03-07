export type CSSColor = string;

export type RGBAColor = [number, number, number, number];

export type HorizontalAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'middle' | 'bottom';
export interface Alignment {
  horizontal: HorizontalAlignment;
  vertical: VerticalAlignment;
}
export type FontFamily = string;

export interface ImageSize {
  width: Pixels;
  height: Pixels;
}

export interface SizeFormat {
  category: string;
  name: string;
  width: Pixels;
  height: Pixels;
  renderWidth: Pixels;
  renderHeight: Pixels;
}

export interface SizeFormatGroup {
  name: string;
  sizes: SizeFormat[];
}

export interface FontSize {
  textSize: number;
  leading: number;
  levelSpacing?: number;
}

export interface TextStyle {
  fontFamily?: FontFamily;
  letterSpacing?: number;
  textColors?: CSSColor[];
  textMaskUrl?: string;
  shadowColor?: CSSColor;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  flipShadowTextColor?: boolean;
  fontSizes?: FontSize[];
  levelSizeRatio?: number;
  levelSpacingRatio?: number;
  isAllCaps?: boolean;
  isNoCaps?: boolean;
}

export interface SaturateStyle {
  amount?: number;
}

export interface AddNoiseStyle {
  amount?: number;
}

export interface GradientMapStyle {
  from: CSSColor;
  to: CSSColor;
}

export type CompositeOperation =
  | 'source-over'
  | 'source-in'
  | 'source-out'
  | 'source-atop'
  | 'destination-over'
  | 'destination-in'
  | 'destination-out'
  | 'destination-atop'
  | 'lighter'
  | 'copy'
  | 'xor'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface ImageBlendStyle {
  blendImageUrl: string;
  anchor: 'center' | 'topLeft';
  compositeOperation: CompositeOperation;
}

export interface ColorBlendStyle {
  color: CSSColor;
  compositeOperation: CompositeOperation;
}

export type Style =
  | TextStyle
  | SaturateStyle
  | AddNoiseStyle
  | GradientMapStyle
  | ImageBlendStyle
  | ColorBlendStyle;

export interface Styles {
  name: string;
  tileImg?: string;
  elementTypes: ElementType[];
  text?: { [l in TextHeadingLevel]?: TextStyle };
  saturate?: SaturateStyle;
  addNoise?: AddNoiseStyle;
  gradientMap?: GradientMapStyle;
  imageBlend?: ImageBlendStyle;
  colorBlend?: ColorBlendStyle;
}

export interface StyleBundle {
  name: string;
  styles: Styles[];
}
export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  priority?: number;
}

export interface RectWithColor extends Rect {
  color: string;
}

export interface DetectedSegmentation {
  points: [[[number, number]]];
  center: { cX: number; cY: number };
}

export interface DetectedObject extends Rect {
  focalPoint: [number, number];
  className?: string;
  importance?: number;
  score?: number;
  segmentation?: DetectedSegmentation;
  shouldAvoidOverlap?: boolean;
}

export interface MemorabilityRect extends Rect {
  memorability: number;
}

export type DetectedTextLine = [
  [number, number],
  [number, number],
  [number, number],
  [number, number]
];

export interface DetectedSegment {
  class_name: string;
  center: number[];
  points: number[][];
}

export type Pixels = number;
export type GridUnit = number;
export type GridModuleUnit = number;

export interface Grid {
  baseUnit: Pixels;
  columns: GridUnit;
  rows: GridUnit;
  columnModules: GridModuleUnit;
  rowModules: GridModuleUnit;
  moduleWidth: Pixels;
  moduleHeight: Pixels;
  horizontalMargin: Pixels;
  verticalMargin: Pixels;
  gutterWidth: Pixels;
  unitsPerHorizontalModule: GridUnit;
  unitsPerVerticalModule: GridUnit;
}

export interface ContentBox {
  contentLeft: Pixels;
  contentTop: Pixels;
  contentWidth: Pixels;
  contentHeight: Pixels;
}

export interface ItemFrameMetadata {
  fileName?: string[];
  folderName?: string[];
  allObjects?: DetectedObject[];
  objects?: DetectedObject[];
  highlightedObjects?: DetectedObject[];
  allStyles?: Styles[];
  allStyleBundles?: StyleBundle[];
  fromStyleBundle?: string;
  style?: Styles;
  allSizes?: SizeFormatGroup[];
  sizes?: SizeFormat[];
  size?: SizeFormat;
  presetImages?: string[];
  textStyle?: Styles;
  textColor?: Styles;
  filterStyle?: Styles;
  grid?: Grid;
  kMeansImage?: HTMLCanvasElement;
  dominantColors?: RectWithColor[];
  appliedElementId?: string;
  appliedElementType?: ElementType;
  settings?: ActionSettings;
  contentRect?: Rect;
  crop?: Rect;
  rect?: Rect;
  memorability?: MemorabilityRect[];
  detectedTextLines?: DetectedTextLine[];
  elementHierarchy?: string[];
}

export type ElementType =
  | 'background_image'
  | 'background_color'
  | 'foreground_image'
  | 'text';

export interface BackgroundImageElement {
  type: 'background_image';
  id: string;
  image: ImageBitmap | HTMLCanvasElement | HTMLImageElement;
  originalSize: ImageSize;
  fileName?: string;
  appliedStyles?: Styles[];
}

export interface BackgroundColorElement {
  type: 'background_color';
  id: string;
  color: CSSColor;
}

export interface ForegroundImageElement {
  type: 'foreground_image';
  id: string;
  image: ImageBitmap | HTMLCanvasElement | HTMLImageElement;
  originalSize: ImageSize;
  fileName?: string;
}

export type TextHeadingLevel = 'h1' | 'h2';

export interface TextContent {
  text: string | string[];
  level: TextHeadingLevel;
}

export interface TextElement {
  type: 'text';
  id: string;
  content: TextContent[];
}

export type Element =
  | BackgroundImageElement
  | BackgroundColorElement
  | ForegroundImageElement
  | TextElement;

export interface ItemFrame {
  name?: string;
  fromActionId: string;
  metadata: ItemFrameMetadata;
  elements?: Element[];
  layer?: HTMLCanvasElement | ImageBitmap;
}

export interface Item {
  frames: ItemFrame[];
}

export type ActionItem = Item | 'endOfBatch';

export interface ActionSettings {
  actionId: string;
}

export interface ApplyElementsSettings extends ActionSettings {
  selectedSize: SizeFormat;
  selectedTextStyle?: Styles;
  selectedTextColor?: Styles;
  selectedFilterStyle?: Styles;
  resultOutput: 'all' | 'best' | 'sample';
}
export interface CreateViewportSettings extends ActionSettings {}
export interface DetectObjectsSettings extends ActionSettings {
  [className: string]: any;
  detectBlobs?: boolean;
  detectFaces?: boolean;
}
export interface EnhanceImageSettings extends ActionSettings {}
export interface KMeansActionSettings extends ActionSettings {
  k: number;
}
export interface QuantizeKMeansActionSettings extends ActionSettings {}
export interface ObjectCropActionSettings extends ActionSettings {
  maxCropsPerSize: number;
}
export interface StyleImageActionSettings extends ActionSettings {
  allStyles: Styles[];
  style: Styles;
}
export interface SelectStyleBundleActionSettings extends ActionSettings {
  allStyleBundles: StyleBundle[];
}
export interface SegmentActionSettings extends ActionSettings {}
export interface DetectMemorabilityActionSettings extends ActionSettings {}
export interface DetectTextActionSettings extends ActionSettings {}

export interface BackgroundSourceActionSerttings extends ActionSettings {
  presetImages: string[];
}
export interface ForegroundSourceActionSettings extends ActionSettings {
  presetImages: string[];
}

export type ActionFunction = (
  item: ActionItem,
  settings: ActionSettings,
  next: ActionCallback
) => any;

export type ActionCallback = (item: ActionItem) => any;

export type ActionParameterValues = { [name: string]: any };

export type ActionPanelType = 'welcome' | 'formats' | 'input' | 'output';

export interface ActionTransform {
  name: string;
  title?: string;
  guidance?: ((action: Action) => { key: string; content: string }) | string;
  proceedLabel?: string;
  actionPanel: ActionPanelType;
  actionPanelProps?: { [prop: string]: any };
  fn: ActionFunction;
  presetParameters?: ActionParameterValues;
  runInWorker?: boolean;
  userSelectableResults?: boolean;
  hideBasket?: boolean;
}

export interface Action {
  id: string;
  transform: ActionTransform;
  paramValues: ActionParameterValues;
  items: Item[];
  selectedIndexes: number[];
  isProcessed?: boolean;
  hasProceeded?: boolean;
  state: { [key: string]: any };
}

export interface Workflow {
  name: string;
  actions: Action[][];
}
