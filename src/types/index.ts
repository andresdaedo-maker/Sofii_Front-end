export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  client_type: 'regular' | 'vip';
}

export interface Product {
  id: number;
  documentId?: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  categories?: Category[];
}

export interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id: number;
  documentId?: string;
  order_number?: string;
  client_name?: string;
  due_date?: string;
  order_status: string;
  total: number;
  observaciones?: string;
  client?: Client;
  category?: Category;
  product_items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}