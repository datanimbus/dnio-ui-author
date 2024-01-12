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
      <div className='d-flex'>
      <span className={data.icon + ' nodeIcon'}></span>
      <span>{data.label}</span>
      </div>
      <Handle
        type="target"
        position={Position.Right}
        id="error"
        isConnectable={isConnectable}
        className='errorNode'
      />
    </>
  );
});
