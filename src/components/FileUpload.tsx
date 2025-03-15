import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LinkIcon from '@mui/icons-material/Link';

interface FileUploadProps {
    onFileLoad: (xmlContent: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad }) => {
    const [xmlUrl, setXmlUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.xml')) {
            setError('Please upload an XML file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            onFileLoad(content);
            setError(null);
        };
        reader.onerror = () => {
            setError('Error reading file');
        };
        reader.readAsText(file);
    };

    const handleUrlSubmit = async () => {
        if (!xmlUrl) {
            setError('Please enter a URL');
            return;
        }

        try {
            const response = await fetch(xmlUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch XML');
            }
            const content = await response.text();
            onFileLoad(content);
            setError(null);
        } catch (err) {
            setError('Error loading XML from URL');
        }
    };

    return (
        <Paper 
            elevation={0}
            sx={{ 
                p: 3, 
                border: '1px solid #d0d7de',
                borderRadius: 2,
                mb: 3
            }}
        >
            <Typography variant="h6" sx={{ mb: 2 }}>Load XML Data</Typography>
            
            <Box sx={{ mb: 3 }}>
                <input
                    accept=".xml"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileUpload}
                />
                <label htmlFor="raised-button-file">
                    <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadFileIcon />}
                        sx={{
                            borderColor: '#d0d7de',
                            color: '#24292f',
                            '&:hover': {
                                borderColor: '#57606a',
                                backgroundColor: '#f3f4f6',
                            }
                        }}
                    >
                        Upload XML File
                    </Button>
                </label>
            </Box>

            <Divider sx={{ my: 2 }}>OR</Divider>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                    fullWidth
                    placeholder="Enter XML URL"
                    value={xmlUrl}
                    onChange={(e) => setXmlUrl(e.target.value)}
                    error={!!error}
                    helperText={error}
                    size="small"
                />
                <Button
                    variant="outlined"
                    onClick={handleUrlSubmit}
                    startIcon={<LinkIcon />}
                    sx={{
                        borderColor: '#d0d7de',
                        color: '#24292f',
                        '&:hover': {
                            borderColor: '#57606a',
                            backgroundColor: '#f3f4f6',
                        }
                    }}
                >
                    Load
                </Button>
            </Box>
        </Paper>
    );
};

export default FileUpload; 