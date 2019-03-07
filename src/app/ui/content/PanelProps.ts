import { Action, Item } from '../../index';

export interface PanelProps {
  action: Action;
  allActions: Action[][];
  currentActionIndex: [number, number];
  isProceedable: boolean;
  onProceed: () => void;
  onUpdateItem: (index: number, item: Item) => void;
  onToggleSelectItem: (index: number, selected: boolean) => void;
}
