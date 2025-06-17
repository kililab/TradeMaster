import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { saveAs } from 'file-saver';
import DownloadIcon from '@mui/icons-material/Download';
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

interface BacktestingProps {
  trades: Trade[];
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: number) => void;
}

interface BacktestingResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
  maxDrawdown: number;
  profitFactor: number;
  tradesBySymbol: Record<string, number>;
  tradesByMonth: Record<string, number>;
  averageWin: number;
  averageLoss: number;
  riskRewardRatio: number;
  tradesByHour: Record<string, number>;
  cumulativeProfit: { date: string; profit: number }[];
  tradesByDay: Record<string, { count: number; profit: number }>;
}

const Backtesting: React.FC<BacktestingProps> = ({ trades, onEditTrade, onDeleteTrade }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('all');
  const [results, setResults] = useState<BacktestingResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [editProfit, setEditProfit] = useState<string>('');

  const symbols = Array.from(new Set(trades.map(trade => trade.symbol)));

  const runBacktest = () => {
    let filteredTrades = trades;

    // Filter nach Datum
    if (startDate) {
      filteredTrades = filteredTrades.filter(trade => trade.date >= startDate);
    }
    if (endDate) {
      filteredTrades = filteredTrades.filter(trade => trade.date <= endDate);
    }

    // Filter nach Symbol
    if (selectedSymbol !== 'all') {
      filteredTrades = filteredTrades.filter(trade => trade.symbol === selectedSymbol);
    }

    // Sortiere Trades nach Datum und Uhrzeit
    filteredTrades.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Berechne Statistiken
    const winningTrades = filteredTrades.filter(trade => trade.profit > 0);
    const losingTrades = filteredTrades.filter(trade => trade.profit < 0);
    const totalProfit = filteredTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit, 0));
    const totalGain = winningTrades.reduce((sum, trade) => sum + trade.profit, 0);

    // Berechne durchschnittliche Gewinne und Verluste
    const averageWin = winningTrades.length > 0 ? totalGain / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const riskRewardRatio = averageLoss > 0 ? Math.abs(averageWin / averageLoss) : 0;

    // Berechne Drawdown und kumulativen Gewinn
    let maxDrawdown = 0;
    let peak = 0;
    let currentBalance = 0;
    const cumulativeProfit: { date: string; profit: number }[] = [];

    filteredTrades.forEach(trade => {
      currentBalance += trade.profit;
      cumulativeProfit.push({
        date: trade.date,
        profit: currentBalance,
      });
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      const drawdown = peak - currentBalance;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Gruppiere Trades nach Symbol und Monat
    const tradesBySymbol = filteredTrades.reduce((acc, trade) => {
      acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tradesByMonth = filteredTrades.reduce((acc, trade) => {
      const month = trade.date.substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Gruppiere Trades nach Stunde
    const tradesByHour = filteredTrades.reduce((acc, trade) => {
      const hour = trade.time ? parseInt(trade.time.substring(0, 2)) : 0;
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      if (!acc[hourKey]) {
        acc[hourKey] = 0;
      }
      acc[hourKey] += trade.profit;
      return acc;
    }, {} as Record<string, number>);

    // Gruppiere Trades nach Tag
    const tradesByDay = filteredTrades.reduce((acc, trade) => {
      const day = trade.date.substring(0, 10);
      if (!acc[day]) {
        acc[day] = { count: 0, profit: 0 };
      }
      acc[day].count += 1;
      acc[day].profit += trade.profit;
      return acc;
    }, {} as Record<string, { count: number; profit: number }>);

    setResults({
      totalTrades: filteredTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / filteredTrades.length) * 100,
      totalProfit,
      averageProfit: totalProfit / filteredTrades.length,
      maxDrawdown,
      profitFactor: totalLoss > 0 ? totalGain / totalLoss : 0,
      tradesBySymbol,
      tradesByMonth,
      averageWin,
      averageLoss,
      riskRewardRatio,
      tradesByHour,
      cumulativeProfit,
      tradesByDay,
    });
  };

  const exportCalendarData = () => {
    if (!results) return;

    const calendarData = Object.entries(results.tradesByDay)
      .map(([date, data]) => {
        const dayTrades = trades.filter(trade => trade.date.startsWith(date));
        const symbols = Array.from(new Set(dayTrades.map(trade => trade.symbol))).join(',');
        return `${date}|${data.count}|${data.profit.toFixed(2)}|${symbols}`;
      })
      .sort()
      .join('\n');

    const blob = new Blob([calendarData], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'tradezella_calendar.txt');
  };

  // Trades für ausgewähltes Datum
  const tradesForSelectedDate = selectedDate
    ? trades.filter(trade => trade.date.startsWith(selectedDate))
    : [];

  // Handler für Trade bearbeiten
  const handleEditTrade = (trade: Trade) => {
    setEditTrade(trade);
    setEditProfit(trade.profit.toString());
  };

  // Handler für Trade speichern (nur Profit als Beispiel)
  const handleSaveTrade = () => {
    if (editTrade) {
      const updatedTrade = { ...editTrade, profit: parseFloat(editProfit) };
      onEditTrade(updatedTrade);
    }
    setEditTrade(null);
  };

  // Handler für Trade löschen
  const handleDeleteTrade = (id: number) => {
    onDeleteTrade(id);
    setSelectedDate(null);
  };

  const renderCalendar = () => {
    if (!results) return null;

    const days = Object.entries(results.tradesByDay).sort((a, b) => a[0].localeCompare(b[0]));
    const months = Array.from(new Set(days.map(([date]) => date.substring(0, 7))));

    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
    };

    const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    const todayStr = new Date().toISOString().slice(0, 10);

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Trades Kalender
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={exportCalendarData}
            startIcon={<DownloadIcon />}
          >
            KALENDER EXPORTIEREN
          </Button>
        </Box>
        {months.map(month => {
          const [year, monthNum] = month.split('-').map(Number);
          const daysInMonth = getDaysInMonth(year, monthNum - 1);
          const firstDay = getFirstDayOfMonth(year, monthNum - 1);
          const monthDays = days.filter(([date]) => date.startsWith(month));
          const monthData = Object.fromEntries(monthDays);

          // Kalenderzellen vorbereiten
          const calendarCells: JSX.Element[] = [];
          for (let i = 0; i < firstDay; i++) {
            calendarCells.push(
              <Box key={`empty-${i}`} sx={{ p: 1, height: 80, minWidth: 60, bgcolor: 'transparent' }} />
            );
          }
          for (let day = 1; day <= daysInMonth; day++) {
            const date = `${month}-${day.toString().padStart(2, '0')}`;
            const data = monthData[date];
            const isToday = date === todayStr;
            calendarCells.push(
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
                  bgcolor: data
                    ? data.profit > 0
                      ? 'success.light'
                      : data.profit < 0
                      ? 'error.light'
                      : 'grey.200'
                    : 'grey.100',
                  borderRadius: 1,
                  boxShadow: 1,
                  border: isToday ? '2px solid #1976d2' : undefined,
                  cursor: data && data.count > 0 ? 'pointer' : 'default',
                  opacity: data && data.count > 0 ? 1 : 0.7,
                  transition: 'border 0.2s',
                }}
              >
                <Typography variant="body2">{day}</Typography>
                {data && data.count > 0 && (
                  <>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {data.count} Trade{data.count !== 1 ? 's' : ''}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={data.profit > 0 ? 'success.dark' : data.profit < 0 ? 'error.dark' : 'text.secondary'}
                    >
                      €{data.profit.toFixed(2)}
                    </Typography>
                  </>
                )}
              </Box>
            );
          }
          // In Wochen (Zeilen) aufteilen
          const weeks: JSX.Element[][] = [];
          for (let i = 0; i < calendarCells.length; i += 7) {
            weeks.push(calendarCells.slice(i, i + 7));
          }

          return (
            <Box key={month} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {new Date(month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                {weekDays.map(day => (
                  <Box key={day} sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                    <Typography variant="body2">{day}</Typography>
                  </Box>
                ))}
              </Box>
              {weeks.map((week, idx) => (
                <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                  {week}
                </Box>
              ))}
            </Box>
          );
        })}
      </Paper>
    );
  };

  // Dialog für Trades eines Tages
  const renderTradeListDialog = () => (
    <Dialog open={!!selectedDate} onClose={() => setSelectedDate(null)} maxWidth="sm" fullWidth>
      <DialogTitle>Trades am {selectedDate}</DialogTitle>
      <DialogContent>
        {tradesForSelectedDate.length === 0 ? (
          <Typography>Keine Trades an diesem Tag.</Typography>
        ) : (
          tradesForSelectedDate.map(trade => (
            <Box key={trade.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ flex: 1 }}>
                {trade.symbol} | {trade.direction} | {trade.quantity} | {trade.time} | €{trade.profit.toFixed(2)}
              </Typography>
              <IconButton onClick={() => handleEditTrade(trade)}><EditIcon /></IconButton>
              <IconButton onClick={() => handleDeleteTrade(trade.id)}><DeleteIcon /></IconButton>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSelectedDate(null)}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );

  // Dialog für Trade bearbeiten
  const renderEditTradeDialog = () => (
    <Dialog open={!!editTrade} onClose={() => setEditTrade(null)} maxWidth="xs">
      <DialogTitle>Trade bearbeiten</DialogTitle>
      <DialogContent>
        {editTrade && (
          <TextField
            label="Profit (€)"
            type="number"
            value={editProfit}
            onChange={e => setEditProfit(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditTrade(null)}>Abbrechen</Button>
        <Button onClick={handleSaveTrade} variant="contained">Speichern</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Backtesting
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Startdatum"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Enddatum"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Symbol</InputLabel>
              <Select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                label="Symbol"
              >
                <MenuItem value="all">Alle</MenuItem>
                {symbols.map((symbol) => (
                  <MenuItem key={symbol} value={symbol}>
                    {symbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={runBacktest}>
              Backtest starten
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {results && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Gewinnrate</Typography>
                <Typography variant="h4">{results.winRate.toFixed(1)}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Gesamtgewinn</Typography>
                <Typography variant="h4">€{results.totalProfit.toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Profit Faktor</Typography>
                <Typography variant="h4">{results.profitFactor.toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Max. Drawdown</Typography>
                <Typography variant="h4">€{results.maxDrawdown.toFixed(2)}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Durchschnittlicher Gewinn</Typography>
                <Typography variant="h4" color="success.main">
                  €{results.averageWin.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Durchschnittlicher Verlust</Typography>
                <Typography variant="h4" color="error.main">
                  €{results.averageLoss.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Risiko-Rendite-Verhältnis</Typography>
                <Typography variant="h4">
                  {results.riskRewardRatio.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Kumulativer Gewinn
            </Typography>
            <LineChart width={800} height={300} data={results.cumulativeProfit}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#2196f3" name="Kumulativer Gewinn" />
            </LineChart>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trades nach Symbol
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Anzahl Trades</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(results.tradesBySymbol).map(([symbol, count]) => (
                    <TableRow key={symbol}>
                      <TableCell>{symbol}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trades nach Monat
            </Typography>
            <LineChart width={800} height={300} data={Object.entries(results.tradesByMonth).map(([date, count]) => ({
              date,
              count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#2196f3" name="Anzahl Trades" />
            </LineChart>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trades nach Tageszeit
            </Typography>
            <BarChart width={800} height={300} data={Object.entries(results.tradesByHour).map(([hour, count]) => ({
              hour,
              count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2196f3" name="Anzahl Trades" />
            </BarChart>
          </Paper>

          {renderCalendar()}
          {renderTradeListDialog()}
          {renderEditTradeDialog()}
        </>
      )}
    </Container>
  );
};

export default Backtesting; 