import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentFarmer, setCurrentFarmer] = useState(null);
  const [currentBuyer, setCurrentBuyer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('km_token') || null);

  useEffect(() => {
    const saved = localStorage.getItem('km_farmer');
    const savedAdmin = localStorage.getItem('km_admin');
    const savedBuyer = localStorage.getItem('km_buyer');
    if (saved) setCurrentFarmer(JSON.parse(saved));
    if (savedAdmin) { setAdminUser(JSON.parse(savedAdmin)); setIsAdmin(true); }
    if (savedBuyer) setCurrentBuyer(JSON.parse(savedBuyer));
  }, []);

  const loginFarmer = (farmerData, tok) => {
    setCurrentFarmer(farmerData);
    setToken(tok);
    localStorage.setItem('km_token', tok);
    localStorage.setItem('km_farmer', JSON.stringify(farmerData));
  };

  const loginAdmin = (adminData, tok) => {
    setAdminUser(adminData);
    setIsAdmin(true);
    setToken(tok);
    localStorage.setItem('km_token', tok);
    localStorage.setItem('km_admin', JSON.stringify(adminData));
  };

  const loginBuyer = (buyerData, tok) => {
    setCurrentBuyer(buyerData);
    setToken(tok);
    localStorage.setItem('km_token', tok);
    localStorage.setItem('km_buyer', JSON.stringify(buyerData));
  };

  const logout = () => {
    setCurrentFarmer(null);
    setCurrentBuyer(null);
    setAdminUser(null);
    setIsAdmin(false);
    setToken(null);
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_farmer');
    localStorage.removeItem('km_admin');
    localStorage.removeItem('km_buyer');
  };

  return (
    <AuthContext.Provider value={{ currentFarmer, currentBuyer, isAdmin, adminUser, token, loginFarmer, loginAdmin, loginBuyer, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
