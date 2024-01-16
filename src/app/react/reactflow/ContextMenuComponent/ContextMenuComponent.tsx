
import ContextMenu from "./ContextMenu";
import * as React from 'react';


export interface menuProps {
  services?: any;
  edit?: any;
}

export default function ContextMenuComponent(props: menuProps) {

  const { services, edit } = props;

  const nodeOptions = services.flowService.getNodeOptions();
  return (
    <ContextMenu
    nodeOptions={nodeOptions}
    edit={edit}
  />
  );
}
