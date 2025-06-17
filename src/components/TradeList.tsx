import React from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

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

interface TradeListProps {
  trades: Trade[];
}

const TradeList: React.FC<TradeListProps> = ({ trades }) => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Trade Liste
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Richtung</TableCell>
              <TableCell align="right">Einstiegspreis</TableCell>
              <TableCell align="right">Ausstiegspreis</TableCell>
              <TableCell align="right">Menge</TableCell>
              <TableCell align="right">Gewinn/Verlust</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{trade.date}</TableCell>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>{trade.direction}</TableCell>
                <TableCell align="right">€{trade.entryPrice.toFixed(2)}</TableCell>
                <TableCell align="right">€{trade.exitPrice.toFixed(2)}</TableCell>
                <TableCell align="right">{trade.quantity}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: trade.profit >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  €{trade.profit.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TradeList; 