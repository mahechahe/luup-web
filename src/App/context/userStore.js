import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  userIsLogin: false,
  setUser: (user) => set({ user }),
  setUpdateUser: ({ name, lastName }) =>
    set((state) => ({
      user: {
        ...(state.user ?? {}),
        ...(name !== undefined && { name }),
        ...(lastName !== undefined && { lastName }),
      },
    })),
  setUserIsLogin: (userIsLogin) => set({ userIsLogin }),
}));
