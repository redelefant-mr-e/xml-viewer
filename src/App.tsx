import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Link } from '@mui/material';
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
      if (!rootElement) {
        throw new Error('XML document is empty');
      }

      // Function to convert XML node to flat object
      const nodeToObject = (node: Element): { [key: string]: string } => {
        const obj: { [key: string]: string } = {};
        Array.from(node.children).forEach(child => {
          // Use the tag name as the key and text content as the value
          obj[child.tagName] = child.textContent || '';
        });
        return obj;
      };

      // Get all elements that have child nodes (potential records)
      const allNodes = Array.from(rootElement.getElementsByTagName('*'))
        .filter(node => node.children.length > 0);

      // If we have no nodes with children, treat the root element's direct children as one record
      if (allNodes.length === 0 && rootElement.children.length > 0) {
        const singleRecord = nodeToObject(rootElement);
        const fieldNames = Object.keys(singleRecord);

        // Create labels mapping
        const labels: {[key: string]: string} = { id: 'ID' };
        fieldNames.forEach((fieldName, index) => {
          labels[`feld${index + 1}`] = fieldName;
        });
        setFieldLabels(labels);

        // Create single product
        const product: any = { id: '1' };
        fieldNames.forEach((fieldName, index) => {
          product[`feld${index + 1}`] = singleRecord[fieldName] || '';
        });

        setSourceProducts([product as Product]);
        const extendedProducts = storageService.mergeWithSourceData([product as Product]);
        setProducts(extendedProducts);
      } else {
        // Find the most common node type (likely to be our record type)
        const nodeTypes = allNodes.map(node => node.tagName);
        const recordType = nodeTypes.reduce((a, b) =>
          nodeTypes.filter(v => v === a).length >= nodeTypes.filter(v => v === b).length ? a : b
        );

        // Get all records of the most common type
        const records = Array.from(xmlDoc.getElementsByTagName(recordType))
          .filter(node => node.children.length > 0)
          .map(nodeToObject);

        if (records.length === 0) {
          throw new Error('No valid records found in XML');
        }

        // Get all unique field names from all records
        const fieldNames = Array.from(new Set(
          records.flatMap(record => Object.keys(record))
        ));

        // Create labels mapping
        const labels: {[key: string]: string} = { id: 'ID' };
        fieldNames.forEach((fieldName, index) => {
          labels[`feld${index + 1}`] = fieldName;
        });
        setFieldLabels(labels);

        // Convert to our product format
        const productsData = records.map((record, index) => {
          const product: any = { id: String(index + 1) };
          fieldNames.forEach((fieldName, index) => {
            product[`feld${index + 1}`] = record[fieldName] || '';
          });
          return product as Product;
        });

        setSourceProducts(productsData);
        const extendedProducts = storageService.mergeWithSourceData(productsData);
        setProducts(extendedProducts);
      }

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
  }, [sourceProducts, storageService]);

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

      {/* Footer */}
      <Box 
        sx={{ 
          mt: 4, 
          pt: 2, 
          borderTop: '1px solid #d0d7de',
          textAlign: 'center',
          color: '#57606a'
        }}
      >
        <Typography variant="body2">
          © 2025{' '}
          <Link 
            href="https://www.red-elephant.se/" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              color: '#0969da',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Red Elephant
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
