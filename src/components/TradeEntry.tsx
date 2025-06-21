import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';

interface TradeEntryProps {
  onAddTrade: (trade: {
    symbol: string;
    direction: string;
    entryPrice: number;
    exitPrice: number;
    quantity: number; // This now represents lotSize
    date: string;
    time: string; // Added time property
    stopLoss?: number; // Optionales Stop-Loss-Feld
    notes: string;
  }) => void;
}

// Definitionen für jedes Instrument
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

// Beispiel Umrechnungskurse zu USD (könnten von einer API kommen)
const USD_EXCHANGE_RATES: { [key: string]: number } = {
  'USD': 1.0,
  'JPY': 1 / 144.88948, // Beispielwert aus Ihrem Bild
  'CHF': 1.10, // Beispiel
  'CAD': 0.73, // Beispiel
  'GBP': 1.27, // Beispiel
  'EUR': 1.08, // Beispiel
};

const TradeEntry: React.FC<TradeEntryProps> = ({ onAddTrade }) => {
  const navigate = useNavigate();
  const [trade, setTrade] = useState({
    symbol: '',
    direction: 'long',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    date: '',
    time: '', // Added time state
    stopLoss: '', // Neues Feld für Stop-Loss
    notes: '',
  });
  const [calculatedProfit, setCalculatedProfit] = useState<number>(0);
  const [calculatedPipsProfit, setCalculatedPipsProfit] = useState<number>(0);
  const [calculatedPossibleLoss, setCalculatedPossibleLoss] = useState<number>(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTrade((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setTrade((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  // Berechne den Profit basierend auf den eingegebenen Werten
  useEffect(() => {
    const entryPrice = parseFloat(trade.entryPrice);
    const exitPrice = parseFloat(trade.exitPrice);
    const lotSize = parseFloat(trade.quantity);

    const instrumentSpec = INSTRUMENT_SPECS[trade.symbol];

    if (instrumentSpec && !isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(lotSize)) {
      const { pipUnitSize, contractSize, quoteCurrency } = instrumentSpec;
      const usdConversionRate = USD_EXCHANGE_RATES[quoteCurrency] || 1.0;

      // Berechne die rohe Preisdifferenz
      const priceDifferenceRaw = trade.direction === 'long'
        ? (exitPrice - entryPrice)
        : (entryPrice - exitPrice);

      // Berechne den Gewinn/Verlust in Pips
      const pipsProfit = priceDifferenceRaw / pipUnitSize;
      setCalculatedPipsProfit(pipsProfit);

      // Berechne den Wert eines Pips pro Standard-Lot in der Notierungswährung
      const valuePerPipPerStandardLotInQuoteCurrency = contractSize * pipUnitSize;

      // Berechne den Gewinn/Verlust in USD
      const moneyProfit = pipsProfit * valuePerPipPerStandardLotInQuoteCurrency * usdConversionRate * lotSize;
      setCalculatedProfit(moneyProfit);
    } else {
      setCalculatedPipsProfit(0);
      setCalculatedProfit(0);
    }
  }, [trade.entryPrice, trade.exitPrice, trade.quantity, trade.direction, trade.symbol]);

  // Berechne den möglichen Verlust basierend auf dem Stop-Loss
  useEffect(() => {
    const entryPrice = parseFloat(trade.entryPrice);
    const stopLoss = parseFloat(trade.stopLoss);
    const lotSize = parseFloat(trade.quantity);
    const instrumentSpec = INSTRUMENT_SPECS[trade.symbol];

    if (instrumentSpec && !isNaN(entryPrice) && !isNaN(stopLoss) && !isNaN(lotSize)) {
      const { pipUnitSize, contractSize, quoteCurrency } = instrumentSpec;
      const usdConversionRate = USD_EXCHANGE_RATES[quoteCurrency] || 1.0;
      const priceDifferenceRaw = trade.direction === 'long'
        ? (entryPrice - stopLoss)
        : (stopLoss - entryPrice);
      const pipsLoss = priceDifferenceRaw / pipUnitSize;
      const valuePerPipPerStandardLotInQuoteCurrency = contractSize * pipUnitSize;
      const possibleLoss = pipsLoss * valuePerPipPerStandardLotInQuoteCurrency * usdConversionRate * lotSize;
      setCalculatedPossibleLoss(possibleLoss > 0 ? possibleLoss : 0);
    } else {
      setCalculatedPossibleLoss(0);
    }
  }, [trade.entryPrice, trade.stopLoss, trade.quantity, trade.direction, trade.symbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrade = {
      ...trade,
      entryPrice: parseFloat(trade.entryPrice),
      exitPrice: parseFloat(trade.exitPrice),
      quantity: parseFloat(trade.quantity),
      stopLoss: trade.stopLoss !== '' ? parseFloat(trade.stopLoss) : undefined,
    };
    onAddTrade(newTrade);
    navigate('/trades');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Neuer Trade
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Instrument</InputLabel>
                <Select
                  name="symbol"
                  value={trade.symbol}
                  onChange={handleSelectChange}
                  label="Instrument"
                  required
                >
                  {Object.keys(INSTRUMENT_SPECS).map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>
                      {symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Richtung</InputLabel>
                <Select
                  name="direction"
                  value={trade.direction}
                  onChange={handleSelectChange}
                  label="Richtung"
                >
                  <MenuItem value="long">Long</MenuItem>
                  <MenuItem value="short">Short</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Einstiegspreis"
                name="entryPrice"
                type="number"
                value={trade.entryPrice}
                onChange={handleInputChange}
                required
                inputProps={{ step: "0.00001" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ausstiegspreis"
                name="exitPrice"
                type="number"
                value={trade.exitPrice}
                onChange={handleInputChange}
                required
                inputProps={{ step: "0.00001" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lots (Trade Size)"
                name="quantity"
                type="number"
                value={trade.quantity}
                onChange={handleInputChange}
                required
                inputProps={{ step: "0.01", min: "0.01" }}
                helperText="Eingabe in Lots (z.B. 0.1, 1.0)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Datum"
                name="date"
                type="date"
                value={trade.date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Uhrzeit"
                name="time"
                type="time"
                value={trade.time}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stop-Loss"
                name="stopLoss"
                type="number"
                value={trade.stopLoss}
                onChange={handleInputChange}
                inputProps={{ step: "0.00001" }}
                helperText="Optional: Stop-Loss-Preis"
              />
              {trade.stopLoss && (
                <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                  Möglicher Verlust: ${calculatedPossibleLoss.toFixed(2)}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notizen"
                name="notes"
                multiline
                rows={4}
                value={trade.notes}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">
                Berechneter Gewinn/Verlust in Pips: {calculatedPipsProfit.toFixed(1)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" color={calculatedProfit >= 0 ? 'success.main' : 'error.main'}>
                Berechneter Gewinn/Verlust: ${calculatedProfit.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" size="large">
                Trade speichern
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default TradeEntry; 