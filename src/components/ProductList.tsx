import React, { useState, useEffect } from 'react';
import { ExtendedProduct } from '../types/Product';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Typography,
    Box,
    TableSortLabel,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tooltip,
    Menu,
    MenuItem,
    Checkbox,
    ListItemText,
    Divider,
    InputAdornment,
    Badge,
    Card,
    CardContent,
    Drawer
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface ProductListProps {
    products: ExtendedProduct[];
    onAddCustomField: (animalId: string, fieldName: string, fieldLabel: string, value: string) => void;
    onRemoveCustomField: (animalId: string, fieldName: string) => void;
    fieldLabels: {[key: string]: string};
}

type SortDirection = 'asc' | 'desc';

type SortableField = keyof Omit<ExtendedProduct, 'customFields'>;

const isValidField = (field: string): field is SortableField => {
    return field === 'id' || /^feld([1-9]|1\d|20)$/.test(field);
};

interface SortConfig {
    field: SortableField;
    direction: SortDirection;
}

interface ColumnFilter {
    [key: string]: Set<string>;
}

interface FilterMenuProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    values: string[];
    selectedValues: Set<string>;
    onValuesChange: (values: Set<string>) => void;
    fieldName: string;
}

interface GroupSortConfig {
    enabled: boolean;
    direction: SortDirection;
}

const StyledTable = styled(Table)(({ theme }) => ({
    minWidth: 650,
    '& .MuiTableCell-root': {
        whiteSpace: 'nowrap',
        padding: theme.spacing(1.5),
        fontSize: '14px',
        borderBottom: '1px solid #d0d7de',
    },
}));

const HeaderCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: '#f6f8fa',
    color: '#24292f',
    fontWeight: 600,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    cursor: 'pointer',
    borderBottom: '1px solid #d0d7de',
    '&:hover': {
        backgroundColor: '#f3f4f6',
    },
    '& .MuiTableSortLabel-root': {
        color: '#24292f',
    },
    '& .MuiTableSortLabel-root.Mui-active': {
        color: '#24292f',
        fontWeight: 600,
    },
    '& .MuiTableSortLabel-icon': {
        color: '#57606a !important',
        opacity: 0.5,
    },
}));

const DataCell = styled(TableCell)(({ theme }) => ({
    color: '#24292f',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '14px',
    '&:hover': {
        overflow: 'visible',
        whiteSpace: 'normal',
        minWidth: '200px',
        backgroundColor: '#f6f8fa',
    },
    '& .group-tag': {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        backgroundColor: '#ddf4ff',
        color: '#0969da',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
    }
}));

const StyledTableRow = styled(TableRow)({
    '&:nth-of-type(even)': {
        backgroundColor: '#ffffff',
    },
    '&:nth-of-type(odd)': {
        backgroundColor: '#f6f8fa',
    },
    '&:hover': {
        backgroundColor: '#f3f4f6',
    },
});

const StyledTableContainer = styled(TableContainer)({
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    boxShadow: 'none',
    '&::-webkit-scrollbar': {
        height: '8px',
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: '#f6f8fa',
        borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#d0d7de',
        borderRadius: '4px',
        border: '2px solid #f6f8fa',
        '&:hover': {
            backgroundColor: '#afb8c1',
        },
    },
});

const TagCloud = styled(Box)({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
});

const FieldTag = styled(Chip)(({ theme, selected }: { theme?: any, selected: boolean }) => ({
    backgroundColor: selected ? '#ddf4ff' : '#f6f8fa',
    color: selected ? '#0969da' : '#57606a',
    border: `1px solid ${selected ? '#54aeff66' : '#d0d7de'}`,
    fontWeight: selected ? 600 : 400,
    '&:hover': {
        backgroundColor: selected ? '#b6e3ff' : '#f3f4f6',
    },
    '& .MuiChip-deleteIcon': {
        color: selected ? '#0969da' : '#57606a',
        '&:hover': {
            color: selected ? '#0969da' : '#24292f',
        },
    },
}));

interface AddColumnDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (columnName: string, columnLabel: string) => void;
}

