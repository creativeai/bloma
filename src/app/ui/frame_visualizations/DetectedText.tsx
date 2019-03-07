import * as React from 'react';
import * as _ from 'lodash';

import { findElement } from '../../helpers/frames';
import { Item, BackgroundImageElement, DetectedTextLine } from '../../index';
import { FrameVisualizationProps } from './index';

import './DetectedText.scss';

export interface DetectedTextProps extends FrameVisualizationProps {}
export class DetectedText extends React.Component<DetectedTextProps> {
  render() {
    let texts = this.props.frame.metadata.detectedTextLines;
    let originalSize = getOriginalBackgroundSize(this.props.item);
    return (
      <div className="detectedTextVisualization" style={this.props.position}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${originalSize.width} ${originalSize.height}`}
        >
          {texts.map((textRect, idx) => (
            <g key={idx}>
              <polygon
                className={`detectedTextVisualization--poly`}
                points={getPolyPoints(textRect)}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>
      </div>
    );
  }
}

function getPolyPoints(textRect: DetectedTextLine) {
  let res = '';
  for (let [x, y] of textRect) {
    res += `${x},${y} `;
  }
  return res;
}

function getOriginalBackgroundSize(item: Item) {
  let background = findElement(
    item,
    'background_image'
  ) as BackgroundImageElement;
  return background.originalSize;
}
