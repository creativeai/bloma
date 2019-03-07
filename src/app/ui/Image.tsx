import * as React from 'react';
import classNames from 'classnames';

import { renderFlat, getAspectRatioClass } from '../helpers/images';
import { Item } from '../index';

import './Image.scss';
import { CSSTransition } from 'react-transition-group';

interface ImageProps {
  item: Item;
  isSelected: boolean;
  width: number;
  aspectRatio: number;
  noToolbar?: boolean;
  style?: { [k: string]: any };
  onToggleSelect: (selected: boolean) => void;
  onDirectEdit: () => void;
}
interface ImageState {
  lastItem: Item;
  imageUrl: string;
}
export class Image extends React.Component<ImageProps, ImageState> {
  constructor(props: ImageProps) {
    super(props);
    this.state = { lastItem: null, imageUrl: null };
  }

  componentWillMount() {
    this.maybeRender(this.props);
  }

  componentWillReceiveProps(newProps: ImageProps) {
    this.maybeRender(newProps);
  }

  maybeRender(newProps: ImageProps) {
    if (newProps.item) {
      if (this.state.lastItem !== newProps.item) {
        let imageUrl = renderFlat(
          newProps.item,
          newProps.item.frames.map(f => f.name),
          this.props.width
        );
        this.setState({
          lastItem: newProps.item,
          imageUrl
        });
      }
    }
  }

  render() {
    return (
      <div
        style={this.props.style}
        className={classNames('image-wrapper', {
          selected: this.props.isSelected
        })}
      >
        <div
          className="imageHeightProp"
          style={{ paddingTop: `calc(100% / ${this.props.aspectRatio})` }}
        />
        {!this.props.noToolbar && (
          <div className="imageToolbar">
            <button
              className="editImage"
              onClick={() => this.props.onDirectEdit()}
            >
              Edit
            </button>
            <button
              className="selectImage"
              onClick={() => this.props.onToggleSelect(!this.props.isSelected)}
            >
              Select
            </button>
          </div>
        )}
        <CSSTransition
          in={!!this.state.imageUrl}
          classNames="image"
          timeout={500}
          appear
        >
          <div
            className={classNames(
              'image',
              this.props.item && getAspectRatioClass(this.props.item)
            )}
          >
            {this.state.imageUrl && <img src={this.state.imageUrl} />}
          </div>
        </CSSTransition>
      </div>
    );
  }
}
