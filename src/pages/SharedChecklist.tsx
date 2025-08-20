
// src/pages/SharedChecklist.tsx
import React from 'react';
import Checklist from './Checklist';

const SharedChecklist: React.FC = () => {
  return (
    <div>
      <Checklist isReadOnly={true} />
    </div>
  );
};

export default SharedChecklist;
