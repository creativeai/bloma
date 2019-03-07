import * as React from 'react';
import { Link } from 'react-router-dom';
import { Workflow } from '../../index';

interface WorkflowListProps {
  workflows: Workflow[];
  onOpenWorkflow: (workflow: Workflow) => void;
}
export class WorkflowList extends React.Component<WorkflowListProps> {
  render() {
    return (
      <div className="workflows">
        {this.props.workflows.map((workflow, workflowIdx) => (
          <div key={workflowIdx} className="workflow">
            <div className="workflow-title">
              <a onClick={() => this.props.onOpenWorkflow(workflow)}>
                {workflow.name}
              </a>{' '}
              <Link to={`/${workflow.name}`}>Launch</Link>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
