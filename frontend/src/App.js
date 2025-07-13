import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Toaster, toast } from 'react-hot-toast';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  CssBaseline
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Brain, 
  Heart, 
  Shield, 
  Zap, 
  Sparkles, 
  Target, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star
} from 'lucide-react';

// Custom hook to handle ResizeObserver errors
const useResizeObserverFix = () => {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('ResizeObserver loop completed with undelivered notifications') ||
           args[0].includes('ResizeObserver'))) {
        return;
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#4dd8ff',
      dark: '#0099cc',
    },
    secondary: {
      main: '#ff6b9d',
      light: '#ff8ab3',
      dark: '#e6457a',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    h3: {
      fontWeight: 800,
      fontSize: '3rem',
      background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h4: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.8rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.4rem',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 15,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '1.1rem',
          padding: '15px 40px',
          background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #0099cc, #00d4ff)',
            boxShadow: '0 6px 20px rgba(0, 212, 255, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 15,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover': {
              border: '1px solid rgba(0, 212, 255, 0.3)',
            },
            '&.Mui-focused': {
              border: '2px solid #00d4ff',
              boxShadow: '0 0 0 4px rgba(0, 212, 255, 0.1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 15,
          background: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
});

function App() {
  const [healthConditions, setHealthConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isVegetarian, setIsVegetarian] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apply ResizeObserver fix
  useResizeObserverFix();

  const [heroRef, heroInView] = useInView({ 
    threshold: 0.1, 
    triggerOnce: true,
    rootMargin: '100px'
  });
  const [formRef, formInView] = useInView({ 
    threshold: 0.1, 
    triggerOnce: true,
    rootMargin: '100px'
  });

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError('');
    setRecommendations(null);

    try {
      const response = await fetch('http://localhost:8000/get_recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          health_conditions: healthConditions,
          allergies: allergies,
          is_vegetarian: isVegetarian === 'yes'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data);
      toast.success('✨ Recommendations generated successfully!');
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
      toast.error(' Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return healthConditions.trim() !== '' || allergies.trim() !== '';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      
      {/* Static Background with subtle image */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          background: `linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(26,26,26,0.7) 50%, rgba(10,10,10,0.85) 100%), url("/static/bg.jpg") center center / cover no-repeat`,
          willChange: 'unset !important',
          transform: 'none !important',
        }}
      />

      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ 
        background: 'rgba(26, 26, 26, 0.8)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Toolbar>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Brain size={32} color="#00d4ff" />
              <Typography variant="h4" component="h1" sx={{ ml: 2, fontWeight: 800 }}>
                Dietrix
              </Typography>
              <Sparkles size={20} color="#ff6b9d" style={{ marginLeft: 8 }} />
            </Box>
          </motion.div>
          <Typography variant="subtitle1" sx={{ ml: 3, fontWeight: 500, opacity: 0.8 }}>
            AI-Powered Diet Intelligence
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <Box textAlign="center" mb={8}>
            <motion.div variants={itemVariants}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 3 }}>
                <Sparkles style={{ display: 'inline', marginRight: 16 }} />
                Next-Gen Diet Recommendations
                <Sparkles style={{ display: 'inline', marginLeft: 16 }} />
              </Typography>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Typography variant="h6" sx={{ maxWidth: 700, mx: 'auto', mb: 6, opacity: 0.9 }}>
                A balanced diet is the foundation of lifelong health. The right foods can boost your energy, protect your heart, and help prevent disease. Make every meal a step toward a healthier, happier you.
              </Typography>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<Brain size={16} />} 
                  label="AI-Powered" 
                  sx={{ background: 'linear-gradient(45deg, #00d4ff, #0099cc)', color: 'white' }}
                />
                <Chip 
                  icon={<Heart size={16} />} 
                  label="Health-Focused" 
                  sx={{ background: 'linear-gradient(45deg, #ff6b9d, #e6457a)', color: 'white' }}
                />
                <Chip 
                  icon={<Shield size={16} />} 
                  label="Evidence-Based" 
                  sx={{ background: 'linear-gradient(45deg, #00d4ff, #0099cc)', color: 'white' }}
                />
              </Box>
            </motion.div>
          </Box>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          ref={formRef}
          initial="hidden"
          animate={formInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <Paper elevation={0} sx={{ 
            p: 6, 
            borderRadius: 4, 
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 6 
          }}>
            <motion.div variants={itemVariants}>
              <Typography variant="h5" gutterBottom sx={{ mb: 4, textAlign: 'center', fontWeight: 700 }}>
                <Target style={{ display: 'inline', marginRight: 12 }} />
                Your Health Profile
              </Typography>
            </motion.div>
            
            <Grid container spacing={4} alignItems="flex-start">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Health Conditions"
                  multiline
                  rows={4}
                  value={healthConditions}
                  onChange={(e) => setHealthConditions(e.target.value)}
                  placeholder="e.g., Diabetes, High blood pressure, Heart disease, Digestive issues"
                  helperText="Describe any health conditions that affect your diet"
                  variant="outlined"
                  sx={{ mb: { xs: 3, md: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Allergies & Intolerances"
                  multiline
                  rows={4}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g., Peanuts, Gluten, Lactose, Shellfish, Eggs"
                  helperText="List any food allergies or intolerances"
                  variant="outlined"
                  sx={{ mb: { xs: 3, md: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'center' }}>
                <FormControl fullWidth variant="outlined" sx={{ minWidth: 120 }}>
                  <InputLabel id="vegetarian-label" sx={{ fontSize: '1.1rem' }}>
                    Are you vegetarian?
                  </InputLabel>
                  <Select
                    labelId="vegetarian-label"
                    value={isVegetarian}
                    label="Are you vegetarian?"
                    onChange={(e) => setIsVegetarian(e.target.value)}
                    sx={{ fontSize: '1.1rem', minHeight: 56 }}
                  >
                    <MenuItem value="no" sx={{ fontSize: '1.1rem', py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUp size={16} style={{ marginRight: 8 }} />
                        No, I eat meat and fish
                      </Box>
                    </MenuItem>
                    <MenuItem value="yes" sx={{ fontSize: '1.1rem', py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Heart size={16} style={{ marginRight: 8 }} />
                        Yes, I follow a vegetarian diet
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="center" mt={6}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetRecommendations}
                  disabled={!isFormValid() || loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Zap />}
                  sx={{ 
                    px: 6, 
                    py: 2, 
                    fontSize: '1.1rem',
                    background: '#1976d2 !important',
                    color: '#fff !important',
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: 'none',
                    textTransform: 'none',
                    '&:hover': {
                      background: '#1565c0 !important',
                      color: '#fff !important',
                    }
                  }}
                >
                  {loading ? 'Generating AI Insights...' : 'Generate AI Recommendations'}
                </Button>
              </motion.div>
            </Box>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              </motion.div>
            )}
          </Paper>
        </motion.div>

        {/* Recommendations Section */}
        <AnimatePresence>
          {recommendations && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.6 }}
            >
              <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 6, fontWeight: 700 }}>
                <Star style={{ display: 'inline', marginRight: 16, color: '#ff6b9d' }} />
                Your AI-Generated Diet Plan
                <Star style={{ display: 'inline', marginLeft: 16, color: '#ff6b9d' }} />
              </Typography>
              
              <Grid container spacing={4}>
                {/* Dietary Recommendations */}
                {recommendations.dietary_recommendations && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Brain style={{ marginRight: 12, color: '#00d4ff' }} />
                          AI Analysis Overview
                        </Typography>
                        <Box sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                          <ReactMarkdown>{recommendations.dietary_recommendations}</ReactMarkdown>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Meal Suggestions */}
                {recommendations.meal_suggestions && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                          <Clock style={{ marginRight: 12, color: '#00d4ff' }} />
                          Intelligent Meal Schedule
                        </Typography>
                        <Grid container spacing={3}>
                          {recommendations.meal_suggestions.breakfast && (
                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, background: 'rgba(0, 212, 255, 0.1)', borderRadius: 3, height: '100%', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                                <Typography variant="h6" fontWeight="bold" color="secondary.main" gutterBottom>
                                  Breakfast
                                </Typography>
                                <Box sx={{ lineHeight: 1.6 }}>
                                  <ReactMarkdown>{recommendations.meal_suggestions.breakfast}</ReactMarkdown>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                          {recommendations.meal_suggestions.lunch && (
                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, background: 'rgba(255, 107, 157, 0.1)', borderRadius: 3, height: '100%', border: '1px solid rgba(255, 107, 157, 0.2)' }}>
                                <Typography variant="h6" fontWeight="bold" color="secondary.main" gutterBottom>
                                  Lunch
                                </Typography>
                                <Box sx={{ lineHeight: 1.6 }}>
                                  <ReactMarkdown>{recommendations.meal_suggestions.lunch}</ReactMarkdown>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                          {recommendations.meal_suggestions.dinner && (
                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, background: 'rgba(0, 212, 255, 0.1)', borderRadius: 3, height: '100%', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                                <Typography variant="h6" fontWeight="bold" color="secondary.main" gutterBottom>
                                  Dinner
                                </Typography>
                                <Box sx={{ lineHeight: 1.6 }}>
                                  <ReactMarkdown>{recommendations.meal_suggestions.dinner}</ReactMarkdown>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                          {recommendations.meal_suggestions.snacks && (
                            <Grid item xs={12} md={6}>
                              <Box sx={{ p: 3, background: 'rgba(255, 107, 157, 0.1)', borderRadius: 3, height: '100%', border: '1px solid rgba(255, 107, 157, 0.2)' }}>
                                <Typography variant="h6" fontWeight="bold" color="secondary.main" gutterBottom>
                                  Snacks
                                </Typography>
                                <Box sx={{ lineHeight: 1.6 }}>
                                  <ReactMarkdown>{recommendations.meal_suggestions.snacks}</ReactMarkdown>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Foods to Avoid */}
                {recommendations.foods_to_avoid && recommendations.foods_to_avoid.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h5" gutterBottom color="error" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <AlertTriangle style={{ marginRight: 12 }} />
                          Avoid These Foods
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1.5}>
                          {recommendations.foods_to_avoid.map((food, index) => (
                            <Chip 
                              key={index} 
                              label={food} 
                              color="error" 
                              variant="outlined" 
                              sx={{ 
                                fontSize: '1rem', 
                                py: 1, 
                                px: 1.5,
                                borderWidth: 2,
                                background: 'rgba(244, 67, 54, 0.1)',
                                '&:hover': {
                                  backgroundColor: 'error.light',
                                  color: 'white'
                                }
                              }} 
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Recommended Foods */}
                {recommendations.recommended_foods && recommendations.recommended_foods.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h5" gutterBottom color="success.main" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <CheckCircle style={{ marginRight: 12 }} />
                          Recommended Foods
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1.5}>
                          {recommendations.recommended_foods.map((food, index) => (
                            <Chip 
                              key={index} 
                              label={food} 
                              color="success" 
                              variant="outlined" 
                              sx={{ 
                                fontSize: '1rem', 
                                py: 1, 
                                px: 1.5,
                                borderWidth: 2,
                                background: 'rgba(76, 175, 80, 0.1)',
                                '&:hover': {
                                  backgroundColor: 'success.light',
                                  color: 'white'
                                }
                              }} 
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Health Advice */}
                {recommendations.health_advice && (
                  <Grid item xs={12}>
                    <Card sx={{ 
                      border: '3px solid', 
                      borderColor: 'primary.main',
                      background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 107, 157, 0.1) 100%)'
                    }}>
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                          <Shield style={{ marginRight: 12, color: '#00d4ff' }} />
                          Evidence-Based Health Advice from Real Studies
                        </Typography>
                        <Box sx={{ 
                          background: 'rgba(26, 26, 26, 0.8)', 
                          color: 'text.primary', 
                          p: 4, 
                          borderRadius: 3,
                          fontSize: '1.1rem',
                          lineHeight: 1.8,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          '& ul': {
                            paddingLeft: 3,
                            margin: '1rem 0'
                          },
                          '& li': {
                            marginBottom: '0.5rem',
                            paddingLeft: '0.5rem'
                          },
                          '& p': {
                            marginBottom: '1rem'
                          }
                        }}>
                          <ReactMarkdown>{recommendations.health_advice}</ReactMarkdown>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </ThemeProvider>
  );
}

export default App;
