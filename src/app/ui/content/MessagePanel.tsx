import * as React from 'react';
import classNames from 'classnames';

import './MessagePanel.scss';

interface MessagePanelProps {
  body: string;
  isFullScreen?: boolean;
}
export const MessagePanel: React.SFC<MessagePanelProps> = ({
  body,
  isFullScreen
}) => {
  return (
    <div
      className={classNames('panel messagePanel', {
        'is-full-screen': isFullScreen
      })}
    >
      <p className="messagePanel--message">{body}</p>
    </div>
  );
};
