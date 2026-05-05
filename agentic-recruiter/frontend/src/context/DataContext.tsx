import { createContext, useContext } from 'react';
import DataStore from '../data/store';

export const DataContext = createContext();

export function DataProvider({ children }) {
  return (
    <DataContext.Provider value={DataStore}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
