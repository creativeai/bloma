import * as React from 'react';
import * as _ from 'lodash';

import { DirectEditorNav } from './DirectEditorNav';
import { CropEditor } from './crop/CropEditor';
import { TextEditor } from './text/TextEditor';
import { ImageWithLayers } from '../ImageWithLayers';
import { rerenderElement } from '../../transforms/apply_elements';
import { findInFrames, findElement } from '../../helpers/frames';
import {
  FRAME_VISUALIZATIONS,
  FrameVisualization
} from '../frame_visualizations/index';
import { ImageEditor } from './image/ImageEditor';
import { getBackgroundScreenPosition } from './viewport_utils';
import {
  BackgroundImageElement,
  Item,
  ElementType,
  ItemFrame,
  BackgroundColorElement
} from '../../index';

import './DirectEditor.scss';

interface FrameEditor {
  frameName: string;
  elementType: ElementType;
  render: (
    item: Item,
    frame: ItemFrame,
    activeVisibilities: FrameVisualization[],
    onChange: (newFrame: ItemFrame) => void
  ) => JSX.Element;
}

const FRAME_EDITORS: FrameEditor[] = [
  {
    frameName: 'Element',
    elementType: 'background_image',
    render: (item, frame, activeVisibilities, onChange) => {
      return (
        <CropEditor
          backgroundImage={
            findElement(item, 'background_image') as BackgroundImageElement
          }
          crop={findInFrames(item, 'metadata.crop')}
          grid={findInFrames(item, 'metadata.grid')}
          size={findInFrames(item, 'metadata.size')}
          onCropChange={newCrop => {
            rerenderElement(item, frame, newCrop).then(({ layer, crop }) =>
              onChange({
                ...frame,
                layer,
                metadata: { ...frame.metadata, crop }
              })
            );
          }}
        >
          <ImageWithLayers
            item={item}
            activeVisibilities={activeVisibilities}
            skipBackground={false}
          />
        </CropEditor>
      );
    }
  },
  {
    frameName: 'Element',
    elementType: 'text',
    render: (item, frame, activeVisibilities, onChange) => {
      return (
        <TextEditor
          backgroundElement={
            (findElement(item, 'background_image') as BackgroundImageElement) ||
            (findElement(item, 'background_color') as BackgroundColorElement)
          }
          crop={findInFrames(item, 'metadata.crop')}
          grid={findInFrames(item, 'metadata.grid')}
          size={findInFrames(item, 'metadata.size')}
          textRect={frame.metadata.rect}
          onTextRectChange={(newTextRect, alignment) => {
            rerenderElement(item, frame, newTextRect, alignment).then(
              ({ layer, contentRect, placedText }) =>
                onChange({
                  ...frame,
                  layer,
                  metadata: {
                    ...frame.metadata,
                    rect: newTextRect,
                    contentRect
                  }
                })
            );
          }}
          onTextAlignmentChange={newAlignment => {
            rerenderElement(
              item,
              frame,
              frame.metadata.rect,
              newAlignment
            ).then(({ layer, contentRect }) =>
              onChange({
                ...frame,
                layer,
                metadata: { ...frame.metadata, contentRect }
              })
            );
          }}
        >
          <ImageWithLayers
            item={item}
            activeVisibilities={activeVisibilities}
            skipBackground={false}
          />
        </TextEditor>
      );
    }
  },
  {
    frameName: 'Element',
    elementType: 'foreground_image',
    render: (item, frame, activeVisibilities, onChange) => {
      return (
        <ImageEditor
          backgroundElement={
            (findElement(item, 'background_image') as BackgroundImageElement) ||
            (findElement(item, 'background_color') as BackgroundColorElement)
          }
          crop={findInFrames(item, 'metadata.crop')}
          grid={findInFrames(item, 'metadata.grid')}
          size={findInFrames(item, 'metadata.size')}
          contentRect={frame.metadata.contentRect}
          onContentRectChange={newContentRect => {
            rerenderElement(item, frame, newContentRect).then(
              ({ layer, contentRect }) =>
                onChange({
                  ...frame,
                  layer,
                  metadata: { ...frame.metadata, contentRect }
                })
            );
          }}
        >
          <ImageWithLayers
            item={item}
            activeVisibilities={activeVisibilities}
            skipBackground={false}
          />
        </ImageEditor>
      );
    }
  }
];

