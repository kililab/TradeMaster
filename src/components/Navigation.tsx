import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navigation = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Trading Journal
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Dashboard
          </Button>
          <Button color="inherit" component={RouterLink} to="/new-trade">
            Neuer Trade
          </Button>
          <Button color="inherit" component={RouterLink} to="/trades">
            Trade Liste
          </Button>
          <Button color="inherit" component={RouterLink} to="/backtesting">
            Backtesting
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 