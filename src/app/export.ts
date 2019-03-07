import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';
import { renderFlat } from './helpers/images';

import { Item } from './index';

function getTimestamp() {
  let now = new Date();
  let date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  let time = [now.getHours(), now.getMinutes(), now.getSeconds()];

  let dateS = date.map(d => (d < 10 ? `0${d}` : '' + d));
  let timeS = time.map(t => (t < 10 ? `0${t}` : '' + t));

  return dateS.join('') + timeS.join('');
}

export function getZIP(items: Item[], filePrefix = 'bloma_') {
  let name = `${filePrefix}_export_${getTimestamp()}`;

  let zip = new JSZip();
  let folder = zip.folder(name);

  function compress(item: Item) {
    let data = renderFlat(item, item.frames.map(f => f.name));
    let itemFolder = folder;
    for (let frame of item.frames) {
      if (frame.metadata && frame.metadata.folderName) {
        for (let meta of frame.metadata.folderName) {
          itemFolder = itemFolder.folder(meta);
        }
      }
    }
    // Strip the "data:[<MIME-type>][;charset=<encoding>][;base64]," data
    let fileName = '';
    for (let frame of item.frames) {
      if (frame.metadata && frame.metadata.fileName) {
        for (let meta of frame.metadata.fileName) {
          if (_.isEmpty(fileName)) {
            fileName = meta;
          } else {
            fileName += '__' + meta;
          }
        }
      }
    }
    fileName += '__' + getFilename();

    itemFolder.file(fileName, data.substr(data.indexOf(',') + 1), {
      base64: true
    });
  }

  for (let item of items) {
    compress(item);
  }

  return zip.generateAsync({ type: 'blob' });
}

export function toZIP(items: Item[], filePrefix = 'bloma_') {
  getZIP(items, filePrefix).then(content => {
    let name = `${filePrefix}_export_${getTimestamp()}`;
    saveAs(content, name + '.zip');
  });
}

function getFilename() {
  return (
    Math.random()
      .toString(36)
      .slice(2) + '.jpg'
  );
}
