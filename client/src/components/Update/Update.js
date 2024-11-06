import React, { useState } from 'react'
import axios from 'axios'
import { Box, Typography } from '@mui/material';

function Update() {
    const [terminalId, setTerminalId] = useState('');
    const [secondsToAdd, setSecondsToAdd] = useState('');
    const [message, setMessage] = useState('');

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        console.log("Updating CDNuts for Terminal ID:", terminalId); // Log the terminal ID
        try {
            const response = await axios.put(`http://localhost:8000/ESCalc/update/cdnuts/${terminalId}`, {
                secondsToAdd: Number(secondsToAdd),
            });
            setMessage(`Timestamp updated successfully: ${response.data.TimestampId}`);
        } catch (error) {
            console.error('Error updating Timestamp:', error);
            setMessage('Failed to update Timestamp.');
        }
    };
    return (
        <div>
            <Box sx={{ mb: 3, mt: 5 }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 2, mt: 5 }}>
                    Update Timestamp
                </Typography>
                <form onSubmit={handleUpdateSubmit}>
                    <div>
                        <label>Terminal ID:</label>
                        <input
                            type="text"
                            value={terminalId}
                            onChange={(e) => setTerminalId(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Seconds to Add:</label>
                        <input
                            type="number"
                            value={secondsToAdd}
                            onChange={(e) => setSecondsToAdd(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Update Timestamp</button>
                </form>
                {message && <p>{message}</p>}
            </Box>
        </div>
    )
}

export default Update