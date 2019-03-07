import * as React from 'react';

import { WorkflowList } from './WorkflowList';

import { Action as _Action, Workflow } from '../../index';

import './Sidebar.scss';

interface SidebarProps {
  workflows: Workflow[];
  onOpenWorkflow: (workflow: Workflow) => void;
}
export class Sidebar extends React.Component<SidebarProps> {
  render() {
    return (
      <aside className="sidebar">
        <header>
          <img
            className="logo"
            src="assets/creativeai-logo.svg"
            alt="creative.ai"
          />
        </header>
        <div className="sidebar-tabs">
          <div className="tabs">
            <div className="tab-content">
              <div className="tab-panel tab-workflows-panel">
                <WorkflowList
                  workflows={this.props.workflows}
                  onOpenWorkflow={w => this.onOpenWorkflow(w)}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  onOpenWorkflow(workflow: Workflow) {
    this.setState({ currentTab: 'actions' });
    this.props.onOpenWorkflow(workflow);
  }
}
