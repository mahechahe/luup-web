import { useState } from 'react';

export const useHandleUpload = () => {
  const [docs, setDocs] = useState([]);

  const handleUploadChange = (e) => {
    const file = e[0];
    setDocs([...docs, file]);
  };

  const handleUploadDelete = (index) => {
    const newArray = [...docs.slice(0, index), ...docs.slice(index + 1)];
    setDocs(newArray);
  };

  const handleClearUploads = () => {
    setDocs([]);
  };

  return { docs, handleUploadChange, handleUploadDelete, handleClearUploads };
};
