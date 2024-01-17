import * as React from 'react';


export interface menuProps {
  services?: any;
  edit?: any;
  nodeList: Array<any>;
}

const onDragStart = (event, nodeType, item) => {
  event.dataTransfer.setData('application/reactflow', JSON.stringify({
      nodeType, item
  }));
  event.dataTransfer.effectAllowed = 'move';
  event.target.innerHtml = `
  <div>
        <span class="font-13 fw-400">{item.name}</span>
      </div>
  `
};

const TreeNode = ({ item, index, ctr, edit, nodeList }) =>  {
  const evaluateCondition = (condition) => {
    return true; 
  };

  const canDrag = () => {
    if(item.action === 'ERROR' && nodeList.find(ele => ele.type === 'ERROR')){
      return false
    }
    return true;
  };
  const editable = edit?.status;
  return (
    <div
      className={`node-item border-bottom pl-3 pr-2 py-2 hover ${item.disabled ? 'disabled' : ''}`}
      style={{ display: evaluateCondition(item.condition) ? 'block' : 'none', fontSize: '10px' }}
    >
     <div className="d-flex">
     <div className="d-flex align-items-center flex-grow-1" onDragStart={(event) => onDragStart(event, 'default', item)} draggable={editable && !item.children && canDrag()} onClick={(e) => e.preventDefault()}>
        <span className={`node-icon font-14 fw-400 mr-2 ${item.icon}`}></span>
        <span className="font-10 fw-400 flex-grow-1">{item.name}</span>
      </div>
      {item.children && (
        <span className="node-icon font-16 fw-400 dsi dsi-drop-up fa-rotate-90 text-secondary"></span>
      )}
     </div>
      {item.children && (
        <div
          className="node-list-item bg-white rounded border"
          style={{
            left: ctr > 1 ? 150 : 120,
            // top: index * 32,
          }}
        >
          {item.children.map((child, i) => (
            <TreeNode
              key={i}
              item={child}
              index={i}
              ctr={ctr + 1}
              edit={edit}
              nodeList={nodeList}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ContextMenu = ({ nodeOptions, edit, nodeList }) => {
  return (
      <div
        className="available-nodes-dropdown bg-white border rounded position-absolute"
      >
        {nodeOptions.map((item, index) => (
          <TreeNode
            key={index}
            item={item}
            index={index}
            ctr={1}
            edit={edit}
            nodeList={nodeList}
          />
        ))}
      </div>
  );
}

export default function ContextMenuComponent(props: menuProps) {

  const { services, edit, nodeList } = props;

  const nodeOptions = services.flowService.getNodeOptions();
  return (
    <ContextMenu
    nodeOptions={nodeOptions}
    edit={edit}
    nodeList={nodeList}
  />
  );
}
