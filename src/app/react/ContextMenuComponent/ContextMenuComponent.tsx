
import ContextMenu from "./ContextMenu";
import * as React from 'react';


export interface menuProps {
  services?: any;
  edit?: any;
}


const renderContextMenu = (nodeOptions, edit, showContextMenu) => {
  return   <div
  className={`position-absolute d-flex context-menu ${showContextMenu ? 'show' : ''}`}>
    <span className="fa fa-caret-left position-absolute font-20" style={{top: '0px', left: '-8px', textShadow: '0 0 2px #666', color: 'white'}}></span>
    <ContextMenu
    nodeOptions={nodeOptions}
    edit={edit}
  />
  </div>
}

export default function ContextMenuComponent(props: menuProps) {

  const { services, edit } = props;
  const [showContextMenu, toggleMenu] = React.useState(false)

  const nodeOptions = services.flowService.getNodeOptions();
  return (
    <div>
      <span className="dsi dsi-flow bg-white border rounded-circle p-3 hover" onClick={() => edit.status && toggleMenu(!showContextMenu)}>
      </span>
      { edit.status && renderContextMenu(nodeOptions, edit, showContextMenu)}
    </div>
  );
}
