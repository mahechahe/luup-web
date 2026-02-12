import { create } from 'zustand';

export const useSharedStore = create((set) => ({
  cities: [],
  departments: [],
  documentTypes: [],
  setCities: (cities) => set({ cities }),
  setDepartments: (departments) => set({ departments }),
  setDocumentTypes: (documentTypes) => set({ documentTypes }),
}));
