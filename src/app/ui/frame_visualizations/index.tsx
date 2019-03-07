import { DetectedObjects } from './DetectedObjects';
import { Segmentation } from './Segmentation';
import { KMeans } from './KMeans';
import { QuantizedKMeans } from './QuantizedKMeans';
import { Memorability } from './Memorability';
import { DetectedText } from './DetectedText';
import { ItemFrame, Item, ElementType } from '../../index';

export interface FrameVisualizationProps {
  frame: ItemFrame;
  item: Item;
  position: React.CSSProperties;
  onInteract?: (...args: any[]) => void;
}

export interface FrameVisualization {
  name: string;
  frameName: string;
  title: string;
  elementType?: ElementType;
  Component: React.ComponentClass<FrameVisualizationProps>;
  props?: { [propName: string]: any };
}

export const SELECTED_OBJECTS_VISUALIZATION = {
  name: 'selectedObjects',
  frameName: 'Background Image',
  title: 'Selected Objects',
  Component: DetectedObjects,
  props: { all: false }
};

export const ALL_OBJECTS_VISUALIZATION = {
  name: 'allObjects',
  frameName: 'Background Image',
  title: 'All Objects',
  Component: DetectedObjects,
  props: { all: true }
};

export const SEGMENTATION_VISUALIZATION = {
  name: 'segmentation',
  frameName: 'Background Image',
  title: 'Segmentation',
  Component: Segmentation
};

export const K_MEANS_VISUALIZATION = {
  name: 'kMeans',
  frameName: 'K-means',
  title: 'k-means',
  Component: KMeans
};

export const QUANTIZED_K_MEANS_VISUALIZATION = {
  name: 'quantizedKMeans',
  frameName: 'Quantized K-means',
  title: 'Quantized k-means',
  Component: QuantizedKMeans
};

export const MEMORABILITY_VISUALIZATION = {
  name: 'memorability',
  frameName: 'Memorability',
  title: 'Memorability',
  Component: Memorability
};

export const DETECTED_TEXT_VISUALIZATION = {
  name: 'detectedText',
  frameName: 'Detected Text',
  title: 'Detected Text',
  Component: DetectedText
};

export const FRAME_VISUALIZATIONS: FrameVisualization[] = [
  SELECTED_OBJECTS_VISUALIZATION,
  ALL_OBJECTS_VISUALIZATION,
  SEGMENTATION_VISUALIZATION,
  K_MEANS_VISUALIZATION,
  QUANTIZED_K_MEANS_VISUALIZATION,
  MEMORABILITY_VISUALIZATION,
  DETECTED_TEXT_VISUALIZATION
];