interface DirectEditorProps {
  item: Item;
  onUpdateFrame: (index: number, frame: ItemFrame) => void;
  onSave: () => void;
  onCancel: () => void;
}
interface DirectEditorState {
  editingFrameIndex: number;
  activeVisibilities: FrameVisualization[];
}
export class DirectEditor extends React.Component<
  DirectEditorProps,
  DirectEditorState
> {
  private containerRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: DirectEditorProps) {
    super(props);
    this.state = {
      editingFrameIndex: null,
      activeVisibilities: []
    };
  }

  componentDidMount() {
    this.setState({});
  }

  render() {
    return (
      <div className="directEditor" ref={this.containerRef}>
        <div className="directEditor--content">
          {this.props.item && this.renderCurrentEditor()}
        </div>
        {this.props.item && (
          <DirectEditorNav
            tabs={this.getEditableFrames()}
            activeIndex={this.state.editingFrameIndex}
            onChangeActiveTab={index =>
              this.setState({ editingFrameIndex: index })
            }
            supportedVisibilities={this.getSupportedVisibilities()}
            activeVisibilities={this.state.activeVisibilities}
            onActiveVisibilitiesChange={activeVisibilities =>
              this.setState({ activeVisibilities })
            }
            onSave={this.props.onSave}
            onCancel={this.props.onCancel}
          />
        )}
      </div>
    );
  }

  renderCurrentEditor() {
    if (_.isNumber(this.state.editingFrameIndex)) {
      let frame = this.props.item.frames[this.state.editingFrameIndex];
      let editors = _.filter(
        FRAME_EDITORS,
        editor => editor.frameName === frame.name
      );
      let editor =
        editors.length > 1
          ? _.find(editors, {
              elementType: frame.metadata.appliedElementType
            })
          : _.first(editors);
      return (
        editor &&
        editor.render(
          this.props.item,
          frame,
          this.state.activeVisibilities,
          newFrame =>
            this.props.onUpdateFrame(this.state.editingFrameIndex, newFrame)
        )
      );
    } else if (this.containerRef.current) {
      let imagePosition = getBackgroundScreenPosition(
        findInFrames(this.props.item, 'metadata.crop'),
        findInFrames(this.props.item, 'metadata.size'),
        this.containerRef.current,
        (findElement(
          this.props.item,
          'background_image'
        ) as BackgroundImageElement) ||
          (findElement(
            this.props.item,
            'background_color'
          ) as BackgroundColorElement)
      );
      return (
        <div className="directEditor--imageContainer" style={imagePosition}>
          <ImageWithLayers
            item={this.props.item}
            activeVisibilities={this.state.activeVisibilities}
            skipBackground
          />
        </div>
      );
    }
  }

  getEditableFrames() {
    return this.props.item.frames
      .map((frame, index) => ({ frame, index }))
      .filter(item => this.hasEditorFor(item.frame));
  }

  getSupportedVisibilities() {
    return FRAME_VISUALIZATIONS.filter(vis => this.hasFrameFor(vis));
  }

  hasFrameFor(vis: FrameVisualization) {
    return _.some(this.props.item.frames, frame =>
      this.isCompatible(frame, vis)
    );
  }

  hasEditorFor(frame: ItemFrame) {
    return _.some(FRAME_EDITORS, editor => this.isCompatible(frame, editor));
  }

  isCompatible(frame: ItemFrame, editor: FrameEditor | FrameVisualization) {
    if (editor.frameName === 'Element') {
      return (
        frame.metadata &&
        frame.metadata.appliedElementType === editor.elementType
      );
    } else {
      return frame.name === editor.frameName;
    }
  }
}

export function canBeDirectlyEdited(item: Item) {
  return _.some(FRAME_EDITORS, editor =>
    _.some(item.frames, { name: editor.frameName })
  );
}
