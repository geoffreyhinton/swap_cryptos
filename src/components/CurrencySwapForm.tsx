import React, { useState, useEffect } from 'react';
import './CurrencySwapForm.css';

// Types for API data
interface PriceData {
  currency: string;
  date: string;
  price: number;
}

interface Token {
  symbol: string;
  name: string;
  balance?: number;
  price?: number;
}

// API endpoint for prices
const PRICES_API_URL = 'https://interview.switcheo.com/prices.json';

// Token names mapping for better display
const TOKEN_NAMES: { [key: string]: string } = {
  'BLUR': 'Blur',
  'bNEO': 'Binance NEO',
  'BUSD': 'Binance USD',
  'USD': 'US Dollar',
  'ETH': 'Ethereum',
  'GMX': 'GMX',
  'STEVMOS': 'Staked Evmos',
  'LUNA': 'Terra Luna',
  'RATOM': 'Regen Atom',
  'STRD': 'Stride',
  'EVMOS': 'Evmos',
  'IBCX': 'IBC Index',
  'IRIS': 'IRISnet',
  'ampLUNA': 'Amplified Luna',
  'KUJI': 'Kujira',
  'STOSMO': 'Staked Osmosis',
  'USDC': 'USD Coin',
  'axlUSDC': 'Axelar USDC',
  'ATOM': 'Cosmos',
  'STATOM': 'Staked Atom',
  'OSMO': 'Osmosis',
  'rSWTH': 'Reward Switcheo',
  'STLUNA': 'Staked Luna',
  'LSI': 'Liquid Staking Index',
  'OKB': 'OKB',
  'OKT': 'OKExChain Token',
  'SWTH': 'Switcheo',
  'USC': 'USC',
  'WBTC': 'Wrapped Bitcoin',
  'wstETH': 'Wrapped Staked Ether',
  'YieldUSD': 'Yield USD',
  'ZIL': 'Zilliqa',
  'BTC': 'Bitcoin',
  'BNB': 'Binance Coin',
  'ADA': 'Cardano',
  'DOT': 'Polkadot',
  'AVAX': 'Avalanche',
  'SOL': 'Solana',
};

