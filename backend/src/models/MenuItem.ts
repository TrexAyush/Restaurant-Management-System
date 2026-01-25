export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngredientUsage {
  inventoryItemId: string;
  quantity: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  ingredients: IngredientUsage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  ingredients?: IngredientUsage[];
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isAvailable?: boolean;
  ingredients?: IngredientUsage[];
}

export interface CreateMenuCategoryRequest {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateMenuCategoryRequest {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Validation functions
export const validateMenuItem = {
  name: (name: string): boolean => {
    return typeof name === 'string' && 
           name.length >= 1 && 
           name.length <= 200 &&
           name.trim().length > 0;
  },

  description: (description?: string): boolean => {
    return description === undefined || 
           (typeof description === 'string' && description.length <= 1000);
  },

  price: (price: number): boolean => {
    return typeof price === 'number' && 
           price >= 0 && 
           price <= 999999.99 &&
           Number.isFinite(price);
  },

  categoryId: (categoryId: string): boolean => {
    return typeof categoryId === 'string' && 
           categoryId.length > 0;
  },

  ingredients: (ingredients?: IngredientUsage[]): boolean => {
    if (!ingredients) return true;
    
    return Array.isArray(ingredients) && 
           ingredients.every(ingredient => 
             typeof ingredient.inventoryItemId === 'string' &&
             ingredient.inventoryItemId.length > 0 &&
             typeof ingredient.quantity === 'number' &&
             ingredient.quantity > 0 &&
             typeof ingredient.unit === 'string' &&
             ingredient.unit.length > 0
           );
  }
};

export const validateMenuCategory = {
  name: (name: string): boolean => {
    return typeof name === 'string' && 
           name.length >= 1 && 
           name.length <= 100 &&
           name.trim().length > 0;
  },

  description: (description?: string): boolean => {
    return description === undefined || 
           (typeof description === 'string' && description.length <= 500);
  },

  sortOrder: (sortOrder?: number): boolean => {
    return sortOrder === undefined || 
           (typeof sortOrder === 'number' && 
            Number.isInteger(sortOrder) && 
            sortOrder >= 0);
  }
};

export const validateCreateMenuItemRequest = (request: CreateMenuItemRequest): string[] => {
  const errors: string[] = [];

  if (!request.name || !validateMenuItem.name(request.name)) {
    errors.push('Name must be 1-200 characters and not empty');
  }

  if (request.description !== undefined && !validateMenuItem.description(request.description)) {
    errors.push('Description must be less than 1000 characters');
  }

  if (request.price === undefined || request.price === null || !validateMenuItem.price(request.price)) {
    errors.push('Price must be a valid number between 0 and 999999.99');
  }

  if (!request.categoryId || !validateMenuItem.categoryId(request.categoryId)) {
    errors.push('Category ID is required');
  }

  if (request.ingredients !== undefined && !validateMenuItem.ingredients(request.ingredients)) {
    errors.push('Ingredients must be valid with positive quantities');
  }

  return errors;
};

export const validateCreateMenuCategoryRequest = (request: CreateMenuCategoryRequest): string[] => {
  const errors: string[] = [];

  if (!request.name || !validateMenuCategory.name(request.name)) {
    errors.push('Name must be 1-100 characters and not empty');
  }

  if (request.description !== undefined && !validateMenuCategory.description(request.description)) {
    errors.push('Description must be less than 500 characters');
  }

  if (request.sortOrder !== undefined && !validateMenuCategory.sortOrder(request.sortOrder)) {
    errors.push('Sort order must be a non-negative integer');
  }

  return errors;
};

export const validateUpdateMenuItemRequest = (request: UpdateMenuItemRequest): string[] => {
  const errors: string[] = [];

  if (request.name !== undefined && !validateMenuItem.name(request.name)) {
    errors.push('Name must be 1-200 characters and not empty');
  }

  if (request.description !== undefined && !validateMenuItem.description(request.description)) {
    errors.push('Description must be less than 1000 characters');
  }

  if (request.price !== undefined && !validateMenuItem.price(request.price)) {
    errors.push('Price must be a valid number between 0 and 999999.99');
  }

  if (request.categoryId !== undefined && !validateMenuItem.categoryId(request.categoryId)) {
    errors.push('Category ID must be valid');
  }

  if (request.isAvailable !== undefined && typeof request.isAvailable !== 'boolean') {
    errors.push('isAvailable must be a boolean value');
  }

  if (request.ingredients !== undefined && !validateMenuItem.ingredients(request.ingredients)) {
    errors.push('Ingredients must be valid with positive quantities');
  }

  return errors;
};

export const validateUpdateMenuCategoryRequest = (request: UpdateMenuCategoryRequest): string[] => {
  const errors: string[] = [];

  if (request.name !== undefined && !validateMenuCategory.name(request.name)) {
    errors.push('Name must be 1-100 characters and not empty');
  }

  if (request.description !== undefined && !validateMenuCategory.description(request.description)) {
    errors.push('Description must be less than 500 characters');
  }

  if (request.sortOrder !== undefined && !validateMenuCategory.sortOrder(request.sortOrder)) {
    errors.push('Sort order must be a non-negative integer');
  }

  if (request.isActive !== undefined && typeof request.isActive !== 'boolean') {
    errors.push('isActive must be a boolean value');
  }

  return errors;
};