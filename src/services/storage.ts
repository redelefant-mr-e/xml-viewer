import { Product, CustomField, LocalStorage, ExtendedProduct } from '../types/Product';

const STORAGE_KEY = 'animal_catalog_data';
const CURRENT_VERSION = '1.0.0';

export class StorageService {
    private static instance: StorageService;
    private storage: LocalStorage;

    private constructor() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            this.storage = JSON.parse(savedData);
        } else {
            this.storage = {
                version: CURRENT_VERSION,
                lastSync: new Date().toISOString(),
                customFields: {}
            };
            this.saveToLocalStorage();
        }
    }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    private saveToLocalStorage(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storage));
    }

    public addCustomField(animalId: string, field: CustomField): void {
        if (!this.storage.customFields[animalId]) {
            this.storage.customFields[animalId] = [];
        }
        
        // Find existing field with the same name
        const existingIndex = this.storage.customFields[animalId]
            .findIndex(f => f.name === field.name);
        
        if (existingIndex !== -1) {
            // Replace existing field
            this.storage.customFields[animalId][existingIndex] = field;
        } else {
            // Add new field
            this.storage.customFields[animalId].push(field);
        }
        
        this.saveToLocalStorage();
    }

    public removeCustomField(animalId: string, fieldName: string): void {
        if (this.storage.customFields[animalId]) {
            this.storage.customFields[animalId] = this.storage.customFields[animalId]
                .filter(field => field.name !== fieldName);
            this.saveToLocalStorage();
        }
    }

    public getCustomFields(animalId: string): CustomField[] {
        return this.storage.customFields[animalId] || [];
    }

    public mergeWithSourceData(products: Product[]): ExtendedProduct[] {
        return products.map(product => {
            const customFields = this.getCustomFields(product.id);
            const extendedProduct = { ...product } as ExtendedProduct;
            
            // Apply custom field values to standard fields if they exist
            customFields.forEach(field => {
                if (field.name.match(/^feld\d+$/)) {
                    (extendedProduct as any)[field.name] = field.value;
                }
            });
            
            // Add custom fields
            extendedProduct.customFields = customFields.filter(field => !field.name.match(/^feld\d+$/));
            
            return extendedProduct;
        });
    }

    public updateLastSync(): void {
        this.storage.lastSync = new Date().toISOString();
        this.saveToLocalStorage();
    }

    public getLastSync(): string {
        return this.storage.lastSync;
    }

    public clearAllData(): void {
        this.storage = {
            version: CURRENT_VERSION,
            lastSync: new Date().toISOString(),
            customFields: {}
        };
        this.saveToLocalStorage();
    }
} 