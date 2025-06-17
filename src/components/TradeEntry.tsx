import React, { useState } from 'react';
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
    quantity: number;
    date: string;
    notes: string;
  }) => void;
}

const TradeEntry: React.FC<TradeEntryProps> = ({ onAddTrade }) => {
  const navigate = useNavigate();
  const [trade, setTrade] = useState({
    symbol: '',
    direction: 'long',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    date: '',
    notes: '',
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrade = {
      ...trade,
      entryPrice: parseFloat(trade.entryPrice),
      exitPrice: parseFloat(trade.exitPrice),
      quantity: parseInt(trade.quantity),
    };
    onAddTrade(newTrade);
    navigate('/trades'); // Weiterleitung zur Trade-Liste nach dem Speichern
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
              <TextField
                fullWidth
                label="Symbol"
                name="symbol"
                value={trade.symbol}
                onChange={handleInputChange}
                required
              />
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Menge"
                name="quantity"
                type="number"
                value={trade.quantity}
                onChange={handleInputChange}
                required
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