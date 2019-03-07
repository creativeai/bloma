import * as React from 'react';
import classNames from 'classnames';

import * as _ from 'lodash';

import { findElement, findInFrames } from '../../helpers/frames';
import { imageToBitmapOrCanvas, loadImageDOM } from '../../helpers/images';
import { detectObjects } from '../../transforms/detect_objects';
import {
  Item,
  ImageSize,
  DetectedObject,
  BackgroundImageElement,
  Action,
  DetectObjectsSettings
} from '../../index';

import './BackgroundImageSelector.scss';

export interface BackgroundImageContent {
  bitmap: HTMLCanvasElement | ImageBitmap;
  originalImage: HTMLImageElement;
  originalSize: ImageSize;
  fileName: string;
}
interface BackgroundImageSelectorProps {
  action: Action;
  item: Item;
  onImageChange: (content: BackgroundImageContent) => void;
  onObjectsChange: (objects: DetectedObject[]) => void;
  onHighlightedObjectChange: (index: number) => void;
  onSelectedObjectChange: (index: number) => void;
  onSetActionState: (key: string, value: any) => void;
  onProceed: () => void;
}
export class BackgroundImageSelector extends React.PureComponent<
  BackgroundImageSelectorProps
> {
  render() {
    let presets = (findInFrames(this.props.item, 'metadata.presetImages') ||
      []) as string[];
    return (
      <div
        className={classNames('backgroundImageSelector', {
          'has-presets': !_.isEmpty(presets)
        })}
      >
        <div className="backgroundImageSelector--imageInput">
          <div
            className={classNames('backgroundImageSelector--dropzone', {
              'is-populated':
                this.props.action.state.detecting || this.getObjects()
            })}
            id="input-drop"
          >
            {this.renderContent(presets)}
          </div>
        </div>
      </div>
    );
  }

  renderContent(presets: string[]) {
    if (this.props.action.state.detecting) {
      return <div className="backgroundImageSelector--detecting" />;
    } else if (this.getObjects()) {
      return (
        <ul className="backgroundImageSelector--objectList">
          {this.getObjects().map((obj, idx) => (
            <li key={idx} className={this.getObjectClasses(idx)}>
              <button
                onMouseOver={() => this.highlightObjectIn(idx)}
                onMouseOut={() => this.highlightObjectOut(idx)}
                onClick={() => this.toggleObjectSelection(idx)}
              >
                Object {idx + 1}
              </button>
            </li>
          ))}
        </ul>
      );
    } else {
      return (
        <>
          {!_.isEmpty(presets) && (
            <div className="backgroundImageSelector--presets">
              {presets.map(path => (
                <img
                  className="backgroundImageSelector--preset"
                  key={path}
                  src={path}
                  onClick={() => this.loadImage(path)}
                />
              ))}
            </div>
          )}
          <div className="backgroundImageSelector--uploadBtn">
            <label htmlFor="input-files">Upload</label>
            <input
              id="input-files"
              type="file"
              multiple
              onChange={evt => this.onFilesChange(evt)}
            />
          </div>
          <button
            className="backgroundImageSelector--addButton"
            disabled={!this.hasImage()}
            onClick={() => this.onAddImageClick()}
          >
            Next
          </button>
        </>
      );
    }
  }

  hasImage() {
    return !!this.getImage();
  }

  getImage() {
    return findElement(
      this.props.item,
      'background_image'
    ) as BackgroundImageElement;
  }

  getObjects() {
    return findInFrames(
      this.props.item,
      'metadata.allObjects'
    ) as DetectedObject[];
  }

  getSelectedObjects() {
    return (findInFrames(this.props.item, 'metadata.objects') ||
      []) as DetectedObject[];
  }

  getHighlightedObjects() {
    return (findInFrames(this.props.item, 'metadata.highlightedObjects') ||
      []) as DetectedObject[];
  }

  getObjectClasses(idx: number) {
    let classes = '';
    if (this.isObjectHighlighted(idx)) {
      classes += 'is-highlighted ';
    }
    if (this.isObjectSelected(idx)) {
      classes += 'is-selected ';
    }
    return classes;
  }

  highlightObjectIn(idx: number) {
    this.props.onHighlightedObjectChange(idx);
  }

  highlightObjectOut(idx: number) {
    if (this.isObjectHighlighted(idx)) {
      this.props.onHighlightedObjectChange(null);
    }
  }

  toggleObjectSelection(idx: number) {
    if (this.isObjectSelected(idx)) {
      this.props.onSelectedObjectChange(null);
    } else {
      this.props.onSelectedObjectChange(idx);
    }
  }

  isObjectSelected(idx: number) {
    let allObjects = this.getObjects();
    let selectedObjects = this.getSelectedObjects();
    return (
      !_.isEmpty(selectedObjects) &&
      _.some(selectedObjects, o => _.isEqual(o, allObjects[idx]))
    );
  }

  isObjectHighlighted(idx: number) {
    let allObjects = this.getObjects();
    let highlightedObjects = this.getHighlightedObjects();
    return (
      !_.isEmpty(highlightedObjects) &&
      _.some(highlightedObjects, o => _.isEqual(o, allObjects[idx]))
    );
  }

  onFilesChange(evt: React.SyntheticEvent) {
    let target = evt.target as HTMLInputElement;
    Promise.all(
      Array.from(target.files).map(file =>
        loadImageFromFile(file).then(img => ({ file, img }))
      )
    )
      .then(imgs =>
        imgs.length
          ? imageToBitmapOrCanvas(_.first(imgs).img).then(bitmap => ({
              bitmap,
              originalImage: _.first(imgs).img,
              fileName: _.first(imgs).file.name,
              originalSize: {
                width: _.first(imgs).img.width,
                height: _.first(imgs).img.height
              }
            }))
          : null
      )
      .then(image => {
        this.onNewImage(image);
        this.detectObjects(this.getImage());
      });
  }

  onNewImage(image: BackgroundImageContent) {
    this.props.onImageChange(image);
  }

  onAddImageClick() {
    this.detectObjects(this.getImage());
  }

  detectObjects(image: BackgroundImageElement) {
    this.props.onSetActionState('detecting', true);
    detectObjects(
      {
        frames: [
          {
            fromActionId: null,
            elements: [
              {
                id: _.uniqueId(),
                type: 'background_image',
                image: image.image,
                originalSize: image.originalSize,
                fileName: image.fileName
              }
            ],
            metadata: {}
          }
        ]
      },
      { ...this.props.action.paramValues } as DetectObjectsSettings,
      (detected: Item) => {
        let detectedObjects = findInFrames(
          detected,
          'metadata.allObjects'
        ) as DetectedObject[];
        this.props.onObjectsChange(detectedObjects);
        this.props.onSetActionState('detecting', false);
        if (detectedObjects.length === 0) {
          this.props.onProceed();
        }
      }
    );
  }

  loadImage(path: string) {
    loadImageDOM(path).then(img => {
      imageToBitmapOrCanvas(img).then(bitmap => {
        this.onNewImage({
          bitmap,
          originalImage: img,
          fileName: path,
          originalSize: {
            width: img.width,
            height: img.height
          }
        });
        this.detectObjects(this.getImage());
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
