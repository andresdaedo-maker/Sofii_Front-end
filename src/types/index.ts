export interface Category {
  id: number;
  name: string;
  type: 'ingreso' | 'egreso';
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
  category?: Category | null;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: Product;
}

export interface Order {
  id: number;
  client_name: string;
  order_number: string;
  due_date: string;
  order_status: 'pendiente' | 'pagado' | 'vencido' | 'cancelado';
  total: number;
  client: Client;
  order_items: OrderItem[];
}