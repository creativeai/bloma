import * as React from 'react';

import { Sidebar } from './sidebar/Sidebar';
import { State } from './store';

import {
  Workflow,
  ActionTransform,
  Item,
  ActionParameterValues,
  ItemFrame
} from '../index';

import './DesignEngine.scss';

interface DesignEngineProps {
  state: State;
  onOpenWorkflow: (workflow: Workflow) => void;
}
export class DesignEngine extends React.Component<DesignEngineProps> {
  render() {
    return (
      <div className="designEngine">
        <header className="header" />
        <Sidebar
          workflows={this.props.state.workflows}
          onOpenWorkflow={this.props.onOpenWorkflow}
        />
        <main className="content" />
        <footer className="footer" />
      </div>
    );
  }
}
