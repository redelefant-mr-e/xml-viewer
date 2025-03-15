export interface Product {
    id: string;
    feld1: string;
    feld2: string;
    feld3: string;
    feld4: string;
    feld5: string;
    feld6: string;
    feld7: string;
    feld8: string;
    feld9: string;
    feld10: string;
    feld11: string;
    feld12: string;
    feld13: string;
    feld14: string;
    feld15: string;
    feld16: string;
    feld17: string;
    feld18: string;
    feld19: string;
    feld20: string;
}

export interface CustomField {
    name: string;
    label: string;
    value: string;
}

export interface ExtendedProduct extends Product {
    customFields: CustomField[];
}

export interface LocalStorage {
    version: string;
    lastSync: string;
    customFields: {
        [animalId: string]: CustomField[];
    };
}

export interface ProductCatalog {
    produktKatalog: {
        produkt: Product[];
    };
} 