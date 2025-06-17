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
  quantity: number; // This now represents lotSize
  date: string;
  time: string; // Added time property
  notes: string;
  profit: number;
}

// Definitionen für jedes Instrument (aus TradeEntry.tsx kopiert)
const INSTRUMENT_SPECS: { [key: string]: { pipUnitSize: number; contractSize: number; quoteCurrency: string; } } = {
  'EUR/USD': { pipUnitSize: 0.0001, contractSize: 100000, quoteCurrency: 'USD' },
  'GBP/USD': { pipUnitSize: 0.0001, contractSize: 100000, quoteCurrency: 'USD' },
  'USD/JPY': { pipUnitSize: 0.01, contractSize: 100000, quoteCurrency: 'JPY' },
  'USD/CHF': { pipUnitSize: 0.0001, contractSize: 100000, quoteCurrency: 'CHF' },
  'AUD/USD': { pipUnitSize: 0.0001, contractSize: 100000, quoteCurrency: 'USD' },
  'USD/CAD': { pipUnitSize: 0.0001, contractSize: 100000, quoteCurrency: 'CAD' },
  'NZD/USD': { pipUnitSize: 0.0001, contractSize: 100000, quoteCurrency: 'USD' },
  'EUR/GBP': { pipUnitSize: 0.0001, contractSize: 100000, quoteCurrency: 'GBP' },
  'EUR/JPY': { pipUnitSize: 0.01, contractSize: 100000, quoteCurrency: 'JPY' },
  'GBP/JPY': { pipUnitSize: 0.01, contractSize: 100000, quoteCurrency: 'JPY' },
  'XAU/USD': { pipUnitSize: 0.01, contractSize: 100, quoteCurrency: 'USD' }, // Gold: 1 Standard Lot = 100 Unzen
  'BTC/USD': { pipUnitSize: 1, contractSize: 1, quoteCurrency: 'USD' }, // Bitcoin: 1 Standard Lot = 1 BTC
};

// Beispiel Umrechnungskurse zu USD (aus TradeEntry.tsx kopiert)
const USD_EXCHANGE_RATES: { [key: string]: number } = {
  'USD': 1.0,
  'JPY': 1 / 144.88948, // Beispielwert aus Ihrem Bild
  'CHF': 1.10, // Beispiel
  'CAD': 0.73, // Beispiel
  'GBP': 1.27, // Beispiel
  'EUR': 1.08, // Beispiel
};

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
    const { symbol, direction, entryPrice, exitPrice, quantity, date, time } = newTrade;
    const lotSize = quantity; // quantity in Omit<Trade> is now lotSize

    const instrumentSpec = INSTRUMENT_SPECS[symbol];

    let profit = 0;
    if (instrumentSpec) {
      const { pipUnitSize, contractSize, quoteCurrency } = instrumentSpec;
      const usdConversionRate = USD_EXCHANGE_RATES[quoteCurrency] || 1.0;

      const priceDifferenceRaw = direction === 'long'
        ? (exitPrice - entryPrice)
        : (entryPrice - exitPrice);

      const pipsProfit = priceDifferenceRaw / pipUnitSize;

      profit = pipsProfit * contractSize * pipUnitSize * usdConversionRate * lotSize;
    }

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