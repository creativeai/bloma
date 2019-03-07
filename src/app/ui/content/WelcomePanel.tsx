import * as React from 'react';
import * as MobileDetect from 'mobile-detect';
import * as _ from 'lodash';

import { PanelProps } from './PanelProps';

import './WelcomePanel.scss';

const AUTO_PROCEED_TIMEOUT = 2000;

interface WelcomePanelState {
  isMobile: boolean;
}
export class WelcomePanel extends React.PureComponent<
  PanelProps,
  WelcomePanelState
> {
  private autoProceedTimer: number;

  constructor(props: PanelProps) {
    super(props);
    this.state = { isMobile: false };
  }

  componentWillMount() {
    let isMobile = new MobileDetect(window.navigator.userAgent).mobile();
    if (!isMobile) {
      this.autoProceedTimer = (setTimeout(
        this.proceed,
        AUTO_PROCEED_TIMEOUT
      ) as unknown) as number;
    }
    this.setState({
      isMobile
    });
  }

  componentWillUnmount() {
    if (_.isNumber(this.autoProceedTimer)) {
      clearTimeout(this.autoProceedTimer);
    }
  }

  componentWillReceiveProps(newProps: PanelProps) {
    if (newProps.action.hasProceeded && _.isNumber(this.autoProceedTimer)) {
      clearTimeout(this.autoProceedTimer);
      this.autoProceedTimer = null;
    }
  }

  render() {
    return (
      <div className="panel welcomePanel">
        <img
          className="pencilCircle circleOne"
          src="assets/circle-1.png"
          alt="Pencil circle"
        />
        <img
          className="pencilCircle circleTwo"
          src="assets/circle-1.png"
          alt="Pencil circle"
        />
        <img
          className="pencilCircle circleThree"
          src="assets/circle-3.png"
          alt="Pencil circle"
        />
        {this.state.isMobile && (
          <div className="mobileWarning">
            <p>
              Looks like you're using blōma on a mobile device. Unfortunately
              we're not quite ready for that yet.
              <br />
              Please give it a go on a desktop!
            </p>
          </div>
        )}
      </div>
    );
  }

  componentDidMount() {
    this.props.onToggleSelectItem(0, true);
  }

  proceed = () => {
    this.props.onProceed();
  };
}
