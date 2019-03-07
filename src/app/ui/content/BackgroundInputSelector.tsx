import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { findElement } from '../../helpers/frames';
import { Item, CSSColor, DetectedObject, Action } from '../../index';

import {
  BackgroundImageSelector,
  BackgroundImageContent
} from './BackgroundImageSelector';
import { ColorSelector } from './ColorSelector';

import './BackgroundInputSelector.scss';

interface BackgroundInputSelectorProps {
  action: Action;
  item: Item;
  onColorChange: (color: CSSColor) => void;
  onImageChange: (content: BackgroundImageContent) => void;
  onObjectsChange: (objects: DetectedObject[]) => void;
  onHighlightedObjectChange: (index: number) => void;
  onSelectedObjectChange: (index: number) => void;
  onSetActionState: (key: string, value: any) => void;
  onProceed: () => void;
}
export class BackgroundInputSelector extends React.Component<
  BackgroundInputSelectorProps
> {
  constructor(props: BackgroundInputSelectorProps) {
    super(props);
  }

  componentWillMount() {
    this.activateImageCategory();
  }

  render() {
    return (
      <div className="paletteContent backgroundInputSelector">
        {this.renderTabs()}
        <div className="backgroundInputSelector--content">
          {this.renderInput()}
        </div>
      </div>
    );
  }

  renderTabs() {
    return (
      <div className="paletteTabs backgroundInputSelector--tabs">
        <button
          className={classNames(
            'paletteTabs--tab backgroundInputSelector--tab',
            'image',
            {
              'is-active': this.props.action.state.activeCategory === 'image'
            }
          )}
          onClick={() => this.activateImageCategory()}
        >
          Image
        </button>
        <button
          className={classNames(
            'paletteTabs--tab backgroundInputSelector--tab',
            'color',
            {
              'is-active': this.props.action.state.activeCategory === 'color'
            }
          )}
          onClick={() => this.activateColorCategory()}
        >
          Color
        </button>
      </div>
    );
  }

  renderInput() {
    switch (this.props.action.state.activeCategory) {
      case 'image':
        return this.renderImageInput();
      case 'color':
        return this.renderColorInput();
    }
  }

  renderImageInput(): JSX.Element {
    return (
      <BackgroundImageSelector
        action={this.props.action}
        item={this.props.item}
        onImageChange={this.props.onImageChange}
        onObjectsChange={this.props.onObjectsChange}
        onHighlightedObjectChange={this.props.onHighlightedObjectChange}
        onSelectedObjectChange={this.props.onSelectedObjectChange}
        onSetActionState={this.props.onSetActionState}
        onProceed={this.props.onProceed}
      />
    );
  }

  renderColorInput() {
    return <ColorSelector onColorChange={this.props.onColorChange} />;
  }

  activateImageCategory() {
    this.props.onSetActionState('activeCategory', 'image');
  }

  activateColorCategory() {
    this.props.onSetActionState('activeCategory', 'color');
  }

  hasImage() {
    return !!findElement(this.props.item, 'background_image');
  }
}
