import * as React from 'react';
import * as _ from 'lodash';

import { findElement } from '../../helpers/frames';
import {
  ItemFrame,
  Item,
  DetectedObject,
  BackgroundImageElement
} from '../../index';
import { FrameVisualizationProps } from './index';

import './Segmentation.scss';

interface SegmentationProps extends FrameVisualizationProps {}
export class Segmentation extends React.Component<SegmentationProps> {
  render() {
    let objects = getSegmentedObjects(this.props.frame);
    let originalSize = getOriginalBackgroundSize(this.props.item);
    let centerRectSize = Math.min(originalSize.width, originalSize.height) / 50;
    return (
      <div className="segmentationVisualization" style={this.props.position}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${originalSize.width} ${originalSize.height}`}
        >
          {objects.map((obj, idx) => (
            <g key={idx}>
              <polygon
                className={`segmentationVisualization--poly n${idx}`}
                points={getPolyPoints(obj)}
                vectorEffect="non-scaling-stroke"
              />
              <rect
                className={`segmentationVisualization--center n${idx}`}
                x={obj.segmentation.center.cX - centerRectSize / 2}
                y={obj.segmentation.center.cY - centerRectSize / 2}
                width={centerRectSize}
                height={centerRectSize}
              />
            </g>
          ))}
        </svg>
      </div>
    );
  }
}

function getSegmentedObjects(frame: ItemFrame) {
  return frame.metadata.allObjects.filter(o => o.segmentation);
}

function getPolyPoints(object: DetectedObject) {
  let res = '';
  for (let [[x, y]] of object.segmentation.points) {
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
