import{ useState } from "react";
import ContextMenu from "./ContextMenu"; // Import your ContextMenu component
import * as React from 'react';


export interface menuProps {
    services?: any;
  }

export default function ContextMenuComponent(props: menuProps) {
  // Define your 'services' object or any data you want to pass

  const {services} = props;

  // Other state and functions for your app
  const [contextMenuStyle, setContextMenuStyle] = useState(null);
  const [edit, setEdit] = useState({ status: false });
  const nodeOptions = services.flowService.getNodeOptions(); // Define your nodeOptions array
  const addNode = (e, action) => {
    // Your addNode function logic
  };


  return (
    <div>
      {/* Render the ContextMenu component and pass 'services' prop */}
      <ContextMenu
        nodeOptions={nodeOptions}
        addNode={addNode}
      />

      {/* The rest of your application */}
    </div>
  );
}
