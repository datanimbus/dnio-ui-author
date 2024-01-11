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
} from 'reactflow';
import * as React from 'react'

// import 'reactflow/dist/style.css';
export interface FlowProps {
  onContextMenu?: (event) => void;
  nodeList?: Array<any>;
}

const initialNodes = [];
const initialEdges = [
  // { id: 'e1-2', source: '1', target: '2' }, { id: 'e1-3', source: '1', target: '3' }
];

export default function App(props: FlowProps){
  const {onContextMenu, nodeList} = props;
  const [nodes, setNodes, onNodesChange] = useNodesState(nodeList);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactRef= React.useRef(null);
  const flowRef = React.useRef(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
    console.log(allNodes);
    setNodes(allNodes)
  }, [JSON.stringify(nodeList)]);


  const bounds =(event) => {
    const reactFlowBounds = document.querySelector('.react-flow').getBoundingClientRect(); // this could also be done with a ref
const position = {
  x: event.clientX - reactFlowBounds.left,
  y: event.clientY - reactFlowBounds.top,
}

    event['nodeXY'] = position
    console.log(position);
    onContextMenu(event);  
  }

  const test = (event) => {
    onEdgesChange(event);
    console.log(nodes);
  }

  return (
    <div style={{ width: '100vw', height: '85vh' }}>
      <ReactFlow

        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={(e) => test(e)}
        onConnect={onConnect}
        fitView
        onPaneContextMenu={(e) => bounds(e)}
      >
        <Controls />
        <MiniMap zoomable pannable/>
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
