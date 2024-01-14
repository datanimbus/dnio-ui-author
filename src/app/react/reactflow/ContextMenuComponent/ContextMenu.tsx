import * as React from "react";


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

function TreeNode({ item, index, ctr, edit }) {
    const evaluateCondition = (condition) => {
      return true; 
    };
  
    const editable = edit?.status;
    return (
      <div
        className={`node-item border-bottom pl-3 pr-2 py-2 hover ${item.disabled ? 'disabled' : ''}`}
        style={{ display: evaluateCondition(item.condition) ? 'block' : 'none', fontSize: '10px' }}
      >
       <div className="d-flex">
       <div className="d-flex align-items-center flex-grow-1" onDragStart={(event) => onDragStart(event, 'default', item)} draggable={editable && !item.children} onClick={(e) => e.preventDefault()}>
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
              left: ctr > 1 ? 150 : 110,
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
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  function ContextMenu({ nodeOptions, edit }) {
    return (
        <div
          className="available-nodes-dropdown bg-white border rounded"
        >
          {nodeOptions.map((item, index) => (
            <TreeNode
              key={index}
              item={item}
              index={index}
              ctr={1}
              edit={edit}
            />
          ))}
        </div>
    );
  }
  
  export default ContextMenu;
  