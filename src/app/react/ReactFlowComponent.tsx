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

// import 'reactflow/dist/style.css';
export interface FlowProps {
  onContextMenu?: (event) => void;
  nodeList?: Array<any>;
  services?: any;
  addNode?: (event) => void;
  changeNodeList: (event) => void;
}

const initialNodes = [];
const initialEdges = [
  // { id: 'e1-2', source: '1', target: '2' }, { id: 'e1-3', source: '1', target: '3' }
];

export default function App(props: FlowProps) {
  let { onContextMenu, nodeList, services, addNode , changeNodeList} = props;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactRef = React.useRef(null);
  const reactFlowWrapper = React.useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState(null);


  React.useEffect(() => {
    reactRef.current = nodeList;
    const allNodes = nodeList.map(node => {
      return {
        id: node._id,
        type: 'default',
        position: { x: node.coordinates.x, y: node.coordinates.y },
        data: { label: node.name },
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      }
    });
    const edges = [];
    nodeList.forEach(entity => {
      if (entity.onSuccess && entity.onSuccess.length > 0) {
        entity.onSuccess.forEach(success => {
          edges.push({
            id: `${entity._id}-${success._id}`,
            target: entity._id,
            source: success._id
          });
        });
      }
    });
    setNodes(allNodes)
    setEdges(edges)
  }, [JSON.stringify(nodeList), nodeList]);



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
    const target = event[0]?.target;
    const source = event[0]?.source;
    if(target && source && nodeList.find(node => node._id === source)){
      console.log('Deleting edge');
      const node = nodeList.find(node => node._id === target);
      node['onSuccess'] = removeNodeById(node['onSuccess'], source );
      node['onError'] = removeNodeById(node['onError'] || [], source);
    }
    changeNodeList(nodeList)
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

      if(node.onSuccess && node.onSuccess.filter(ele => ele._id === edge.source).length === 0 ) {
        node.onSuccess = [...node.onSuccess, obj]
      }
    })
    setEdges(currentEdges);

    changeNodeList(nodeList)
  }

  const onConnect = (event) => {
    event['id'] = `${event.target}-${event.source}`
    const currentEdges = [...edges, event];
    console.log(currentEdges);
    nodeChange(currentEdges)
  };

  return (
    <div >
      <ReactFlowProvider>
        <div style={{ position: 'absolute', left: '10px', top: '160px', zIndex: 5 }}>
          <ContextMenuComponent services={services} />
        </div>
        <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ width: '100vw', height: '85vh' }}>
          <ReactFlow

            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={(e) => {return }}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            onInit={setReactFlowInstance}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}

          >
            <Controls />
            <MiniMap zoomable pannable />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
