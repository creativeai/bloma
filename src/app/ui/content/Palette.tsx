import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { Action } from '../../index';

import './Palette.scss';

interface PaletteProps {
  action: Action;
  isProceedable: boolean;
  isDismissed: boolean;
  onProceed: () => void;
}
interface PaletteState {
  indicateProgress: boolean;
  latestActionClass: string;
}
export class Palette extends React.Component<PaletteProps, PaletteState> {
  private rootRef: React.RefObject<HTMLDivElement> = React.createRef();
  private scheduledProgress: number;

  constructor(props: PaletteProps) {
    super(props);
    this.state = { indicateProgress: false, latestActionClass: null };
  }

  componentWillReceiveProps(newProps: PaletteProps) {
    if (_.isEmpty(newProps.action.items) && !this.scheduledProgress) {
      this.scheduledProgress = window.setTimeout(() => {
        this.setState({ indicateProgress: true });
        this.scheduledProgress = null;
      }, 500);
    } else {
      if (this.state.indicateProgress) {
        this.setState({ indicateProgress: false });
      }
      if (this.scheduledProgress) {
        clearTimeout(this.scheduledProgress);
        this.scheduledProgress = null;
      }
    }
    this.setState({ latestActionClass: this.getActionClass(newProps) });
  }

  componentDidUpdate() {
    this.setDynamicPosition();
  }

  render() {
    return (
      <div
        key="palette"
        className={classNames(
          'palette',
          this.getActionClass(),
          this.getArrowClass(),
          { 'is-dismissed': this.props.isDismissed }
        )}
        ref={this.rootRef}
      >
        <div className="paletteHeader">
          <h2 className="paletteTitle">
            <TransitionGroup component={null}>
              {this.renderTitleContent()}
            </TransitionGroup>
          </h2>
        </div>
        <TransitionGroup className="paletteGuidance">
          {this.renderGuidanceContent()}
        </TransitionGroup>
        {this.props.children}
        {/* <div className="paletteFooter" /> */}
        <button
          className="paletteProceedBtn"
          key="proceed"
          disabled={!this.props.isProceedable}
          onClick={this.props.onProceed}
        >
          {(this.props.action && this.props.action.transform.proceedLabel) ||
            'Next'}
        </button>
      </div>
    );
  }

  setDynamicPosition() {
    let domElement = this.getSelectedDomElement();
    if (domElement) {
      let anchorPosition = domElement.getBoundingClientRect();
      let palettePosition = this.rootRef.current.getBoundingClientRect();
      let windowMiddle = window.innerWidth / 2;
      let anchorIsLeft =
        anchorPosition.left + anchorPosition.width / 2 < windowMiddle;
      let pos = anchorIsLeft
        ? {
            left: anchorPosition.left - palettePosition.width - 50,
            top: anchorPosition.top
          }
        : {
            left: anchorPosition.right + 50,
            top: anchorPosition.top
          };
      this.rootRef.current.style.left = `${pos.left}px`;
      this.rootRef.current.style.top = `${pos.top}px`;
      this.rootRef.current.style.transform = 'translate(0, 0)';
    } else {
      this.rootRef.current.style.left = null;
      this.rootRef.current.style.top = null;
      this.rootRef.current.style.transform = null;
    }
  }

  getActionClass(props: PaletteProps = this.props) {
    if (this.state.indicateProgress) {
      return 'working';
    } else if (props.action && !_.isEmpty(props.action.transform.title)) {
      return (
        _.kebabCase(props.action.transform.title) +
        ' ' +
        _.get(props, 'action.transform.actionPanelProps.stage', '')
      );
    } else {
      return this.state.latestActionClass;
    }
  }

  getArrowClass() {
    let domElement = this.getSelectedDomElement();
    if (domElement) {
      let anchorPosition = domElement.getBoundingClientRect();
      let windowMiddle = window.innerWidth / 2;
      let anchorIsLeft =
        anchorPosition.left + anchorPosition.width / 2 < windowMiddle;
      return anchorIsLeft ? 'arrowRight' : 'arrowLeft';
    }

    return null;
  }

  getSelectedDomElement() {
    if (
      this.props.action &&
      this.props.action.transform.actionPanelProps &&
      this.props.action.transform.actionPanelProps
        .paletteFollowsSelectedElement &&
      this.props.action.state.selectedElement
    ) {
      let elementId = this.props.action.state.selectedElement.id;
      return document.querySelector(`[data-element-id="${elementId}"]`);
    }
    return null;
  }

  renderTitleContent() {
    return (
      this.props.action && (
        <CSSTransition
          classNames="paletteTitleContent"
          timeout={{ enter: 600, exit: 300 }}
          key={this.props.action.id}
          appear
        >
          <div className="paletteTitleContent">
            {this.props.action.transform.title}
          </div>
        </CSSTransition>
      )
    );
  }

  renderGuidanceContent() {
    if (this.state.indicateProgress) {
      return (
        <CSSTransition
          classNames="paletteGuidanceContent"
          timeout={{ enter: 1600, exit: 300 }}
          key={'working'}
        >
          <div className="paletteGuidanceContent">
            Take a few breaths while we do our magic…
          </div>
        </CSSTransition>
      );
    }
    if (!this.props.action) {
      return null;
    }
    let guidanceGen = this.props.action.transform.guidance;
    let guidance = _.isFunction(guidanceGen)
      ? guidanceGen(this.props.action)
      : { key: this.props.action.id, content: guidanceGen };
    return (
      this.props.action && (
        <CSSTransition
          classNames="paletteGuidanceContent"
          timeout={{ enter: 1600, exit: 300 }}
          key={guidance.key}
          appear
        >
          <div className="paletteGuidanceContent">{guidance.content}</div>
        </CSSTransition>
      )
    );
  }
}
