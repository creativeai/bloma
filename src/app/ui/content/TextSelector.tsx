import * as React from 'react';
import * as update from 'immutability-helper';
import * as _ from 'lodash';

import { Item, TextElement, TextHeadingLevel, TextContent } from '../../index';
import { findElement } from '../../helpers/frames';

import './TextSelector.scss';

interface TextSelectorProps {
  item: Item;
  onTextChanged: (newText: TextContent[]) => void;
}
interface TextSelectorState {
  text: TextContent[];
}
export class TextSelector extends React.PureComponent<
  TextSelectorProps,
  TextSelectorState
> {
  headingInputRef: React.RefObject<HTMLInputElement> = React.createRef();

  constructor(props: TextSelectorProps) {
    super(props);
    this.state = {
      text: [
        { text: this.initText(props, 'h1'), level: 'h1' },
        { text: this.initText(props, 'h2'), level: 'h2' }
      ]
    };
  }

  render() {
    return (
      <div className="textSelector paletteContent">
        <form onSubmit={e => this.onSubmit(e)}>
          <input
            type="text"
            id="heading-content"
            value={_.find(this.state.text, { level: 'h1' }).text}
            placeholder="Enter heading"
            autoComplete="off"
            maxLength={140}
            ref={this.headingInputRef}
            onChange={evt => this.onTextChange(evt.target.value, 'h1')}
          />
          {
            <input
              type="text"
              id="subHeading-content"
              value={_.find(this.state.text, { level: 'h2' }).text}
              placeholder="Enter subheading"
              autoComplete="off"
              maxLength={140}
              onChange={evt => this.onTextChange(evt.target.value, 'h2')}
            />
          }
          <button
            className="textSelector--addButton"
            onClick={evt => this.onSubmit(evt)}
          >
            Add text
          </button>
        </form>
      </div>
    );
  }

  componentDidMount() {
    this.headingInputRef.current.focus();
  }

  onTextChange(newText: string, level: TextHeadingLevel) {
    let index = _.findIndex(this.state.text, { level });
    this.setState({
      text: update(this.state.text, { [index]: { text: { $set: newText } } })
    });
  }

  onSubmit(evt: React.SyntheticEvent) {
    this.props.onTextChanged(this.state.text);
    evt.preventDefault();
  }

  initText(props: TextSelectorProps, level: TextHeadingLevel): string {
    let el = findElement(props.item, 'text') as TextElement;
    if (el && el.content) {
      let content = _.find(el.content, { level });
      if (content) {
        let text = content.text;
        if (_.isArray(text)) {
          return text.join();
        } else {
          return text;
        }
      }
    }
    return '';
  }
}
