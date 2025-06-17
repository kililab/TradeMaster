import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './components/Dashboard';
import TradeEntry from './components/TradeEntry';
import TradeList from './components/TradeList';
import Navigation from './components/Navigation';
import Backtesting from './components/Backtesting';

interface Trade {
  id: number;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  date: string;
  notes: string;
  profit: number;
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  // Lade gespeicherte Trades beim Start
  const [trades, setTrades] = useState<Trade[]>(() => {
    const savedTrades = localStorage.getItem('trades');
    return savedTrades ? JSON.parse(savedTrades) : [];
  });

  // Speichere Trades im localStorage, wenn sie sich ändern
  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  const handleAddTrade = (newTrade: Omit<Trade, 'id' | 'profit'>) => {
    const profit = newTrade.direction === 'long'
      ? (newTrade.exitPrice - newTrade.entryPrice) * newTrade.quantity
      : (newTrade.entryPrice - newTrade.exitPrice) * newTrade.quantity;

    const tradeWithId: Trade = {
      ...newTrade,
      id: Date.now(),
      profit,
    };

    setTrades((prevTrades) => [...prevTrades, tradeWithId]);
  };

  // Trade bearbeiten
  const handleEditTrade = (updatedTrade: Trade) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) =>
        trade.id === updatedTrade.id ? { ...updatedTrade } : trade
      )
    );
  };

  // Trade löschen
  const handleDeleteTrade = (id: number) => {
    setTrades((prevTrades) => prevTrades.filter((trade) => trade.id !== id));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard trades={trades} onEditTrade={handleEditTrade} onDeleteTrade={handleDeleteTrade} />} />
          <Route path="/new-trade" element={<TradeEntry onAddTrade={handleAddTrade} />} />
          <Route path="/trades" element={<TradeList trades={trades} />} />
          <Route path="/backtesting" element={<Backtesting trades={trades} onEditTrade={handleEditTrade} onDeleteTrade={handleDeleteTrade} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 