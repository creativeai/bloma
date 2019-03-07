import * as React from 'react';
import * as _ from 'lodash';

import { findElement } from '../../helpers/frames';
import { Item, Rect, BackgroundImageElement } from '../../index';
import { FrameVisualizationProps } from './index';

import './Memorability.scss';

interface MemorabilityProps extends FrameVisualizationProps {}
export class Memorability extends React.Component<MemorabilityProps> {
  render() {
    let rects = this.props.frame.metadata.memorability;
    return (
      <div className="memorabilityVisualization" style={this.props.position}>
        {rects.map((rect, idx) => (
          <div
            key={idx}
            className="memorabilityVisualization--rect"
            style={{
              ...getRectPosition(rect, this.props.item),
              opacity: rect.memorability * 0.75
            }}
          />
        ))}
      </div>
    );
  }
}

function getRectPosition(rect: Rect, item: Item) {
  let { width, height } = getOriginalBackgroundSize(item);
  return {
    left: `${(rect.left / width) * 100}%`,
    width: `${((rect.right - rect.left) / width) * 100}%`,
    top: `${(rect.top / height) * 100}%`,
    height: `${((rect.bottom - rect.top) / height) * 100}%`
  };
}

function getOriginalBackgroundSize(item: Item) {
  let background = findElement(
    item,
    'background_image'
  ) as BackgroundImageElement;
  return background.originalSize;
}