interface TokenSelectorProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  excludeToken?: Token | null;
  availableTokens: Token[];
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ 
  selectedToken, 
  onTokenSelect, 
  excludeToken, 
  availableTokens 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = availableTokens.filter(token => 
    token !== excludeToken &&
    (token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
     token.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTokenIcon = (symbol: string) => {
    return `/images/tokens/${symbol}.svg`;
  };

  return (
    <div className={`token-selector ${isOpen ? 'open' : ''}`}>
      <button 
        className="token-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedToken ? (
          <>
            <img 
              src={getTokenIcon(selectedToken.symbol)} 
              alt={selectedToken.symbol}
              className="token-icon"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="token-symbol">{selectedToken.symbol}</span>
          </>
        ) : (
          <span>Select Token</span>
        )}
        <svg className={`chevron ${isOpen ? 'open' : ''}`} width="12" height="8" viewBox="0 0 12 8">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </button>
      
      {isOpen && (
        <div className="token-dropdown">
          <div className="token-search">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="token-search-input"
            />
          </div>
          <div className="token-list">
            {filteredTokens.map((token) => (
              <button
                key={token.symbol}
                className="token-option"
                onClick={() => {
                  onTokenSelect(token);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <img 
                  src={getTokenIcon(token.symbol)} 
                  alt={token.symbol}
                  className="token-icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="token-info">
                  <span className="token-symbol">{token.symbol}</span>
                  <span className="token-name">{token.name}</span>
                </div>
                <div className="token-balance">
                  <span>{token.balance?.toFixed(4) || '0'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CurrencySwapForm: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<'from' | 'to'>('from');
  const [pricesLoading, setPricesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch prices from API
  const fetchPrices = async () => {
    try {
      setPricesLoading(true);
      setError(null);
      
      const response = await fetch(PRICES_API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      
      const priceData: PriceData[] = await response.json();
      
      // Process the data to get the latest price for each currency
      const latestPrices = new Map<string, number>();
      
      priceData.forEach(item => {
        const existingPrice = latestPrices.get(item.currency);
        if (!existingPrice || new Date(item.date) > new Date(priceData.find(p => p.currency === item.currency && p.price === existingPrice)?.date || '')) {
          latestPrices.set(item.currency, item.price);
        }
      });
      
      // Convert to tokens array with random balances for demo
      const tokensArray: Token[] = Array.from(latestPrices.entries()).map(([symbol, price]) => ({
        symbol,
        name: TOKEN_NAMES[symbol] || symbol,
        price,
        balance: Math.random() * 1000 // Random balance for demo purposes
      }));
      
      // Sort by market cap (price * balance) descending
      tokensArray.sort((a, b) => (b.price || 0) * (b.balance || 0) - (a.price || 0) * (a.balance || 0));
      
      setTokens(tokensArray);
      
      // Set default tokens if none selected
      if (!fromToken && tokensArray.length > 0) {
        const ethToken = tokensArray.find(t => t.symbol === 'ETH') || tokensArray[0];
        setFromToken(ethToken);
      }
      if (!toToken && tokensArray.length > 1) {
        const usdcToken = tokensArray.find(t => t.symbol === 'USDC') || tokensArray[1];
        setToToken(usdcToken);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      console.error('Error fetching prices:', err);
    } finally {
      setPricesLoading(false);
    }
  };

  // Fetch prices on component mount
  useEffect(() => {
    fetchPrices();
  }, []);

  // Mock exchange rate calculation
  const calculateExchangeRate = (from: Token, to: Token): number => {
    if (!from.price || !to.price) return 1;
    return from.price / to.price;
  };

  useEffect(() => {
    if (fromToken && toToken && fromAmount && lastEditedField === 'from') {
      const rate = calculateExchangeRate(fromToken, toToken);
      const calculatedAmount = (parseFloat(fromAmount) * rate).toFixed(6);
      setToAmount(calculatedAmount);
    } else if (fromToken && toToken && toAmount && lastEditedField === 'to') {
      const rate = calculateExchangeRate(toToken, fromToken);
      const calculatedAmount = (parseFloat(toAmount) * rate).toFixed(6);
      setFromAmount(calculatedAmount);
    }
  }, [fromToken, toToken, fromAmount, toAmount, lastEditedField]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleMaxClick = () => {
    if (fromToken?.balance) {
      setFromAmount(fromToken.balance.toString());
      setLastEditedField('from');
    }
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`);
    setIsLoading(false);
    
    // Reset form
    setFromAmount('');
    setToAmount('');
  };

  const isSwapDisabled = !fromToken || !toToken || !fromAmount || isLoading;

  return (
    <div className="currency-swap-form">
      <div className="swap-header">
        <h2>Swap Tokens</h2>
        <div className="slippage-container">
          <span>Slippage: {slippage}%</span>
          <div className="slippage-buttons">
            {[0.1, 0.5, 1.0].map(value => (
              <button
                key={value}
                className={`slippage-btn ${slippage === value ? 'active' : ''}`}
                onClick={() => setSlippage(value)}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {pricesLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading token prices...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-state">
          <span>Error: {error}</span>
          <button onClick={fetchPrices}>Retry</button>
        </div>
      )}

      {/* Main swap interface */}
      {!pricesLoading && !error && (
        <div className="swap-container">
          {/* From Token */}
          <div className="token-input-container">
            <div className="token-input-header">
              <span>From</span>
              {fromToken && (
                <span className="balance">
                  Balance: {fromToken.balance?.toFixed(4) || '0'} {fromToken.symbol}
                </span>
              )}
            </div>
            <div className="token-input">
              <TokenSelector
                selectedToken={fromToken}
                onTokenSelect={setFromToken}
                excludeToken={toToken}
                availableTokens={tokens}
              />
              <div className="amount-input-container">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => {
                    setFromAmount(e.target.value);
                    setLastEditedField('from');
                  }}
                  className="amount-input"
                />
                <button className="max-button" onClick={handleMaxClick}>
                  MAX
                </button>
              </div>
            </div>
            {fromToken && fromAmount && (
              <div className="usd-value">
                ≈ ${(parseFloat(fromAmount) * (fromToken.price || 0)).toFixed(2)} USD
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="swap-button-container">
            <button className="swap-tokens-button" onClick={handleSwapTokens}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 3L4 7L8 11"/>
                <path d="M4 7H20"/>
                <path d="M16 21L20 17L16 13"/>
                <path d="M20 17H4"/>
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div className="token-input-container">
            <div className="token-input-header">
              <span>To</span>
              {toToken && (
                <span className="balance">
                  Balance: {toToken.balance?.toFixed(4) || '0'} {toToken.symbol}
                </span>
              )}
            </div>
            <div className="token-input">
              <TokenSelector
                selectedToken={toToken}
                onTokenSelect={setToToken}
                excludeToken={fromToken}
                availableTokens={tokens}
              />
              <div className="amount-input-container">
                <input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  onChange={(e) => {
                    setToAmount(e.target.value);
                    setLastEditedField('to');
                  }}
                  className="amount-input"
                />
              </div>
            </div>
            {toToken && toAmount && (
              <div className="usd-value">
                ≈ ${(parseFloat(toAmount) * (toToken.price || 0)).toFixed(2)} USD
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exchange Rate Info */}
      {fromToken && toToken && !pricesLoading && (
        <div className="exchange-info">
          <div className="exchange-rate">
            1 {fromToken.symbol} = {calculateExchangeRate(fromToken, toToken).toFixed(6)} {toToken.symbol}
          </div>
          <div className="price-info">
            <span>{fromToken.symbol}: ${fromToken.price?.toFixed(2) || 'N/A'}</span>
            <span>{toToken.symbol}: ${toToken.price?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="fee-info">
            <span>Network Fee: ~$2.50</span>
            <span>Slippage Tolerance: {slippage}%</span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      {!pricesLoading && !error && (
        <button
          className={`swap-button ${isSwapDisabled ? 'disabled' : ''}`}
          onClick={handleSwap}
          disabled={isSwapDisabled}
        >
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Swapping...</span>
            </div>
          ) : (
            'Swap'
          )}
        </button>
      )}
    </div>
  );
};

export default CurrencySwapForm;