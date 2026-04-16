import { create } from 'zustand';
import { Invoice } from '../types';

interface InvoiceState {
  invoices: Invoice[];
  isScanning: boolean;
  addInvoice: (invoice: Invoice) => void;
  removeInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  setScanning: (scanning: boolean) => void;
  clearDelivered: () => void;
}

// Mock invoices for demo - Cleared for real testing
const MOCK_INVOICES: Invoice[] = [];

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  isScanning: false,

  addInvoice: (invoice: Invoice) =>
    set((state) => ({ invoices: [invoice, ...state.invoices] })),

  removeInvoice: (id: string) =>
    set((state) => ({ invoices: state.invoices.filter((inv) => inv.id !== id) })),

  updateInvoiceStatus: (id: string, status: Invoice['status']) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, status, ...(status === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}) } : inv
      ),
    })),

  setScanning: (scanning: boolean) => set({ isScanning: scanning }),

  clearDelivered: () =>
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.status !== 'delivered'),
    })),
}));
