import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { imageToBitmapOrCanvas, loadImageDOM } from '../../helpers/images';
import { findElement, findInFrames } from '../../helpers/frames';

import { Item, ImageSize } from '../../index';

import './ForegroundSelector.scss';

export interface ForegroundContent {
  bitmap: HTMLCanvasElement | ImageBitmap;
  originalImage: HTMLImageElement;
  originalSize: ImageSize;
  fileName: string;
}
interface ForegroundSelectorProps {
  item: Item;
  onForegroundChange: (newContent: ForegroundContent) => void;
}
export class ForegroundSelector extends React.Component<
  ForegroundSelectorProps
> {
  render() {
    let presets = (findInFrames(this.props.item, 'metadata.presetImages') ||
      []) as string[];
    return (
      <div
        className={classNames('paletteContent', 'foregroundSelector', {
          'has-presets': !_.isEmpty(presets)
        })}
      >
        <div
          className={classNames('foregroundSelector--dropzone', {
            'is-populated': this.hasImage()
          })}
          id="input-drop"
        >
          {!_.isEmpty(presets) && (
            <div className="foregroundSelector--presets">
              {presets.map(path => (
                <img
                  className="foregroundSelector--preset"
                  key={path}
                  src={path}
                  onClick={() => this.loadImage(path)}
                />
              ))}
            </div>
          )}
          <div className="foregroundSelector--uploadBtn">
            <label htmlFor="input-files">Upload SVG or image</label>
            <input
              id="input-files"
              type="file"
              multiple
              onChange={evt => this.onFilesChange(evt)}
            />
          </div>
        </div>
      </div>
    );
  }

  hasImage(props = this.props) {
    return findElement(props.item, 'foreground_image');
  }

  onFilesChange(evt: React.SyntheticEvent) {
    let input = evt.target as HTMLInputElement;
    Promise.all(
      Array.from(input.files).map(file =>
        loadImageFromFile(file).then(img =>
          imageToBitmapOrCanvas(img).then(bitmap => ({
            bitmap: bitmap,
            originalImage: img,
            originalSize: { width: img.width, height: img.height },
            fileName: file.name
          }))
        )
      )
    ).then(imgs => {
      if (!imgs.length) return;
      this.props.onForegroundChange(_.first(imgs));
    });
  }

  loadImage(path: string) {
    loadImageDOM(path).then(img => {
      imageToBitmapOrCanvas(img).then(bitmap => {
        this.props.onForegroundChange({
          bitmap,
          originalImage: img,
          originalSize: { width: img.width, height: img.height },
          fileName: ''
        });
      });
    });
  }
}

function loadImageFromFile(f: File): Promise<HTMLImageElement> {
  return new Promise(res => {
    let imgEl = document.createElement('img');
    imgEl.src = URL.createObjectURL(f);
    imgEl.onload = () => {
      res(imgEl);
    };
  });
}
