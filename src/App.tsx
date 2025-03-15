import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ProductList from './components/ProductList';
import FileUpload from './components/FileUpload';
import { Product, ExtendedProduct } from './types/Product';
import { StorageService } from './services/storage';

function App() {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldLabels, setFieldLabels] = useState<{[key: string]: string}>({});
  const [originalXmlContent, setOriginalXmlContent] = useState<string | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const storageService = StorageService.getInstance();

  const parseXMLContent = (xmlContent: string, shouldStoreOriginal: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // Store original content if this is the first load
      if (shouldStoreOriginal) {
        setOriginalXmlContent(xmlContent);
      }

      // Use browser's built-in XML parser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        throw new Error('Invalid XML format');
      }

      // Get the root element
      const rootElement = xmlDoc.documentElement;
      if (!rootElement || !rootElement.children.length) {
        throw new Error('XML document is empty');
      }

      // Find the first element that has child elements (this will be our record type)
      const recordElements = Array.from(rootElement.children).filter(child => child.children.length > 0);
      if (recordElements.length === 0) {
        throw new Error('No valid records found in XML');
      }

      // Get the tag name of the first record element
      const recordTagName = recordElements[0].tagName;
      const allRecords = xmlDoc.getElementsByTagName(recordTagName);

      // Get all unique field names from the first record
      const firstRecord = allRecords[0];
      const fieldNames = Array.from(firstRecord.children).map(child => child.tagName);

      // Create mapping between feld numbers and actual field names
      const labels: {[key: string]: string} = { id: 'ID' };
      fieldNames.forEach((fieldName, index) => {
        labels[`feld${index + 1}`] = fieldName;
      });
      setFieldLabels(labels);

      // Convert XML to our product format
      const productsData = Array.from(allRecords).map((record, index) => {
        // Create a unique ID if none exists
        const id = String(index + 1);
        
        const product: any = { id };
        
        // Map XML fields to our format
        fieldNames.forEach((fieldName, index) => {
          const fieldElement = record.getElementsByTagName(fieldName)[0];
          const value = fieldElement ? fieldElement.textContent : '';
          
          // Map to feld1, feld2, etc. format
          product[`feld${index + 1}`] = value || '';
        });
        
        return product as Product;
      });

      // Store source data
      setSourceProducts(productsData);
      
      // Merge with custom fields from local storage
      const extendedProducts = storageService.mergeWithSourceData(productsData);
      setProducts(extendedProducts);
      storageService.updateLastSync();
      setLoading(false);
    } catch (err) {
      setError('Failed to parse XML data. Please check the file format.');
      console.error('Error parsing XML:', err);
      setLoading(false);
    }
  };

  const handleAddCustomField = (animalId: string, fieldName: string, fieldLabel: string, value: string) => {
    // Store the modification in local storage
    storageService.addCustomField(animalId, { name: fieldName, label: fieldLabel, value });
    
    // Update the products state with the new data
    const updatedProducts = storageService.mergeWithSourceData(sourceProducts);
    setProducts(updatedProducts);
  };

  const handleRemoveCustomField = (animalId: string, fieldName: string) => {
    storageService.removeCustomField(animalId, fieldName);
    const updatedProducts = storageService.mergeWithSourceData(sourceProducts);
    setProducts(updatedProducts);
  };

  const handleRestoreClick = () => {
    setIsRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = () => {
    if (originalXmlContent) {
      // Clear storage first
      storageService.clearAllData();
      // Then parse the original content
      parseXMLContent(originalXmlContent, false);
      // Reset any error state
      setError(null);
    }
    setIsRestoreDialogOpen(false);
  };

  const handleRestoreCancel = () => {
    setIsRestoreDialogOpen(false);
  };

  // Add useEffect to handle products update after storage clear
  useEffect(() => {
    if (sourceProducts.length > 0) {
      const extendedProducts = storageService.mergeWithSourceData(sourceProducts);
      setProducts(extendedProducts);
    }
  }, [sourceProducts]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                mb: 2,
                color: '#24292f',
                fontWeight: 600
              }}
            >
              XML Viewer
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#57606a',
                mb: 3
              }}
            >
              Upload an XML file or provide a URL to view and manage your data.
            </Typography>
          </Box>

          {originalXmlContent && (
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleRestoreClick}
              sx={{
                borderColor: '#d0d7de',
                color: '#24292f',
                '&:hover': {
                  borderColor: '#57606a',
                  backgroundColor: '#f3f4f6',
                }
              }}
            >
              Restore Original
            </Button>
          )}
        </Box>

        <FileUpload onFileLoad={parseXMLContent} />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography 
          color="error" 
          sx={{ 
            mb: 2,
            p: 2,
            bgcolor: '#ffebe9',
            border: '1px solid rgba(255, 129, 130, 0.4)',
            borderRadius: 1
          }}
        >
          {error}
        </Typography>
      )}

      {products.length > 0 && (
        <ProductList 
          products={products}
          onAddCustomField={handleAddCustomField}
          onRemoveCustomField={handleRemoveCustomField}
          fieldLabels={fieldLabels}
        />
      )}

      <Dialog
        open={isRestoreDialogOpen}
        onClose={handleRestoreCancel}
      >
        <DialogTitle>Restore Original Data</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore the original data? This will remove all custom modifications and restore the initial state of the XML file.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRestoreCancel}>Cancel</Button>
          <Button 
            onClick={handleRestoreConfirm}
            variant="contained"
            color="primary"
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
