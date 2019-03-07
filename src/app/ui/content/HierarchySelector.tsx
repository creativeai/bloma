import * as React from 'react';
import classNames from 'classnames';
import {
  SortableContainer,
  SortableElement,
  arrayMove
} from 'react-sortable-hoc';
import * as _ from 'lodash';

import { Item, Element } from '../../index';
import { getElementsInHierarchyOrder } from '../../helpers/hierarchy';

import './HierarchySelector.scss';

let SortableItem = SortableElement(
  ({
    element,
    onHover
  }: {
    element: Element;
    onHover: (on: boolean) => void;
  }) => (
    <div
      className={classNames('hierarchySelector--object', {
        'has-image': hasImage(element)
      })}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="hierarchySelector--objectInfo">
        <span className="hierarchySelector--objectType">
          {getObjectType(element)}
        </span>
        {/* <span className="hierarchySelector--objectDescription">
        {getObjectDescription(element)}
      </span> */}
      </div>
      {hasImage(element) && (
        <img className="hierarchySelector--objectImg" src={getImage(element)} />
      )}
    </div>
  )
);

let SortableList = SortableContainer(
  ({
    elements,
    onHover
  }: {
    elements: Element[];
    onHover: (el: Element, on: boolean) => void;
  }) => {
    return (
      <div className="paletteContent hierarchySelector--objectList">
        {elements.map((element, index) => (
          <SortableItem
            key={`item-${index}`}
            index={index}
            element={element}
            onHover={on => onHover(element, on)}
          />
        ))}
      </div>
    );
  }
);

function getObjectType(element: Element) {
  switch (element.type) {
    case 'background_image':
      return 'Background Image';
    case 'foreground_image':
      return 'Foreground Image';
    case 'text':
      return 'Text';
  }
}

function hasImage(element: Element) {
  return (
    element.type === 'background_image' || element.type === 'foreground_image'
  );
}

function getImage(element: Element): string {
  return null;
}

interface HierarchySelectorProps {
  item: Item;
  onHierarchyChanged: (hierarchy: string[]) => void;
  onProceed: () => void;
  onHover?: (element: Element, on: boolean) => void;
}
interface HierarchySelectorState {
  sorting: boolean;
}
export class HierarchySelector extends React.Component<
  HierarchySelectorProps,
  HierarchySelectorState
> {
  constructor(props: HierarchySelectorProps) {
    super(props);
    this.state = { sorting: false };
  }

  componentWillMount() {
    if (this.getElements().length <= 1) {
      this.props.onProceed();
    }
  }

  render() {
    return (
      this.getElements().length > 1 && (
        <SortableList
          helperClass="sortableHelper"
          elements={this.getElements()}
          onHover={(el, on) =>
            !this.state.sorting && this.props.onHover(el, on)
          }
          onSortStart={() => this.onSortStart()}
          onSortEnd={args => this.onSortEnd(args)}
          lockAxis={'y'}
        />
      )
    );
  }

  getElements(props: HierarchySelectorProps = this.props) {
    return getElementsInHierarchyOrder(props.item);
  }

  onSortStart() {
    this.setState({ sorting: true });
  }

  onSortEnd({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) {
    let elements = this.getElements();
    let sortedElements = arrayMove(elements, oldIndex, newIndex);
    let newHierarchy = sortedElements.map(el => el.id);
    this.props.onHierarchyChanged(newHierarchy);
    this.setState({ sorting: false });
  }
}
