import { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  useViewport,
  ReactFlowProvider,
  Edge,
} from 'reactflow';
import * as React from 'react'
import ContextMenuComponent from './ContextMenuComponent/ContextMenuComponent';
import * as _ from 'lodash';
import CustomNode from './other/CustomNode';

// import 'reactflow/dist/style.css';
export interface FlowProps {
  onContextMenu?: (event) => void;
  nodeList?: Array<any>;
  services?: any;
  addNode?: (event) => void;
  changeNodeList?: (event) => void;
  openProperty?:(event) => void;
  edit?:any ;
  openPath?:(event) => void;
}

const initialNodes = [];
const initialEdges = [
  // { id: 'e1-2', source: '1', target: '2' }, { id: 'e1-3', source: '1', target: '3' }
];

const nodeTypes = {
  customNode: CustomNode,
};

export default function App(props: FlowProps) {
  let { onContextMenu, nodeList, services, addNode , changeNodeList, openProperty, edit, openPath} = props;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactRef = React.useRef(null);
  const reactFlowWrapper = React.useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState(null);
  const isInputNode = (node) => {
    return nodeList[0]._id == node._id;
  }

  React.useEffect(() => {
    const iconList = services.flowService.getNodeIcon();
    setEdges([])
    const allNodes = nodeList.map(node => {
      const iconObj = iconList.find(e => e.nodeType == node.type && isInputNode(node) === e.isInput) || {};
      return {
        id: node._id,
        type: 'customNode',
        position: { x: node.coordinates.x, y: node.coordinates.y },
        data: { label: node.name, type: node.nodeType, icon: iconObj.icon },
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      
      }
    });
    updateEdges()
    setNodes(allNodes)
  },[JSON.stringify(edit), JSON.stringify(nodeList)]);



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
    if(id){
     nodeList = removeNodeById(nodeList, id);
     nodeList.forEach(entity => {
        if (entity.onSuccess) {
          entity.onSuccess = removeNodeById(entity.onSuccess, id);
        }
        if (entity.onError) {
          entity.onError = removeNodeById(entity.onError, id);
        }
      })
      changeNodeList(nodeList)
    }
  }

  const onEdgesDelete = (event) => {
    event.forEach(e => {
      const target = e?.target;
      const source = e?.source;
      if(target && source ){
        if(nodeList.find(node => node._id === source)){
          console.log('Deleting edge');
          const node = nodeList.find(node => node._id === target);
         if(e.targetHandle === 'error'){
            node['onError'] = removeNodeById(node['onError'] || [], source);
          }
          else if(e.targetHandle === 'success'){
            node['onSuccess'] = removeNodeById(node['onSuccess'], source );
          }
        }
        else{
          const newEdges = edges.filter(edge => edge.id === e.id);
          setEdges(newEdges)
        }
       console.log(nodeList);
      }
    })

    updateEdges()

  }

  const updateEdges = () => {
    const edges = [];

    nodeList.forEach(entity => {
      if (entity.onSuccess && entity.onSuccess.length > 0) {
        entity.onSuccess.forEach(success => {
          edges.push({
            id: `${entity._id}-${success._id}-s`,
            target: entity._id,
            source: success._id,
            targetHandle: 'success',
            label: success.name
          });
        });
      }
      if (entity.onError && entity.onError.length > 0) {
        entity.onError.forEach(error => {
          edges.push({
            id: `${entity._id}-${error._id}-e`,
            target: entity._id,
            source: error._id,
            targetHandle: 'error',
            label: error.name

          });
        });
      }
    });

    setEdges(edges)

  }

  const nodeChange = (currentEdges) => {
    currentEdges.forEach(edge => {
      const node =nodeList.find(node => node._id === edge.target)
      const obj =  {
        index: 0,
        name: edge.label || '',
        condition: edge.data?.condition || '',
        _id: edge.source
      }
      if(edge.targetHandle === 'success'){
        if(node.onSuccess && node.onSuccess.filter(ele => ele._id === edge.source).length === 0 ) {
          node.onSuccess = [...node.onSuccess, obj]
        }
      }
      if(edge.targetHandle === 'error'){
        if(node.onError && node.onError.filter(ele => ele._id === edge.source).length === 0 ) {
          node.onError = [...node.onError, obj]
        }
      }
    })
    setEdges(currentEdges);
    console.log(nodeList);
    // changeNodeList(nodeList)
  }

  const onConnect = (event) => {
    const type = event.targetHandle?.charAt(0);
    event['id'] = `${event.target}-${event.source}-${type}`
    const currentEdges = [...edges, event];
    console.log(currentEdges);
    nodeChange(currentEdges)
  };

  const openProperties = (event,node) => {
    openProperty(node.id)
  }

  const onNodeDragStop= (event, node) => {
    nodeList.find(e => e._id == node.id).coordinates = node.position;
    console.log(nodeList);
    // changeNodeList(nodeList)
  }


  const openEdges = (event) => {
    openPath(event);
  }

  return (
    <div >
      <ReactFlowProvider>
        <div style={{ position: 'absolute', left: '10px', top: '160px', zIndex: 5 }}>
          <ContextMenuComponent services={services} />
        </div>
        <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ width: '100vw', height: '90vh' }}>
          <ReactFlow

            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            // onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            onInit={setReactFlowInstance}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onNodeClick={openProperties}
            nodeTypes={nodeTypes}
            onEdgeClick={openEdges}
            edgesUpdatable={edit.status}
            edgesFocusable={edit.status}
            nodesDraggable={edit.status}
            nodesConnectable={edit.status}
            elementsSelectable={edit.status}
            onNodeDragStop={onNodeDragStop}
          >
            <Controls showInteractive={false}/>
            <MiniMap zoomable pannable />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
