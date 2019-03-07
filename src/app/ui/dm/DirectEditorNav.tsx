import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { VisibilitiesDropdown } from './VisibilitiesDropdown';

import { ItemFrame } from '../../index';
import { FrameVisualization } from '../frame_visualizations/index';

import './DirectEditorNav.scss';

interface DirectEditorTab {
  frame: ItemFrame;
  index: number;
}
interface DirectEditorNavProps {
  supportedVisibilities: FrameVisualization[];
  activeVisibilities: FrameVisualization[];
  tabs: DirectEditorTab[];
  activeIndex: number;
  onSave: () => void;
  onCancel: () => void;
  onChangeActiveTab: (index: number) => void;
  onActiveVisibilitiesChange: (active: FrameVisualization[]) => void;
}
interface DirectEditorNavState {
  visibilitiesSubmenuOpen: boolean;
}
export class DirectEditorNav extends React.Component<
  DirectEditorNavProps,
  DirectEditorNavState
> {
  constructor(props: DirectEditorNavProps) {
    super(props);
    this.state = { visibilitiesSubmenuOpen: false };
  }

  render() {
    return (
      <div className="directEditorNav">
        <div className="directEditorNav--actions">
          <button className="btnCancel" onClick={this.props.onCancel}>
            Cancel
          </button>
          <button className="btnSave" onClick={this.props.onSave}>
            Save
          </button>
        </div>
        <div className="directEditorNav--controls">
          {this.props.tabs.map(({ frame, index }) => (
            <div key={index} className={this.getTabClasses(frame, index)}>
              <button
                className="directEditorNav--controlBtn"
                onClick={() => this.changeActiveTab(index)}
              >
                {_.startCase(frame.metadata.appliedElementType)}
              </button>
            </div>
          ))}
          <div
            className={classNames('directEditorNav--control visibilities', {
              active: this.state.visibilitiesSubmenuOpen
            })}
          >
            <button
              className="directEditorNav--controlBtn"
              onClick={() => this.toggleVisibilitiesSubmenu()}
            >
              Visibilities
            </button>
            {this.state.visibilitiesSubmenuOpen && (
              <VisibilitiesDropdown
                visibilities={this.props.supportedVisibilities}
                activeVisibilities={this.props.activeVisibilities}
                onActiveVisibilitiesChange={
                  this.props.onActiveVisibilitiesChange
                }
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  getTabClasses(frame: ItemFrame, index: number) {
    return `directEditorNav--control ${frame.metadata.appliedElementType} ${
      index === this.props.activeIndex ? 'active' : ''
    }`;
  }

  changeActiveTab(index: number) {
    if (this.props.activeIndex === index) {
      this.props.onChangeActiveTab(null);
    } else {
      this.props.onChangeActiveTab(index);
    }
    this.toggleVisibilitiesSubmenu(false);
  }

  toggleVisibilitiesSubmenu(open = !this.state.visibilitiesSubmenuOpen) {
    this.setState({
      visibilitiesSubmenuOpen: open
    });
  }
}
