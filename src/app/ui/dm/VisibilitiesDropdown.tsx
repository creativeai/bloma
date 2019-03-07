import * as React from 'react';
import * as _ from 'lodash';
import { FrameVisualization } from '../frame_visualizations/index';

import './VisibilitiesDropdown.scss';

interface VisibilitiesDropdownProps {
  visibilities: FrameVisualization[];
  activeVisibilities: FrameVisualization[];
  onActiveVisibilitiesChange: (
    activeVisibilities: FrameVisualization[]
  ) => void;
}

export class VisibilitiesDropdown extends React.Component<
  VisibilitiesDropdownProps
> {
  render() {
    return (
      <div className="directEditorNav--controlFlyOut">
        <legend>Visibilities</legend>
        {this.props.visibilities.map(option => (
          <fieldset key={option.title}>
            <input
              type="checkbox"
              id={`check-${option.name}`}
              checked={_.includes(this.props.activeVisibilities, option)}
              onChange={evt =>
                this.changeActiveVisibility(option, evt.target.checked)
              }
            />
            <label htmlFor={`check-${option.name}`}>{option.title}</label>
          </fieldset>
        ))}
      </div>
    );
  }

  changeActiveVisibility(option: FrameVisualization, active: boolean) {
    let activeVisibilities = this.props.activeVisibilities;
    if (active) {
      activeVisibilities = [...activeVisibilities, option];
    } else {
      activeVisibilities = _.reject(
        activeVisibilities,
        option
      ) as FrameVisualization[];
    }
    this.props.onActiveVisibilitiesChange(activeVisibilities);
  }
}
