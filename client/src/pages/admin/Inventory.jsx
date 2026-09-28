import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, ArrowLeftRight, History, FileText, AlertTriangle } from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';
import formatCurrency from '../../utils/formatCurrency';
import printPDF from '../../utils/printPDF';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const Inventory = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // Filter & search states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Engine',
    brand: '',
    unitPrice: 0,
    costPrice: 0,
    quantity: 0,
    minStockLevel: 5,
    location: '',
    supplierName: '',
    supplierMobile: '',
    supplierEmail: ''
  });

  const [adjustData, setAdjustData] = useState({
    adjustmentQty: 1,
    reason: 'Restock supply replenishment'
  });

  // Categories list
  const categories = ['Engine', 'Brakes', 'Electrical', 'Filters', 'Suspension', 'Other'];

  // 1. Fetch Inventory List Query
  const { data: inventoryData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminInventory', search, category, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/inventory', {
        params: { page, limit: 10, search, category }
      });
      return data;
    }
  });

  // 2. Fetch Selected Item Logs Query
  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['adminInventoryLogs', selectedItemId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/inventory/${selectedItemId}/logs`);
      return data.data;
    },
    enabled: !!selectedItemId && isLogsOpen
  });

  // 3. Create / Edit Mutations
  const saveItemMutation = useMutation({
    mutationFn: async (payload) => {
      // Re-map supplier properties
      const mappedPayload = {
        name: payload.name,
        sku: payload.sku,
        category: payload.category,
        brand: payload.brand,
        unitPrice: parseFloat(payload.unitPrice),
        costPrice: parseFloat(payload.costPrice),
        quantity: parseInt(payload.quantity),
        minStockLevel: parseInt(payload.minStockLevel),
        location: payload.location,
        supplier: {
          name: payload.supplierName,
          mobile: payload.supplierMobile,
          email: payload.supplierEmail
        }
      };

      if (editingItem) {
        return await api.put(`/api/v1/admin/inventory/${editingItem._id}`, mappedPayload);
      } else {
        return await api.post('/api/v1/admin/inventory', mappedPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
      addToast(editingItem ? 'Item updated successfully' : 'Inventory item created successfully', 'success');
      closeFormModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save item', 'error');
    }
  });

  // Manual Adjust Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, adjustmentQty, reason }) => {
      return await api.post(`/api/v1/admin/inventory/${id}/adjust`, { adjustmentQty, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
      addToast('Stock level adjusted successfully', 'success');
      closeAdjustModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to adjust stock', 'error');
    }
  });

  // Delete Mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/v1/admin/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
      addToast('Item deleted from warehouse database', 'success');
    }
  });

  const openFormModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        brand: item.brand || '',
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        quantity: item.quantity,
        minStockLevel: item.minStockLevel,
        location: item.location || '',
        supplierName: item.supplier?.name || '',
        supplierMobile: item.supplier?.mobile || '',
        supplierEmail: item.supplier?.email || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        sku: '',
        category: 'Engine',
        brand: '',
        unitPrice: 0,
        costPrice: 0,
        quantity: 0,
        minStockLevel: 5,
        location: '',
        supplierName: '',
        supplierMobile: '',
        supplierEmail: ''
      });
    }
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const openAdjustModal = (item) => {
    setSelectedItemId(item._id);
    setAdjustData({ adjustmentQty: 1, reason: 'Restock supply replenishment' });
    setIsAdjustOpen(true);
  };

  const closeAdjustModal = () => {
    setIsAdjustOpen(false);
    setSelectedItemId(null);
  };

  const openLogsModal = (item) => {
    setSelectedItemId(item._id);
    setIsLogsOpen(true);
  };

  const closeLogsModal = () => {
    setIsLogsOpen(false);
    setSelectedItemId(null);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdjustChange = (e) => {
    setAdjustData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveItemMutation.mutate(formData);
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    adjustStockMutation.mutate({
      id: selectedItemId,
      ...adjustData
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Spare Parts Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">Configure SKU stock quantities, locations, and vendors.</p>
        </div>
        <div className="flex gap-2">
          {/* Purchase Order PDF restock button */}
          <button
            onClick={() => printPDF('/api/v1/admin/inventory/po', 'purchase_order.pdf')}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Download Restock PO
          </button>
          
          <Button onClick={() => openFormModal()} icon={Plus}>
            New Spare Item
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-xs">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search part name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      {isListLoading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <TableContainer>
            <Thead>
              <Tr>
                <Th isSticky>Spare Name (SKU)</Th>
                <Th>Category</Th>
                <Th>Retail Price</Th>
                <Th>Cost Price</Th>
                <Th>Stock Qty</Th>
                <Th>Location</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inventoryData?.data?.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-400 py-10">No inventory items found</Td>
                </Tr>
              ) : (
                inventoryData.data.map((item) => {
                  const isLowStock = item.quantity <= item.minStockLevel;

                  return (
                    <Tr
                      key={item._id}
                      className={isLowStock ? 'bg-red-50/20 border-l-4 border-l-red-500/80' : ''}
                    >
                      <Td isSticky className="font-bold text-slate-800">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-bold uppercase mt-0.5">SKU: {item.sku}</span>
                      </Td>
                      <Td className="capitalize"><Badge variant="neutral">{item.category}</Badge></Td>
                      <Td className="font-bold text-slate-700">{formatCurrency(item.unitPrice)}</Td>
                      <Td className="text-slate-500 font-medium">{formatCurrency(item.costPrice)}</Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1 font-bold text-xs ${isLowStock ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md' : 'text-slate-700'}`}>
                          {item.quantity}
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                        </span>
                      </Td>
                      <Td className="font-semibold text-slate-500 text-xs">{item.location || 'N/A'}</Td>
                      <Td className="text-right flex items-center justify-end gap-1.5 py-3">
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-brand-600 cursor-pointer"
                          title="Adjust quantity"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openLogsModal(item)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                          title="View audit logs"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openFormModal(item)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this inventory item and all associated stock change logs?')) {
                              deleteItemMutation.mutate(item._id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </TableContainer>

          {/* Pagination controls */}
          {inventoryData?.pagination && (
            <div className="flex justify-between items-center bg-white px-6 py-4.5 border border-slate-200/60 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500">
                Showing Page <span className="font-bold text-slate-800">{page}</span> of {inventoryData.pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(inventoryData.pagination.pages, p + 1))}
                  disabled={page === inventoryData.pagination.pages}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT ITEM FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingItem ? 'Edit Inventory Details' : 'Register New Spare Part'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase mb-2">Item Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="sku" className="block text-xs font-bold text-slate-500 uppercase mb-2">SKU Code</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="formCategory" className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
              <select
                id="formCategory"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="brand" className="block text-xs font-bold text-slate-500 uppercase mb-2">Brand</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-xs font-bold text-slate-500 uppercase mb-2">Warehouse Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                placeholder="E.g. Shelf A-4"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="costPrice" className="block text-xs font-bold text-slate-500 uppercase mb-2">Cost Price (₹)</label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label htmlFor="unitPrice" className="block text-xs font-bold text-slate-500 uppercase mb-2">Retail Price (₹)</label>
              <input
                type="number"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-xs font-bold text-slate-500 uppercase mb-2">Stock quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                disabled={!!editingItem} // Use adjust stock for updates
                required
              />
            </div>
            <div>
              <label htmlFor="minStockLevel" className="block text-xs font-bold text-slate-500 uppercase mb-2">Min stock limit</label>
              <input
                type="number"
                id="minStockLevel"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
          </div>

          {/* Supplier details header */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Supplier details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="supplierName" className="block text-xs font-bold text-slate-500 mb-2">Vendor Name</label>
                <input
                  type="text"
                  id="supplierName"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label htmlFor="supplierMobile" className="block text-xs font-bold text-slate-500 mb-2">Vendor Mobile</label>
                <input
                  type="tel"
                  id="supplierMobile"
                  name="supplierMobile"
                  value={formData.supplierMobile}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label htmlFor="supplierEmail" className="block text-xs font-bold text-slate-500 mb-2">Vendor Email</label>
                <input
                  type="email"
                  id="supplierEmail"
                  name="supplierEmail"
                  value={formData.supplierEmail}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveItemMutation.isPending}>
              Save Spare Part
            </Button>
          </div>
        </form>
      </Modal>

      {/* STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={closeAdjustModal}
        title="Adjust Stock Quantity Manually"
      >
        <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="adjustmentQty" className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Adjustment Quantity (+10, -5)
            </label>
            <input
              type="number"
              id="adjustmentQty"
              name="adjustmentQty"
              value={adjustData.adjustmentQty}
              onChange={handleAdjustChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-center"
              required
            />
          </div>
          <div>
            <label htmlFor="reason" className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason for modification</label>
            <input
              type="text"
              id="reason"
              name="reason"
              value={adjustData.reason}
              onChange={handleAdjustChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closeAdjustModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={adjustStockMutation.isPending}>
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* STOCK logs / AUDIT TRAIL MODAL */}
      <Modal
        isOpen={isLogsOpen}
        onClose={closeLogsModal}
        title="Warehouse Stock Audit History"
        size="lg"
      >
        {isLogsLoading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : (
          <div className="flex flex-col gap-3">
            {logsData?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No stock change audits found</p>
            ) : (
              logsData.map((log) => {
                const diff = log.newQty - log.previousQty;
                const isAddition = diff >= 0;

                return (
                  <div key={log._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-700">{log.reason}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(log.createdAt, true)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block font-extrabold px-2.5 py-0.5 rounded-md ${isAddition ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {isAddition ? `+${diff}` : diff}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">Remaining: {log.newQty}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
