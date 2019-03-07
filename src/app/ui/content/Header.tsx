import * as React from 'react';

import './Header.scss';

interface HeaderProps {
  title: string;
}

export class Header extends React.Component<HeaderProps> {
  render() {
    return (
      <header className="header">
        <div className="header--title">{this.props.title}</div>
      </header>
    );
  }
}
