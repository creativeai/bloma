import * as React from 'react';
import { ItemFrame } from '../../index';
import { FrameVisualizationProps } from './index';

import './KMeans.scss';

interface KMeansProps extends FrameVisualizationProps {}
interface KMeansState {
  imageUrl: string;
}
export class KMeans extends React.Component<KMeansProps, KMeansState> {
  constructor(props: KMeansProps) {
    super(props);
    this.state = { imageUrl: null };
  }

  componentWillMount() {
    this.renderImage(this.props.frame);
  }

  componentWillReceiveProps(newProps: KMeansProps) {
    this.renderImage(newProps.frame);
  }

  render() {
    return (
      <div className="kMeansVisualization" style={this.props.position}>
        {this.state.imageUrl && <img src={this.state.imageUrl} />}
      </div>
    );
  }

  renderImage(frame: ItemFrame) {
    this.setState({
      imageUrl: frame.metadata.kMeansImage.toDataURL()
    });
  }
}
