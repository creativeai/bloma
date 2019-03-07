import * as React from 'react';

import { findInFrames } from '../../helpers/frames';
import { Grid, SizeFormat } from '../../index';
import { FrameVisualizationProps } from './index';

import './QuantizedKMeans.scss';

interface QuantizedKMeansProps extends FrameVisualizationProps {}
export class QuantizedKMeans extends React.Component<QuantizedKMeansProps> {
  render() {
    return (
      <div className="quantizedKMeansVisualization" style={this.props.position}>
        {this.getQuantizedGrid().map(
          ({ left, top, width, height, color }, idx) => (
            <div
              key={idx}
              className="quantizedKMeansVisualization--cell"
              style={{ left, top, width, height, backgroundColor: color }}
            />
          )
        )}
      </div>
    );
  }

  getQuantizedGrid() {
    let grid = findInFrames(this.props.item, 'metadata.grid') as Grid;
    let size = findInFrames(this.props.item, 'metadata.size') as SizeFormat;

    let hMargin = (grid.horizontalMargin / size.width) * 100;
    let vMargin = (grid.verticalMargin / size.height) * 100;
    let widthSansMargin = 100 - 2 * hMargin;
    let heightSansMargin = 100 - 2 * vMargin;
    let gridItemWidth = widthSansMargin / grid.columnModules;
    let gridItemHeight = heightSansMargin / grid.rowModules;

    return this.props.frame.metadata.dominantColors.map(
      ({ left, right, top, bottom, color }) => ({
        left: `${hMargin + gridItemWidth * left}%`,
        top: `${vMargin + gridItemHeight * top}%`,
        width: `${(right - left) * gridItemWidth}%`,
        height: `${(bottom - top) * gridItemHeight}%`,
        color: `rgb(${color})`
      })
    );
  }
}
