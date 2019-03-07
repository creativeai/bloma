import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import {
  findElementById,
  findInFrames,
  findAllElements
} from '../helpers/frames';
import { canvasFromBitmap } from '../helpers/canvas';

import './ImageWithLayers.scss';
import { ItemFrame, Item, BackgroundImageElement, Styles } from '../index';
import { FrameVisualization } from './frame_visualizations/index';

interface ImageWithLayersProps {
  item: Item;
  activeVisibilities: FrameVisualization[];
  skipBackground: boolean;
  onInteract?: (...args: any[]) => void;
}

export class ImageWithLayers extends React.Component<ImageWithLayersProps> {
  imageContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
  frameContents = new Map<number, HTMLCanvasElement | ImageBitmap>();

  componentDidMount() {
    if (!this.props.skipBackground) {
      let backgroundImage = this.findBackgroundImage();
      if (backgroundImage) {
        let cnvs = document.createElement('canvas');
        cnvs.width = backgroundImage.originalSize.width;
        cnvs.height = backgroundImage.originalSize.height;
        cnvs.getContext('2d').drawImage(backgroundImage.image, 0, 0);
        this.imageContainerRef.current.appendChild(cnvs);
      }
    }
  }

  private findBackgroundImage() {
    let backgroundImages = findAllElements(
      this.props.item,
      'background_image'
    ) as BackgroundImageElement[];
    let filterStyle = findInFrames(
      this.props.item,
      'metadata.filterStyle'
    ) as Styles;
    let filterStyleName = filterStyle ? filterStyle.name : null;
    if (filterStyleName) {
      return _.find(backgroundImages, img =>
        _.some(img.appliedStyles, s => s.name === filterStyleName)
      );
    } else {
      return _.find(backgroundImages, img => _.isEmpty(img.appliedStyles));
    }
  }

  render() {
    return (
      <div className="imageWithLayers">
        <div
          className="frame"
          ref={this.imageContainerRef}
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />
        {this.getLayerFrames().map(
          ({ frame, position, Component, visProps }, idx) =>
            Component ? (
              <Component
                key={idx}
                frame={frame}
                item={this.props.item}
                position={position}
                onInteract={this.props.onInteract}
                {...visProps}
              />
            ) : (
              <div
                key={idx}
                className={classNames('frame', frame.name)}
                ref={el => this.setFrameRef(idx, frame, el)}
                style={position}
              />
            )
        )}
      </div>
    );
  }

  getLayerFrames() {
    let position = {
      left: '0',
      top: '0',
      width: '100%',
      height: '100%'
    };
    let result = [];
    for (let frame of this.props.item.frames) {
      if (frame.metadata && frame.metadata.crop) {
        let crop = frame.metadata.crop;
        let element = findElementById(
          this.props.item,
          frame.metadata.appliedElementId
        ) as BackgroundImageElement;
        let origSize = element.originalSize;
        position = {
          left: `${(crop.left / origSize.width) * 100}%`,
          top: `${(crop.top / origSize.height) * 100}%`,
          width: `${((crop.right - crop.left) / origSize.width) * 100}%`,
          height: `${((crop.bottom - crop.top) / origSize.height) * 100}%`
        };
      }

      if (frame.metadata && frame.metadata.appliedElementId && frame.layer) {
        result.push({ frame, position });
      }
      let visualizations = _.filter(this.props.activeVisibilities, {
        frameName: frame.name
      });
      for (let visualization of visualizations) {
        result.push({
          frame,
          position,
          Component: visualization.Component,
          visProps: visualization.props
        });
      }
    }
    return _.sortBy(result, itm => (itm.Component ? 1 : -1)); // Visualizations on top of layers
  }

  setFrameRef(idx: number, frame: ItemFrame, el: HTMLDivElement) {
    if (el) {
      if (
        !this.frameContents.has(idx) ||
        this.frameContents.get(idx) !== frame.layer
      ) {
        while (el.firstElementChild) {
          el.firstElementChild.remove();
        }
        if (frame.layer instanceof HTMLCanvasElement) {
          el.appendChild(frame.layer);
        } else {
          el.appendChild(canvasFromBitmap(frame.layer));
        }
        this.frameContents.set(idx, frame.layer);
      }
    }
  }
}
