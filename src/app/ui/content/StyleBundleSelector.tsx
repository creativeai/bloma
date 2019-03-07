import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { StyleBundle } from '../../index';

import './StyleBundleSelector.scss';

const EMPTY_STYLE_BUNDLE: StyleBundle = { name: 'none', styles: [] };

interface StyleBundleSelectorProps {
  allStyleBundles: StyleBundle[];
  onStyleBundleChange: (styleBundle: StyleBundle) => void;
}
interface StyleBundleSelectorState {
  selectedBundleName: string;
}
export class StyleBundleSelector extends React.Component<
  StyleBundleSelectorProps,
  StyleBundleSelectorState
> {
  constructor(props: StyleBundleSelectorProps) {
    super(props);
    this.state = { selectedBundleName: EMPTY_STYLE_BUNDLE.name };
  }

  render() {
    return (
      <div className="styleBundleSelector">
        <div className="paletteContent">
          <div
            key={EMPTY_STYLE_BUNDLE.name}
            className={classNames(
              'styleBundleSelector--styleBundle',
              'styleBundleSelector--emptyStyleBundle',
              {
                selected:
                  this.state.selectedBundleName === EMPTY_STYLE_BUNDLE.name
              }
            )}
            onClick={() => this.selectBundle(EMPTY_STYLE_BUNDLE)}
          >
            Start from scratch
          </div>
          <p className="styleBundleSelector--bundlesHeading">Brand Bundles</p>
          {this.props.allStyleBundles.map(bundle => (
            <div
              key={bundle.name}
              className={classNames('styleBundleSelector--styleBundle', {
                selected: this.state.selectedBundleName === bundle.name
              })}
              onClick={() => this.selectBundle(bundle)}
            >
              {bundle.name}
            </div>
          ))}
          {/*<div
            className={classNames(
              'styleBundleSelector--styleBundle styleBundleSelector--blankStyleBundle',
              { selected: this.state.selectedBundleName === 'Blank' }
            )}
            onClick={() => this.selectBundle({ name: 'Blank', styles: [] })}
          >
            Start from scratch
            </div>*/}
        </div>
      </div>
    );
  }

  private selectBundle(bundle: StyleBundle) {
    this.setState({ selectedBundleName: bundle.name });
    this.props.onStyleBundleChange(bundle);
  }
}
