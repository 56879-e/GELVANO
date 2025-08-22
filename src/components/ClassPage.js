import React from 'react';
import { useNavigate } from 'react-router-dom';

const ClassPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            {/* Remove the videos and search box */}
            {/* Add two buttons for navigation */}
            <button onClick={() => navigate('/class/videos')}>Videos</button>
            <button onClick={() => navigate('/class/files')}>Files</button>
        </div>
    );
};

export default ClassPage;