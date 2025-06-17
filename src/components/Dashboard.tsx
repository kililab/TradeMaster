import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Trade {
  id: number;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  date: string;
  time: string;
  notes: string;
  profit: number;
}

// Definitionen für jedes Instrument (aus App.tsx/TradeEntry.tsx kopiert)
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
  'XAU/USD': { pipUnitSize: 0.01, contractSize: 100, quoteCurrency: 'USD' },
  'BTC/USD': { pipUnitSize: 1, contractSize: 1, quoteCurrency: 'USD' },
};

// Beispiel Umrechnungskurse zu USD (aus App.tsx/TradeEntry.tsx kopiert)
const USD_EXCHANGE_RATES: { [key: string]: number } = {
  'USD': 1.0,
  'JPY': 1 / 144.88948,
  'CHF': 1.10,
  'CAD': 0.73,
  'GBP': 1.27,
  'EUR': 1.08,
};

interface DashboardProps {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: number) => void;
}

const getMonthData = (trades: Trade[], year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: { [key: string]: { count: number; profit: number } } = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const dayTrades = trades.filter(t => t.date.startsWith(dateStr));
    data[dateStr] = {
      count: dayTrades.length,
      profit: dayTrades.reduce((sum, t) => sum + t.profit, 0),
    };
  }
  return data;
};

