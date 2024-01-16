import * as React from  'react';
import  { memo } from 'react';
import { Handle, Position } from 'reactflow';


interface handleProps {
    data: any; 
    isConnectable: boolean;
  }

export default memo((props: handleProps) => {
    const {data, isConnectable} = props;
    
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={data.type == 'output' ? {display: 'none', background: '#fff'} : { background: '#fff', border: '0.5px solid rgb(102,102,102, 0.7)'}}
      />
      <div className='d-flex align-items-center'>
      <span className={data.icon + ' nodeIcon'}></span>
      <span>{data.label}</span>
      </div>
      {data.nodeType !== 'ERROR' && <Handle
        type="source"
        position={Position.Right}
        id="success"
        // style={{ top:5, bottom:'auto', background: '#ccf3e5', border: '1px solid rgb(47,196,143, 0.7)' }}
        isConnectable={isConnectable}
        className='successHandle'
      />}
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        isConnectable={isConnectable}
        className={data.nodeType === 'ERROR' ? 'errorNode' : 'errorHandle'}
      />
    </>
  );
});
