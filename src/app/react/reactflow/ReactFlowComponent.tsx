import { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  ReactFlowProvider,
  ConnectionLineType,
  ReactFlowProps,
} from 'reactflow';
import * as React from 'react'
import ContextMenuComponent from './ContextMenuComponent/ContextMenuComponent';
import * as _ from 'lodash';
import ConnectionLine from './custom-components/ConnectionLine';
import CustomErrorNode from './custom-components/CustomErrorNode';
import CustomNode from './custom-components/CustomNode';


export interface FlowProps {
  nodeList?: Array<any>;
  services?: any;
  addNode?: (event) => void;
  changeNodeList?: (event) => void;
  openProperty?: (event) => void;
  edit?: any;
  errorList?: Array<any>;
  openPath?: (event) => void;
  onChange?: (event) => void;
}


const nodeTypes = {
  customNode: CustomNode,
  customErrorNode: CustomErrorNode
};

export default function ReactFlowComponent(props: FlowProps) {
  const {  nodeList, services, addNode, changeNodeList, openProperty, edit, errorList, openPath, onChange } = props;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, _] = useEdgesState([]);
  const reactFlowWrapper = React.useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState(null);
  const isInputNode = (node) => {
    return nodeList[0]._id == node._id;
  }

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const data = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      const type = data.nodeType;
      const item = data.item
      if (typeof type === 'undefined' || !type) {
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode({ position, item })
        ;
    },
    [reactFlowInstance],
  );

  const removeNodeById = (list, id) => {
    return list.filter(item => item._id !== id)
  }

  const onNodesDelete = (event) => {
    const id = event[0]?.id;
    if (id) {
      const list = removeNodeById(nodeList, id);
      list.forEach(entity => {
        if (entity.onSuccess) {
          entity.onSuccess = removeNodeById(entity.onSuccess, id);
        }
        if (entity.onError) {
          entity.onError = removeNodeById(entity.onError, id);
        }
      })
      changeNodeList(list)
    }
  }

  const onEdgesDelete = (event) => {
    event.forEach(e => {
      const target = e?.target;
      const source = e?.source;
      if (target && source) {
        if (nodeList.find(node => node._id === source)) {
          console.log('Deleting edge');
          const node = nodeList.find(node => node._id === target);
          if (e.targetHandle === 'error') {
            node['onError'] = removeNodeById(node['onError'] || [], source);
          }
          else if (e.targetHandle === 'success') {
            node['onSuccess'] = removeNodeById(node['onSuccess'], source);
          }
        }
        else {
          const newEdges = edges.filter(edge => edge.id === e.id);
          setEdges(newEdges)
        }
      }
    })

    onChange(event)
    updateEdges()

  }

  const updateEdges = () => {
    const edges = [];

    nodeList.forEach(entity => {
      if (entity.onSuccess && entity.onSuccess.length > 0) {
        entity.onSuccess.forEach(success => {
          edges.push({
            id: `${entity._id}-${success._id}-s`,
            type: ConnectionLineType.SmoothStep,
            target: entity._id,
            source: success._id,
            targetHandle: 'success',
            label: success.name || '',
            data: success,
            style: success['color'] ? { stroke: `#${success.color}` } : {}
          });
        });
      }
      if (entity.onError && entity.onError.length > 0) {
        entity.onError.forEach(error => {
          edges.push({
            id: `${entity._id}-${error._id}-e`,
            type: ConnectionLineType.SmoothStep,
            target: entity._id,
            source: error._id,
            targetHandle: 'error',
            label: error.name || '',
            data: error,
            style: { stroke: '#F44336' }

          });
        });
      }
    });

    setEdges(edges)
    // services.flowService.selectedPath.emit(null)
  }

  const nodeChange = (currentEdges) => {
    currentEdges.forEach((edge) => {
      const node = nodeList.find((n) => n._id === edge.target);
      const obj = {
        index: 0,
        name: edge.label || '',
        condition: edge.data?.condition || '',
        _id: edge.source,
        color: edge?.style?.stroke || ''
      };
      if (edge.targetHandle === 'success' || edge.targetHandle === 'error') {
        const element = edge.targetHandle === 'error' ? 'onError' : 'onSuccess';
        const targetArray = node[element] || [];
        if (!targetArray.some((ele) => ele._id === edge.source)) {
          node[element] = edge.targetHandle === 'error' ? [obj] : addIndextoSuccess(targetArray, obj);
        }
      }
    });
    setEdges(currentEdges);
    // changeNodeList(nodeList)
  };

  const addIndextoSuccess = (paths, toAdd) => {
    // const newPath = paths.length;
    // toAdd['index'] = paths.length;
    return [...paths, toAdd];
  }
  

  const onConnect = (event) => {
    const type = event.targetHandle?.charAt(0);
    event['id'] = `${event.target}-${event.source}-${type}`
    event['type']= ConnectionLineType.SmoothStep;
    const currentEdges = [...edges, event];
    nodeChange(currentEdges)
  };

  const openProperties = (event, node) => {
    openProperty(node.id)
  }

  const onNodeDragStop = (event, node) => {
    nodeList.find(e => e._id == node.id).coordinates = node.position;
  }


  const openEdges = (event, edge) => {
    openPath(edge);
  }

  const editString = JSON.stringify(edit);
  const nodeListString = JSON.stringify(nodeList);
  const errorListString = JSON.stringify(errorList);

  const reactFlowProps: ReactFlowProps = {
    nodes,
    edges,
    edgesUpdatable: edit.status,
    edgesFocusable: edit.status,
    nodesDraggable: edit.status,
    nodesConnectable: edit.status,
    elementsSelectable: edit.status,
    fitView: true,
    onNodesChange: onNodesChange,
    onConnect: onConnect,
    onDrop: onDrop,
    onDragOver: onDragOver,
    onInit: setReactFlowInstance,
    onNodesDelete: onNodesDelete,
    onEdgesDelete: onEdgesDelete,
    onNodeClick: openProperties,
    nodeTypes: nodeTypes,
    onEdgeClick: openEdges,
    onNodeDragStop: onNodeDragStop,
    // connectionLineType: ConnectionLineType.SmoothStep,
    proOptions: { hideAttribution: true },
    connectionLineComponent: ConnectionLine
  };




  React.useEffect(() => {
    const iconList = services.flowService.getNodeIcon();
    setEdges([])
    const allNodes = nodeList.map(node => {
      const iconObj = iconList.find(e => e.nodeType == node.type && isInputNode(node) === e.isInput) || {};
      if(node.type && !node.nodeType){
        node.nodeType = node.type === 'ERROR' ? 'customErrorNode' : 'customNode'
      }
      // const hasErrors = errorList.find(e => e._id == node._id)?.errors?.length > 0;
      return {
        id: node._id,
        type: node.type === 'ERROR' ? 'customErrorNode' : 'customNode',
        position: { x: node.coordinates.x, y: node.coordinates.y },
        data: { label: node.name, type: node.nodeType, icon: iconObj.icon, nodeType: node.type },
        sourcePosition: Position.Left,
        targetPosition: Position.Right,

      }
    });
    updateEdges()
    setNodes(allNodes)
  }, [editString, nodeListString,errorListString]);

  return (
    <div className='d-flex'>
      <div style={{ }}>
          <ContextMenuComponent services={services} edit={edit} />
        </div>
      <ReactFlowProvider>
        <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ width: '100vw', height: '82vh' }}>
          <ReactFlow {...reactFlowProps}>
            <Controls showInteractive={false} />
            <MiniMap zoomable pannable style={{ width: '150', height: '100' }} />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