const AddColumnDialog: React.FC<AddColumnDialogProps> = ({ open, onClose, onAdd }) => {
    const [columnName, setColumnName] = useState('');
    const [columnLabel, setColumnLabel] = useState('');

    const handleAdd = () => {
        if (columnName && columnLabel) {
            onAdd(columnName, columnLabel);
            setColumnName('');
            setColumnLabel('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add Custom Column</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        label="Column Name"
                        value={columnName}
                        onChange={(e) => setColumnName(e.target.value)}
                        placeholder="e.g., habitat_notes"
                        helperText="Internal name, use lowercase and underscores"
                    />
                    <TextField
                        label="Column Label"
                        value={columnLabel}
                        onChange={(e) => setColumnLabel(e.target.value)}
                        placeholder="e.g., Habitat Notes"
                        helperText="Display name shown in the table header"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleAdd} variant="contained" disabled={!columnName || !columnLabel}>
                    Add Column
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface EditCellDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (value: string) => void;
    currentValue?: string;
    fieldLabel: string;
}

const EditCellDialog: React.FC<EditCellDialogProps> = ({ open, onClose, onSave, currentValue = '', fieldLabel }) => {
    const [value, setValue] = useState('');

    React.useEffect(() => {
        // Reset value when dialog opens/closes
        setValue(currentValue || '');
    }, [open, currentValue]);

    const handleClose = () => {
        setValue('');
        onClose();
    };

    const handleSave = () => {
        onSave(value);
        setValue('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Edit {fieldLabel}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        label="Value"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                        multiline
                        rows={3}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const DownloadButton = styled(Button)(({ theme }) => ({
    borderColor: '#d0d7de',
    color: '#24292f',
    backgroundColor: '#f6f8fa',
    '&:hover': {
        borderColor: '#57606a',
        backgroundColor: '#f3f4f6',
    }
}));

const FilterMenu: React.FC<FilterMenuProps> = ({
    anchorEl,
    onClose,
    values,
    selectedValues,
    onValuesChange,
    fieldName,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredValues = values.filter(value => 
        value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = (value: string) => {
        const newSelected = new Set(selectedValues);
        if (newSelected.has(value)) {
            newSelected.delete(value);
        } else {
            newSelected.add(value);
        }
        onValuesChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedValues.size === values.length) {
            onValuesChange(new Set());
        } else {
            onValuesChange(new Set(values));
        }
    };

    const handleClear = () => {
        setSearchTerm('');
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            PaperProps={{
                sx: {
                    maxHeight: 300,
                    width: 250,
                }
            }}
        >
            <Box sx={{ p: 1 }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search values..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={handleClear}
                                >
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            </Box>
            <Divider />
            <MenuItem onClick={handleSelectAll}>
                <Checkbox
                    checked={selectedValues.size === values.length}
                    indeterminate={selectedValues.size > 0 && selectedValues.size < values.length}
                />
                <ListItemText primary="Select All" />
            </MenuItem>
            <Divider />
            {filteredValues.map((value) => (
                <MenuItem key={value} onClick={() => handleToggle(value)}>
                    <Checkbox checked={selectedValues.has(value)} />
                    <ListItemText primary={value || '(Empty)'} />
                </MenuItem>
            ))}
        </Menu>
    );
};

const ControlPanel = styled(Card)(({ theme }) => ({
    position: 'sticky',
    top: theme.spacing(2),
    zIndex: 2,
    marginBottom: theme.spacing(2),
    border: '1px solid #d0d7de',
    boxShadow: 'none',
    backgroundColor: '#ffffff',
    '&:hover': {
        boxShadow: '0 1px 3px rgba(27,31,36,0.1)',
    },
}));

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onCreateGroup: (groupName: string, groupLabel: string) => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ open, onClose, onCreateGroup }) => {
    const [groupName, setGroupName] = useState('');
    const [groupLabel, setGroupLabel] = useState('');

    const handleCreate = () => {
        if (groupName && groupLabel) {
            onCreateGroup(groupName.toLowerCase().replace(/\s+/g, '_'), groupLabel);
            setGroupName('');
            setGroupLabel('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create Group from Selection</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        label="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g., nocturnal_animals"
                        helperText="Internal name, use lowercase and underscores"
                    />
                    <TextField
                        label="Group Label"
                        value={groupLabel}
                        onChange={(e) => setGroupLabel(e.target.value)}
                        placeholder="e.g., Nocturnal Animals"
                        helperText="Display name shown in the table header"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleCreate} 
                    variant="contained" 
                    disabled={!groupName || !groupLabel}
                    startIcon={<LocalOfferIcon />}
                >
                    Create Group
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface DetailPanelProps {
    open: boolean;
    onClose: () => void;
    product: ExtendedProduct | null;
    onSave: (product: ExtendedProduct) => void;
    customColumns: Array<{name: string, label: string}>;
    fieldLabels: {[key: string]: string};
}

const DetailPanel: React.FC<DetailPanelProps> = ({
    open,
    onClose,
    product,
    onSave,
    customColumns,
    fieldLabels
}) => {
    const [editedProduct, setEditedProduct] = useState<ExtendedProduct | null>(null);

    useEffect(() => {
        setEditedProduct(product);
    }, [product]);

    if (!editedProduct) return null;

    const handleFieldChange = (field: string, value: string) => {
        setEditedProduct(prev => {
            if (!prev) return prev;
            if (field === 'id' || isValidField(field)) {
                return { ...prev, [field]: value };
            } else {
                const customFields = [...prev.customFields];
                const existingField = customFields.find(f => f.name === field);
                if (existingField) {
                    existingField.value = value;
                } else {
                    const column = customColumns.find(c => c.name === field);
                    if (column) {
                        customFields.push({
                            name: field,
                            label: column.label,
                            value: value
                        });
                    }
                }
                return { ...prev, customFields };
            }
        });
    };

    const handleSave = () => {
        if (editedProduct) {
            onSave(editedProduct);
            onClose();
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const allFields = [
        ...Object.entries(fieldLabels).map(([fieldName, label]) => ({
            name: fieldName,
            label: label,
            value: fieldName === 'id' || /^feld\d+$/.test(fieldName) 
                ? (editedProduct?.[fieldName as keyof ExtendedProduct] as string) || ''
                : ''
        })),
        ...customColumns.map(column => ({
            name: column.name,
            label: column.label,
            value: editedProduct?.customFields.find(f => f.name === column.name)?.value || ''
        }))
    ];

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '400px',
                    p: 3,
                    bgcolor: '#f6f8fa',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f6f8fa',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#d0d7de',
                        borderRadius: '4px',
                        border: '2px solid #f6f8fa',
                        '&:hover': {
                            backgroundColor: '#afb8c1',
                        },
                    },
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {(editedProduct?.[Object.keys(fieldLabels)[1] as keyof ExtendedProduct] as string) || 'Details'} 
                </Typography>
                <Box>
                    <IconButton size="small" onClick={handleSave} sx={{ mr: 1 }}>
                        <SaveIcon />
                    </IconButton>
                    <IconButton size="small" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allFields.map(({ name, label, value }) => (
                    <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label={label}
                            value={value}
                            onChange={(e) => handleFieldChange(name, e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => copyToClipboard(value)}
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>
                ))}
                <Box sx={{ height: '24px' }} />
            </Box>
        </Drawer>
    );
};

interface EditColumnDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (newLabel: string) => void;
    currentLabel: string;
}

const EditColumnDialog: React.FC<EditColumnDialogProps> = ({ open, onClose, onSave, currentLabel }) => {
    const [label, setLabel] = useState(currentLabel);

    useEffect(() => {
        setLabel(currentLabel);
    }, [currentLabel]);

    const handleSave = () => {
        if (label.trim()) {
            onSave(label.trim());
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Column Label</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        label="Column Label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g., Habitat Notes"
                        helperText="Display name shown in the table header"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={!label.trim()}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const ProductList: React.FC<ProductListProps> = ({ products, onAddCustomField, onRemoveCustomField, fieldLabels }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'id', direction: 'asc' });
    const [groupSortConfig, setGroupSortConfig] = useState<GroupSortConfig>({
        enabled: false,
        direction: 'asc'
    });
    const [visibleFields, setVisibleFields] = useState<Set<string>>(
        new Set(['id', ...Array.from({ length: 20 }, (_, i) => `feld${i + 1}`)])
    );
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [customColumns, setCustomColumns] = useState<Array<{name: string, label: string}>>([]);
    const [editingCell, setEditingCell] = useState<{
        animalId: string,
        columnName: string,
        columnLabel: string,
        currentValue?: string
    } | null>(null);
    const [deleteColumnName, setDeleteColumnName] = useState<string | null>(null);
    const [columnFilters, setColumnFilters] = useState<ColumnFilter>({});
    const [filterAnchorEl, setFilterAnchorEl] = useState<{
        element: HTMLElement | null;
        fieldName: string;
        fieldLabel: string;
    }>({ element: null, fieldName: '', fieldLabel: '' });
    const [deactivatedRows, setDeactivatedRows] = useState<Set<string>>(new Set());
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);
    const [editColumnInfo, setEditColumnInfo] = useState<{name: string, currentLabel: string} | null>(null);
    const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

    const handleSort = (field: string) => {
        if (isValidField(field)) {
            setSortConfig(prevConfig => ({
                field,
                direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
            }));
            setGroupSortConfig({ enabled: false, direction: 'asc' });
        }
    };

    const toggleField = (field: string) => {
        setVisibleFields(prev => {
            const newSet = new Set(prev);
            if (newSet.has(field)) {
                newSet.delete(field);
            } else {
                newSet.add(field);
            }
            return newSet;
        });
    };

    const handleDeleteColumn = (columnName: string) => {
        setCustomColumns(prev => prev.filter(col => col.name !== columnName));
        setVisibleFields(prev => {
            const newSet = new Set(prev);
            newSet.delete(columnName);
            return newSet;
        });
        // Remove all custom fields for this column
        products.forEach(product => {
            onRemoveCustomField(product.id, columnName);
        });
    };

    const handleAddColumn = (columnName: string, columnLabel: string) => {
        setCustomColumns(prev => [...prev, { name: columnName, label: columnLabel }]);
        setVisibleFields(prev => {
            const newSet = new Set(prev);
            newSet.add(columnName);
            return newSet;
        });
    };

    const handleCellEdit = (animalId: string, columnName: string, columnLabel: string, currentValue?: string) => {
        setEditingCell({ animalId, columnName, columnLabel, currentValue });
    };

    const handleCellSave = (value: string) => {
        if (editingCell) {
            onAddCustomField(
                editingCell.animalId,
                editingCell.columnName,
                editingCell.columnLabel,
                value
            );
            // Force refresh of the current row by triggering the callback again
            const updatedProduct = products.find(p => p.id === editingCell.animalId);
            if (updatedProduct && editingCell.columnName.match(/^feld\d+$/)) {
                onAddCustomField(
                    editingCell.animalId,
                    editingCell.columnName,
                    editingCell.columnLabel,
                    value
                );
            }
        }
        setEditingCell(null);
    };

    const handleFilterClick = (event: React.MouseEvent<HTMLElement>, fieldName: string, fieldLabel: string) => {
        event.stopPropagation();
        setFilterAnchorEl({ element: event.currentTarget, fieldName, fieldLabel });
    };

    const handleFilterClose = () => {
        setFilterAnchorEl({ element: null, fieldName: '', fieldLabel: '' });
    };

    const handleFilterChange = (fieldName: string, values: Set<string>) => {
        setColumnFilters(prev => ({
            ...prev,
            [fieldName]: values
        }));
    };

    const getUniqueValues = (fieldName: string): string[] => {
        const values = new Set<string>();
        products.forEach(product => {
            if (fieldName === 'id' || isValidField(fieldName)) {
                values.add(String(product[fieldName]));
            } else {
                const customField = product.customFields.find(f => f.name === fieldName);
                if (customField) {
                    values.add(customField.value);
                }
            }
        });
        return Array.from(values).sort();
    };

    const isGroupColumn = (columnName: string): boolean => {
        return customColumns.some(col => col.name === columnName);
    };

    const getProductGroupValues = (product: ExtendedProduct): string[] => {
        return product.customFields
            .filter(field => isGroupColumn(field.name))
            .map(field => field.value)
            .sort();
    };

    const sortedProducts = [...products].sort((a, b) => {
        if (groupSortConfig.enabled) {
            const aGroups = getProductGroupValues(a);
            const bGroups = getProductGroupValues(b);
            
            for (let i = 0; i < Math.max(aGroups.length, bGroups.length); i++) {
                const aGroup = aGroups[i] || '';
                const bGroup = bGroups[i] || '';
                
                if (aGroup !== bGroup) {
                    return groupSortConfig.direction === 'asc'
                        ? bGroup.localeCompare(aGroup)
                        : aGroup.localeCompare(bGroup);
                }
            }
            
            return 0;
        }

        if (!isValidField(sortConfig.field)) return 0;
        
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];

        if (aValue === bValue) return 0;

        if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
            return sortConfig.direction === 'asc' 
                ? Number(aValue) - Number(bValue)
                : Number(bValue) - Number(aValue);
        }

        return sortConfig.direction === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    const filteredProducts = sortedProducts.filter(product => {
        return Object.entries(columnFilters).every(([fieldName, selectedValues]) => {
            if (selectedValues.size === 0) return true;
            
            if (fieldName === 'id' || isValidField(fieldName)) {
                return selectedValues.has(String(product[fieldName]));
            } else {
                const customField = product.customFields.find(f => f.name === fieldName);
                return customField && selectedValues.has(customField.value);
            }
        });
    });

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allIds = filteredProducts.map(product => product.id);
            setSelectedRows(new Set(allIds));
            setSelectAll(true);
        } else {
            setSelectedRows(new Set());
            setSelectAll(false);
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeactivateSelected = () => {
        setDeactivatedRows(prev => {
            const newSet = new Set(prev);
            selectedRows.forEach(id => newSet.add(id));
            return newSet;
        });
        setSelectedRows(new Set());
        setSelectAll(false);
    };

    const handleActivateSelected = () => {
        setDeactivatedRows(prev => {
            const newSet = new Set(prev);
            selectedRows.forEach(id => newSet.delete(id));
            return newSet;
        });
        setSelectedRows(new Set());
        setSelectAll(false);
    };

    const handleCreateGroup = (groupName: string, groupLabel: string) => {
        // First add the new column
        handleAddColumn(groupName, groupLabel);
        
        // Then add the group tag to all selected items
        selectedRows.forEach(id => {
            onAddCustomField(
                id,
                groupName,
                groupLabel,
                groupLabel // Use the label as the tag value
            );
        });

        // Clear selection after group creation
        setSelectedRows(new Set());
        setSelectAll(false);
    };

    const generateXML = () => {
        // Only export currently visible/filtered products
        const xmlDoc = document.implementation.createDocument(null, 'CATALOG', null);
        const root = xmlDoc.documentElement;

        filteredProducts.forEach(product => {
            // Use the actual record tag name from fieldLabels (e.g., 'PLANT' for plant catalog)
            const recordTagName = Object.values(fieldLabels)[1] || 'record'; // Get first non-ID field name
            const recordElement = xmlDoc.createElement(recordTagName);
            
            // Add deactivated attribute if row is deactivated
            if (deactivatedRows.has(product.id)) {
                recordElement.setAttribute('deactivated', 'true');
            }

            // Only add fields that are currently visible
            Object.entries(fieldLabels).forEach(([fieldName, xmlTagName]) => {
                if (visibleFields.has(fieldName)) {
                    const fieldElement = xmlDoc.createElement(xmlTagName);
                    // Check if the field is a valid key of ExtendedProduct
                    if (fieldName === 'id' || /^feld\d+$/.test(fieldName)) {
                        fieldElement.textContent = (product[fieldName as keyof ExtendedProduct] as string) || '';
                    }
                    recordElement.appendChild(fieldElement);
                }
            });
            
            // Add visible custom fields
            product.customFields
                .filter(field => visibleFields.has(field.name))
                .forEach(field => {
                    const fieldElement = xmlDoc.createElement(field.name);
                    fieldElement.textContent = field.value;
                    // Add label as attribute for reference
                    fieldElement.setAttribute('label', field.label);
                    recordElement.appendChild(fieldElement);
                });
            
            root.appendChild(recordElement);
        });
        
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(xmlDoc);
        
        // Make the XML pretty with proper indentation
        const prettyXml = xmlString
            .replace(/></g, '>\n<') // Add newlines between tags
            .split('\n') // Split into lines
            .map(line => {
                // Count opening tags to determine indentation level
                const matches = line.match(/<[^/]/g);
                const indent = matches ? matches.length : 0;
                return '  '.repeat(indent) + line;
            })
            .join('\n');
        
        // Add XML declaration at the top
        const finalXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + prettyXml;
        
        const blob = new Blob([finalXml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data_export.xml';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const generateCSV = () => {
        // Get visible field names and labels
        const visibleFieldEntries = Object.entries(fieldLabels)
            .filter(([fieldName]) => visibleFields.has(fieldName));
        const visibleCustomColumns = customColumns
            .filter(col => visibleFields.has(col.name));
        
        // Create headers
        const headers = [
            ...visibleFieldEntries.map(([_, label]) => label),
            ...visibleCustomColumns.map(col => col.label)
        ];
        
        // Create CSV content
        const csvContent = [
            // Headers row
            headers.join(','),
            // Data rows
            ...filteredProducts.map(product => {
                const standardFields = visibleFieldEntries
                    .map(([fieldName]) => {
                        if (fieldName === 'id' || /^feld\d+$/.test(fieldName)) {
                            return `"${(product[fieldName as keyof ExtendedProduct] as string) || ''}"`;
                        }
                        return '""';
                    });
                
                const customFields = visibleCustomColumns
                    .map(col => {
                        const field = product.customFields.find(f => f.name === col.name);
                        return `"${field?.value || ''}"`;
                    });
                
                return [...standardFields, ...customFields].join(',');
            })
        ].join('\n');
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGroupSort = () => {
        setGroupSortConfig(prev => ({
            enabled: true,
            direction: prev.enabled ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc'
        }));
        // Disable regular column sorting when group sorting is enabled
        setSortConfig({ field: 'id', direction: 'asc' });
    };

    const handleProductSelect = (product: ExtendedProduct) => {
        setSelectedProduct(product);
    };

    const handleProductSave = (updatedProduct: ExtendedProduct) => {
        // Update standard fields
        const productIndex = products.findIndex(p => p.id === updatedProduct.id);
        if (productIndex === -1) return;

        // Update all standard fields
        for (let i = 1; i <= 20; i++) {
            const fieldName = `feld${i}` as keyof ExtendedProduct;
            const newValue = updatedProduct[fieldName] as string;
            const oldValue = products[productIndex][fieldName] as string;
            
            // Only update if the value has changed
            if (newValue !== oldValue) {
                onAddCustomField(
                    updatedProduct.id,
                    fieldName,
                    '', // Empty label for standard fields
                    newValue || '' // Ensure we send an empty string instead of undefined
                );
            }
        }

        // Update custom fields
        updatedProduct.customFields.forEach(field => {
            const oldField = products[productIndex].customFields.find(f => f.name === field.name);
            // Only update if the value has changed
            if (!oldField || oldField.value !== field.value) {
                onAddCustomField(
                    updatedProduct.id,
                    field.name,
                    field.label,
                    field.value
                );
            }
        });

        // Close the panel
        setSelectedProduct(null);
    };

    const getColumnLabel = (field: string): string => {
        if (fieldLabels[field]) {
            return fieldLabels[field];
        }
        return customColumns.find(col => col.name === field)?.label || field;
    };

    const renderHeaderCell = (fieldName: string, label: string, sortable = false) => (
        <HeaderCell 
            key={fieldName}
            onClick={sortable ? () => handleSort(fieldName) : undefined}
            sx={{ 
                display: visibleFields.has(fieldName) ? 'table-cell' : 'none',
                position: 'relative',
                cursor: sortable ? 'pointer' : 'default'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {sortable ? (
                    <TableSortLabel
                        active={sortConfig.field === fieldName}
                        direction={sortConfig.field === fieldName ? sortConfig.direction : 'asc'}
                    >
                        {label}
                    </TableSortLabel>
                ) : (
                    <Typography component="span">{label}</Typography>
                )}
                <Badge
                    badgeContent={columnFilters[fieldName]?.size || 0}
                    color="primary"
                    sx={{ 
                        '& .MuiBadge-badge': { 
                            backgroundColor: '#0969da',
                            fontSize: '10px'
                        }
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={(e) => handleFilterClick(e, fieldName, label)}
                        sx={{ 
                            padding: '2px',
                            '&:hover': { color: '#0969da' }
                        }}
                    >
                        <FilterListIcon fontSize="small" />
                    </IconButton>
                </Badge>
            </Box>
        </HeaderCell>
    );

    const handleEditColumnLabel = (columnName: string, newLabel: string) => {
        setCustomColumns(prev => prev.map(col => 
            col.name === columnName ? { ...col, label: newLabel } : col
        ));
        
        // Update the label in all existing custom fields
        products.forEach(product => {
            const customField = product.customFields.find(f => f.name === columnName);
            if (customField) {
                onAddCustomField(
                    product.id,
                    columnName,
                    newLabel,
                    customField.value
                );
            }
        });
    };

    return (
        <Box sx={{ width: '100%', color: '#24292f' }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 3,
                gap: 2
            }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setIsAddColumnDialogOpen(true)}
                        startIcon={<AddIcon />}
                        sx={{
                            borderColor: '#d0d7de',
                            color: '#24292f',
                            '&:hover': {
                                borderColor: '#57606a',
                                backgroundColor: '#f3f4f6',
                            }
                        }}
                    >
                        Add Column
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={`Download XML (${filteredProducts.filter(p => !deactivatedRows.has(p.id)).length} records)`}>
                            <DownloadButton
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={generateXML}
                            >
                                XML
                            </DownloadButton>
                        </Tooltip>
                        <Tooltip title={`Download CSV (${filteredProducts.filter(p => !deactivatedRows.has(p.id)).length} records)`}>
                            <DownloadButton
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={generateCSV}
                            >
                                CSV
                            </DownloadButton>
                        </Tooltip>
                    </Box>
                </Box>

                <ControlPanel>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Selection Controls
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleDeactivateSelected}
                                    disabled={selectedRows.size === 0}
                                    startIcon={<VisibilityOffIcon />}
                                    sx={{
                                        borderColor: '#d0d7de',
                                        color: '#24292f',
                                        '&:hover': {
                                            borderColor: '#57606a',
                                            backgroundColor: '#f3f4f6',
                                        }
                                    }}
                                >
                                    Deactivate Selected
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleActivateSelected}
                                    disabled={selectedRows.size === 0}
                                    startIcon={<VisibilityIcon />}
                                    sx={{
                                        borderColor: '#d0d7de',
                                        color: '#24292f',
                                        '&:hover': {
                                            borderColor: '#57606a',
                                            backgroundColor: '#f3f4f6',
                                        }
                                    }}
                                >
                                    Activate Selected
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setIsCreateGroupDialogOpen(true)}
                                    disabled={selectedRows.size === 0}
                                    startIcon={<GroupAddIcon />}
                                    sx={{
                                        borderColor: '#d0d7de',
                                        color: '#24292f',
                                        '&:hover': {
                                            borderColor: '#57606a',
                                            backgroundColor: '#f3f4f6',
                                        }
                                    }}
                                >
                                    Create Group from Selection
                                </Button>
                                {customColumns.length > 0 && (
                                    <Tooltip title={`Sort by groups ${groupSortConfig.direction === 'asc' ? '(A to Z)' : '(Z to A)'}`}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleGroupSort}
                                            startIcon={<SortByAlphaIcon />}
                                            sx={{
                                                borderColor: groupSortConfig.enabled ? '#0969da' : '#d0d7de',
                                                color: groupSortConfig.enabled ? '#0969da' : '#24292f',
                                                backgroundColor: groupSortConfig.enabled ? '#ddf4ff' : 'transparent',
                                                '&:hover': {
                                                    borderColor: '#57606a',
                                                    backgroundColor: groupSortConfig.enabled ? '#b6e3ff' : '#f3f4f6',
                                                }
                                            }}
                                        >
                                            Sort by Groups
                                        </Button>
                                    </Tooltip>
                                )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {selectedRows.size} items selected • {deactivatedRows.size} items deactivated
                                {groupSortConfig.enabled && ' • Sorted by groups'}
                            </Typography>
                        </Box>
                    </CardContent>
                </ControlPanel>
            </Box>

            <TagCloud>
                {Array.from({ length: 20 }, (_, i) => {
                    const fieldName = `feld${i + 1}`;
                    if (fieldLabels[fieldName]) {
                        return (
                            <FieldTag
                                key={i}
                                label={fieldLabels[fieldName]}
                                selected={visibleFields.has(fieldName)}
                                onClick={() => toggleField(fieldName)}
                                onDelete={() => toggleField(fieldName)}
                            />
                        );
                    }
                    return null;
                }).filter(Boolean)}
                {customColumns.map((column) => (
                    <FieldTag
                        key={`custom-${column.name}`}
                        label={column.label}
                        selected={visibleFields.has(column.name)}
                        onClick={() => toggleField(column.name)}
                        onDelete={() => toggleField(column.name)}
                    />
                ))}
            </TagCloud>

            <StyledTableContainer>
                <StyledTable stickyHeader>
                    <TableHead>
                        <TableRow>
                            <HeaderCell sx={{ width: 50 }}>
                                <Checkbox
                                    checked={selectAll}
                                    indeterminate={selectedRows.size > 0 && selectedRows.size < filteredProducts.length}
                                    onChange={handleSelectAll}
                                    size="small"
                                />
                            </HeaderCell>
                            <HeaderCell sx={{ width: 50 }}></HeaderCell>
                            {Object.entries(fieldLabels).map(([fieldName, label]) => (
                                visibleFields.has(fieldName) && 
                                renderHeaderCell(fieldName, label, true)
                            ))}
                            {customColumns.map((column) => (
                                <HeaderCell 
                                    key={column.name}
                                    sx={{ 
                                        display: visibleFields.has(column.name) ? 'table-cell' : 'none',
                                        position: 'relative' 
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography component="span">{column.label}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Badge
                                                badgeContent={columnFilters[column.name]?.size || 0}
                                                color="primary"
                                                sx={{ 
                                                    '& .MuiBadge-badge': { 
                                                        backgroundColor: '#0969da',
                                                        fontSize: '10px'
                                                    }
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleFilterClick(e, column.name, column.label)}
                                                    sx={{ 
                                                        padding: '2px',
                                                        '&:hover': { color: '#0969da' }
                                                    }}
                                                >
                                                    <FilterListIcon fontSize="small" />
                                                </IconButton>
                                            </Badge>
                                            <Tooltip title="Edit column label">
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => setEditColumnInfo({ name: column.name, currentLabel: column.label })}
                                                    sx={{ 
                                                        padding: '2px',
                                                        '&:hover': {
                                                            color: '#0969da',
                                                        }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete column">
                                                <IconButton 
                                                    size="small"
                                                    onClick={() => setDeleteColumnName(column.name)}
                                                    sx={{ 
                                                        padding: '2px',
                                                        '&:hover': {
                                                            color: '#cf222e',
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </HeaderCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <StyledTableRow 
                                key={product.id}
                                sx={{
                                    opacity: deactivatedRows.has(product.id) ? 0.5 : 1,
                                    backgroundColor: selectedRows.has(product.id) ? '#f6f8fa !important' : undefined,
                                }}
                            >
                                <DataCell sx={{ width: 50 }}>
                                    <Checkbox
                                        checked={selectedRows.has(product.id)}
                                        onChange={() => handleSelectRow(product.id)}
                                        size="small"
                                    />
                                </DataCell>
                                <DataCell sx={{ width: 50 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleProductSelect(product)}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: '#ddf4ff',
                                                color: '#0969da'
                                            }
                                        }}
                                    >
                                        <ChevronRightIcon />
                                    </IconButton>
                                </DataCell>
                                {Object.entries(fieldLabels).map(([fieldName, label]) => (
                                    visibleFields.has(fieldName) && (
                                        <DataCell 
                                            key={fieldName}
                                            onClick={() => handleCellEdit(
                                                product.id,
                                                fieldName,
                                                label,
                                                isValidField(fieldName) ? product[fieldName] as string : ''
                                            )}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            {isValidField(fieldName) ? product[fieldName] : ''}
                                        </DataCell>
                                    )
                                ))}
                                {customColumns.map((column) => {
                                    const customField = product.customFields.find(
                                        field => field.name === column.name
                                    );
                                    return visibleFields.has(column.name) ? (
                                        <DataCell 
                                            key={column.name}
                                            onClick={() => handleCellEdit(
                                                product.id,
                                                column.name,
                                                column.label,
                                                customField?.value || ''
                                            )}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            {customField?.value ? (
                                                <span className="group-tag">
                                                    {customField.value}
                                                </span>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Click to add
                                                </Typography>
                                            )}
                                        </DataCell>
                                    ) : null;
                                })}
                            </StyledTableRow>
                        ))}
                    </TableBody>
                </StyledTable>
            </StyledTableContainer>

            <AddColumnDialog
                open={isAddColumnDialogOpen}
                onClose={() => setIsAddColumnDialogOpen(false)}
                onAdd={handleAddColumn}
            />

            <EditCellDialog
                open={!!editingCell}
                onClose={() => setEditingCell(null)}
                onSave={handleCellSave}
                currentValue={editingCell?.currentValue}
                fieldLabel={editingCell?.columnLabel || ''}
            />

            <Dialog
                open={!!deleteColumnName}
                onClose={() => setDeleteColumnName(null)}
            >
                <DialogTitle>Delete Column</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this column? This will remove all data stored in this column for all animals.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteColumnName(null)}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            if (deleteColumnName) {
                                handleDeleteColumn(deleteColumnName);
                            }
                            setDeleteColumnName(null);
                        }}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <FilterMenu
                anchorEl={filterAnchorEl.element}
                onClose={handleFilterClose}
                values={getUniqueValues(filterAnchorEl.fieldName)}
                selectedValues={columnFilters[filterAnchorEl.fieldName] || new Set()}
                onValuesChange={(values) => handleFilterChange(filterAnchorEl.fieldName, values)}
                fieldName={filterAnchorEl.fieldLabel}
            />

            <CreateGroupDialog
                open={isCreateGroupDialogOpen}
                onClose={() => setIsCreateGroupDialogOpen(false)}
                onCreateGroup={handleCreateGroup}
            />

            <DetailPanel
                open={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onSave={handleProductSave}
                customColumns={customColumns}
                fieldLabels={fieldLabels}
            />

            <EditColumnDialog
                open={!!editColumnInfo}
                onClose={() => setEditColumnInfo(null)}
                onSave={(newLabel) => {
                    if (editColumnInfo) {
                        handleEditColumnLabel(editColumnInfo.name, newLabel);
                    }
                    setEditColumnInfo(null);
                }}
                currentLabel={editColumnInfo?.currentLabel || ''}
            />
        </Box>
    );
};

export default ProductList; 