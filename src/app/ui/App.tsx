import * as React from 'react';
import { Router, Route, Switch, RouteComponentProps } from 'react-router-dom';
import { History } from 'history';
import createBrowserHistory from 'history/createBrowserHistory';

import { DesignEngine } from './DesignEngine';
import { StandaloneWorkflow } from './StandaloneWorkflow';

import { State } from './store';

import {
  ActionParameterValues,
  Item,
  ItemFrame,
  Workflow,
  ActionTransform
} from '../index';

interface MatchParams {
  workflowName: string;
}
interface AppProps {
  state: State;
  onSetCurrentAction: (groupIdx: number, actionIdx: number) => void;
  onParamValuesChange: (newValues: ActionParameterValues) => void;
  onSetActionState: (key: string, value: any) => void;
  onUpdateItem: (itemIdx: number, newItem: Item) => void;
  onToggleSelectItem: (itemIdx: number, selected: boolean) => void;
  onDirectEditItem: (item: Item, index: number) => void;
  onDirectUpdateFrame: (index: number, frame: ItemFrame) => void;
  onDirectEditSave: () => void;
  onDirectEditCancel: () => void;
  onProceed: () => void;
  onExport: () => void;
  onDismissPalette: () => void;
  onOpenWorkflow: (workflow: Workflow) => void;
}
interface AppState {
  history: History;
}
export class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = { history: createBrowserHistory() };
  }

  render() {
    return (
      <Router history={this.state.history}>
        <div>
          <Switch>
            <Route exact path="/" render={props => this.renderRoot(props)} />
            <Route
              path="/:workflowName"
              render={props => this.renderStandaloneWorkflow(props)}
            />
          </Switch>
        </div>
      </Router>
    );
  }

  renderRoot(props: RouteComponentProps<MatchParams>) {
    return <DesignEngine {...props} {...this.props} />;
  }

  renderStandaloneWorkflow(
    props: RouteComponentProps<MatchParams>,
    workflowName = props.match.params.workflowName
  ) {
    return (
      <StandaloneWorkflow
        {...props}
        {...this.props}
        workflowName={workflowName}
      />
    );
  }
}
