# Dietrix

Dietrix is a comprehensive diet recommendation system that delivers personalized nutrition advice based on individual health conditions, allergies, and dietary preferences. It features a React frontend for an intuitive user interface and a FastAPI backend powered by a RAG (Retrieval-Augmented Generation) pipeline. The system intelligently gathers data through automated web scraping from trusted medical and nutritional sources, processes it using advanced language models, and generates tailored meal plans to support healthy living.

### Data Sources
The system collects dietary information from the following trusted sources:
- **PubMed** (https://pubmed.ncbi.nlm.nih.gov/) - Medical research and clinical studies
- **Food Data Central** (https://fdc.nal.usda.gov/) - USDA nutritional database
- **EatRight** (https://www.eatright.org/) - Academy of Nutrition and Dietetics
- **Harvard Nutrition Source** (https://nutritionsource.hsph.harvard.edu/) - Harvard School of Public Health nutrition guidance


## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework for API development
- **LangChain**: Framework for building LLM applications
- **ChromaDB**: Vector database for storing and retrieving embeddings
- **Groq**: LLM provider for text generation
- **Llama3-8b-8192**: Large Language Model for generating personalized diet recommendations
- **all-MiniLM-L6-v2**: Sentence Transformers embedding model for text vectorization
- **Selenium**: Automated web scraping for collecting dietary data from trusted medical websites


### Frontend
- **React**: JavaScript library for building user interfaces
- **Material-UI**: React component library for consistent design
- **Framer Motion**: Animation library for smooth interactions
- **React Hot Toast**: Toast notifications for user feedback




## Project Structure

```
Dietrix/
├── app/                    # Backend application
│   ├── main.py            # FastAPI application entry point
│   ├── routes.py          # API route definitions
│   ├── rag_pipeline.py    # RAG chain implementation
│   ├── scraping.py        # Web scraping utilities
│   ├── selenium_scraper.py # Selenium-based scraping
│   └── utils.py           # Utility functions
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   ├── package.json       # Frontend dependencies
├── chroma_store/          # Vector database storage
├── venv310/               # Python virtual environment
├── requirements.txt       # Python dependencies
└── README.md             
```



## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Dietrix
```

### 2. Set Up Python Environment
```bash
# Create virtual environment
python -m venv venv310

# Activate virtual environment
# Windows:
venv310\Scripts\activate
# Unix/Linux/Mac:
source venv310/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Set Up Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install --legacy-peer-deps

# Return to project root
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the project root with your API keys:
```
GROQ_API_KEY=your_groq_api_key_here
```

## Usage

#### Backend Server
```bash
# Activate virtual environment
venv310\Scripts\activate  # Windows
source venv310/bin/activate  # Unix/Linux/Mac

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Server
```bash
# Navigate to frontend directory
cd frontend

# Start React development server
npm start
```

### Access Points
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs



