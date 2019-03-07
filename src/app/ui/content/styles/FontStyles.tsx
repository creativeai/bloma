import * as React from 'react';
import { Font } from '../../../fonts';

interface FontStylesProps {
  fonts: Font[];
}

export class FontStyles extends React.Component<FontStylesProps> {
  render() {
    return <style dangerouslySetInnerHTML={{ __html: this.getFontStyles() }} />;
  }

  getFontStyles() {
    return this.props.fonts.map(font => this.getFontStyle(font)).join('');
  }

  getFontStyle(font: Font) {
    return `@font-face {
      font-family: '${font.key}';
      src: url('${font.url}');
    }`;
  }
}