const calculateMaxDrawdown = (trades: Trade[]) => {
  let maxDrawdown = 0;
  let peak = 0;
  let balance = 0;
  trades.forEach(trade => {
    balance += trade.profit;
    if (balance > peak) peak = balance;
    const drawdown = peak - balance;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  return maxDrawdown;
};

const getStreak = (trades: Trade[]) => {
  let maxWinStreak = 0;
  let maxLoseStreak = 0;
  let current = 0;
  let lastWin: boolean | null = null;
  trades.forEach(trade => {
    if (trade.profit > 0) {
      if (lastWin === true) {
        current++;
      } else {
        current = 1;
      }
      lastWin = true;
      if (current > maxWinStreak) maxWinStreak = current;
    } else if (trade.profit < 0) {
      if (lastWin === false) {
        current++;
      } else {
        current = 1;
      }
      lastWin = false;
      if (current > maxLoseStreak) maxLoseStreak = current;
    }
  });
  return { maxWinStreak, maxLoseStreak };
};

const Dashboard: React.FC<DashboardProps> = ({ trades, onEditTrade, onDeleteTrade }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);

  // Statistik-Kacheln
  const netReturn = trades.reduce((sum, t) => sum + t.profit, 0);
  const winTrades = trades.filter(t => t.profit > 0);
  const loseTrades = trades.filter(t => t.profit < 0);
  const winrate = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0;
  const avgPL = trades.length > 0 ? netReturn / trades.length : 0;
  const profitFactor = loseTrades.length > 0 ? winTrades.reduce((s, t) => s + t.profit, 0) / Math.abs(loseTrades.reduce((s, t) => s + t.profit, 0)) : 0;

  // Kalenderdaten für aktuellen Monat
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthData = getMonthData(trades, year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  // Evaluation-Kennzahlen
  const biggestWinner = trades.length > 0 ? Math.max(...trades.map(t => t.profit)) : 0;
  const biggestLoser = trades.length > 0 ? Math.min(...trades.map(t => t.profit)) : 0;
  const maxDrawdown = calculateMaxDrawdown(trades);
  const fees = 0; // Optional: Hier können Gebühren berechnet werden
  const { maxWinStreak, maxLoseStreak } = getStreak(trades);
  const winningDays = Object.values(getMonthData(trades, year, month)).filter(d => d.profit > 0).length;
  const losingDays = Object.values(getMonthData(trades, year, month)).filter(d => d.profit < 0).length;

  // Performance by Instrument
  const instrumentData = Object.entries(
    trades.reduce((acc, t) => {
      acc[t.symbol] = (acc[t.symbol] || 0) + t.profit;
      return acc;
    }, {} as Record<string, number>)
  ).map(([symbol, profit]) => ({ symbol, profit }));

  // Performance by Weekday
  const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdayData = trades.reduce((acc, t) => {
    const day = new Date(t.date).getDay();
    // JS: 0=Sunday, 1=Monday, ...
    const idx = day === 0 ? 6 : day - 1;
    acc[idx] = (acc[idx] || 0) + t.profit;
    return acc;
  }, Array(7).fill(0)).map((profit, idx) => ({ weekday: weekdayNames[idx], profit }));

  // Performance by Hour
  const tradesByHour = trades.reduce((acc, trade) => {
    if (trade.time) {
      const hour = parseInt(trade.time.substring(0, 2));
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      if (!acc[hourKey]) {
        acc[hourKey] = 0;
      }
      acc[hourKey] += trade.profit;
    }
    return acc;
  }, {} as Record<string, number>);

  const hourlyData = Object.entries(tradesByHour).sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB)).map(([hour, profit]) => ({ hour, profit }));

  // Equity Graph
  let equity = 0;
  const equityData = trades
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t, idx) => {
      equity += t.profit;
      return { trade: idx + 1, equity };
    });

  // Zusätzliche Kennzahlen für R-Multiple
  const totalWinningProfit = winTrades.reduce((sum, t) => sum + t.profit, 0);
  const totalLosingProfit = loseTrades.reduce((sum, t) => sum + Math.abs(t.profit), 0);

  const averageWin = winTrades.length > 0 ? totalWinningProfit / winTrades.length : 0;
  const averageLoss = loseTrades.length > 0 ? totalLosingProfit / loseTrades.length : 0;

  const riskRewardRatio = averageLoss > 0 ? (averageWin / averageLoss).toFixed(2) : 'N/A';

  // Trades für ausgewähltes Datum
  const tradesForSelectedDate = selectedDate
    ? trades.filter(trade => trade.date.startsWith(selectedDate))
    : [];

  // Handler für Trade bearbeiten (öffnet den Dialog)
  const handleEditTradeClick = (trade: Trade) => {
    setEditTrade({ ...trade }); // Erstelle eine Kopie, um den State zu aktualisieren
  };

  // Handler für Änderungen im Bearbeiten-Dialog (jedes Feld)
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditTrade(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleEditSelectChange = (e: any) => { // SelectChangeEvent ist etwas komplexer, any für Einfachheit
    const { name, value } = e.target;
    setEditTrade(prev => (prev ? { ...prev, [name]: value } : null));
  };

  // Handler für Trade speichern
  const handleSaveTrade = () => {
    if (editTrade) {
      const { symbol, direction, entryPrice, exitPrice, quantity } = editTrade;
      const lotSize = quantity;

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

      const updatedTrade: Trade = {
        ...editTrade,
        entryPrice: parseFloat(editTrade.entryPrice.toString()),
        exitPrice: parseFloat(editTrade.exitPrice.toString()),
        quantity: parseFloat(editTrade.quantity.toString()),
        profit: profit,
      };
      onEditTrade(updatedTrade);
    }
    setEditTrade(null); // Dialog schließen
  };

  // Handler für Trade löschen
  const handleDeleteTradeClick = (id: number) => {
    onDeleteTrade(id);
    // Dialog schließen, falls alle Trades des Tages gelöscht wurden
    if (tradesForSelectedDate.length === 1 && tradesForSelectedDate[0].id === id) { 
      setSelectedDate(null);
    }
  };

  // Alle Kalenderzellen vorbereiten (Wochentage, leere Felder, Tage des Monats)
  const allGridCells: JSX.Element[] = [];

  // Wochentage hinzufügen
  weekDays.forEach(day => {
    allGridCells.push(
      <Box key={`weekday-${day}`} sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
        <Typography variant="body2">{day}</Typography>
      </Box>
    );
  });

  // Leere Felder für den Monatsanfang hinzufügen
  for (let i = 0; i < firstDay; i++) {
    allGridCells.push(
      <Box key={`empty-${i}`} sx={{ p: 1, height: 80, bgcolor: 'transparent' }} />
    );
  }
  // Tage des Monats hinzufügen
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const data = monthData[date];
    const todayStr = new Date().toISOString().slice(0, 10);
    const isToday = date === todayStr;
    allGridCells.push(
      <Box
        key={date}
        onClick={() => setSelectedDate(date)}
        sx={{
          p: 1,
          height: 80,
          minWidth: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: data.count > 0
            ? data.profit > 0
              ? 'success.light'
              : data.profit < 0
              ? 'error.light'
              : 'grey.800' // Darker grey for zero profit trades
            : 'grey.900', // Darkest grey for no trades
          borderRadius: 1,
          boxShadow: 1,
          border: isToday ? '2px solid #1976d2' : undefined, // Mark today's date
          cursor: 'pointer',
        }}
      >
        <Typography variant="body2" sx={{ color: '#ffffff' }}>
          {day}
        </Typography>
        {data.count > 0 && (
          <>
            <Typography variant="caption" sx={{ color: '#ffffff' }}>
              {data.count} Trades
            </Typography>
            <Typography variant="caption" sx={{ color: data.profit >= 0 ? '#81c784' : '#e57373' }}>
              ${data.profit.toFixed(2)}
            </Typography>
          </>
        )}
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          {/* Statistik-Kacheln */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">Net Return</Typography>
                <Typography variant="h5" color={netReturn >= 0 ? 'success.main' : 'error.main'}>
                  €{netReturn.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">Winrate</Typography>
                <Typography variant="h5">{winrate.toFixed(2)}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">Avg P&L</Typography>
                <Typography variant="h5" color={avgPL >= 0 ? 'success.main' : 'error.main'}>
                  €{avgPL.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">Profit Factor</Typography>
                <Typography variant="h5">{profitFactor.toFixed(2)}</Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Monatskalender */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Profit Kalender – {today.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            {/* Alle Kalenderzellen in einem einzigen Grid-Container rendern */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {allGridCells}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Evaluation</Typography>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Total Number of Trades</Typography>
              <Typography variant="subtitle1">{trades.length}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Biggest Winner</Typography>
              <Typography variant="subtitle1" color="success.main">€{biggestWinner.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Biggest Loser</Typography>
              <Typography variant="subtitle1" color="error.main">€{biggestLoser.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Max Drawdown</Typography>
              <Typography variant="subtitle1">€{maxDrawdown.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Winning / Losing Days</Typography>
              <Typography variant="subtitle1">{winningDays} / {losingDays}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Max Win Streak</Typography>
              <Typography variant="subtitle1" color="success.main">{maxWinStreak}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Max Lose Streak</Typography>
              <Typography variant="subtitle1" color="error.main">{maxLoseStreak}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Fees</Typography>
              <Typography variant="subtitle1">€{fees.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">Risk Reward Ratio</Typography>
              <Typography variant="subtitle1">{riskRewardRatio}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Performance by Instrument</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={instrumentData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="profit" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Performance by Weekday</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekdayData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekday" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="profit" fill="#43a047" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Equity Graph</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={equityData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trade" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="equity" stroke="#388e3c" dot={false} name="Equity" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Performance nach Wochentag</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekday" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="profit" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Performance nach Handelsstunde</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="profit" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
      {/* Dialog für Trades eines Tages */}
      <Dialog open={!!selectedDate} onClose={() => setSelectedDate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Trades am {selectedDate}</DialogTitle>
        <DialogContent>
          {tradesForSelectedDate.length === 0 ? (
            <Typography>Keine Trades an diesem Tag.</Typography>
          ) : (
            tradesForSelectedDate.map(trade => (
              <Box key={trade.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ flex: 1 }}>
                  {trade.symbol} | {trade.direction} | {trade.quantity} | €{trade.profit.toFixed(2)}
                </Typography>
                <IconButton onClick={() => handleEditTradeClick(trade)}><EditIcon /></IconButton>
                <IconButton onClick={() => handleDeleteTradeClick(trade.id)}><DeleteIcon /></IconButton>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDate(null)}>Schließen</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog für Trade bearbeiten */}
      <Dialog open={!!editTrade} onClose={() => setEditTrade(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Trade bearbeiten</DialogTitle>
        <DialogContent>
          {editTrade && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Symbol"
                  name="symbol"
                  value={editTrade.symbol}
                  onChange={handleEditInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Richtung</InputLabel>
                  <Select
                    name="direction"
                    value={editTrade.direction}
                    onChange={handleEditSelectChange}
                    label="Richtung"
                  >
                    <MenuItem value="long">Long</MenuItem>
                    <MenuItem value="short">Short</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Einstiegspreis"
                  name="entryPrice"
                  type="number"
                  value={editTrade.entryPrice}
                  onChange={handleEditInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ausstiegspreis"
                  name="exitPrice"
                  type="number"
                  value={editTrade.exitPrice}
                  onChange={handleEditInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Menge"
                  name="quantity"
                  type="number"
                  value={editTrade.quantity}
                  onChange={handleEditInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Datum"
                  name="date"
                  type="date"
                  value={editTrade.date}
                  onChange={handleEditInputChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Uhrzeit"
                  name="time"
                  type="time"
                  value={editTrade.time}
                  onChange={handleEditInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notizen"
                  name="notes"
                  multiline
                  rows={3}
                  value={editTrade.notes}
                  onChange={handleEditInputChange}
                  fullWidth
                />
              </Grid>
              {/* Profit wird automatisch neu berechnet und nicht direkt bearbeitet */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Neuer Profit: ${editTrade.profit ? parseFloat(editTrade.profit.toString()).toFixed(2) : '0.00'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTrade(null)}>Abbrechen</Button>
          <Button onClick={handleSaveTrade} variant="contained">Speichern</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;