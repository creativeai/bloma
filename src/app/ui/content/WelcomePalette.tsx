import * as React from 'react';

import './WelcomePalette.scss';

export class WelcomePalette extends React.Component {
  render() {
    return (
      <div className="paletteContent">
        <div className="welcomePalette">
          <img
            className="welcomePaletteLogo"
            src="assets/bloma-logo.svg"
            alt="blōma"
          />
        </div>
      </div>
    );
  }
}
