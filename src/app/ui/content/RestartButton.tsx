import * as React from 'react';
import { confirmAlert } from 'react-confirm-alert';

import './RestartButton.scss';

interface RestartButtonProps {
  onRestart: () => void;
}
export class RestartButton extends React.Component<RestartButtonProps> {
  render() {
    return (
      <button className="restartButton" onClick={() => this.onClick()}>
        Start again
      </button>
    );
  }

  onClick() {
    confirmAlert({
      title: 'Confirm restart',
      message: 'Are you sure you want to restart your design process?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => this.props.onRestart()
        },
        {
          label: 'No'
        }
      ]
    });
  }
}
